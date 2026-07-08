import fs from 'fs';
import { ILLMProvider } from './llm/provider.interface.js';
import { CSVService } from './csv.service.js';
import { ValidationService } from './validation.service.js';
import { ILeadRepository } from '../repositories/lead.repository.interface.js';
import { withRetry } from '../utils/retry.js';
import { createLimiter } from '../utils/concurrency.js';
import { BatchTransformStream } from '../utils/batcher.js';
import { CRM_SYSTEM_PROMPT } from '../prompts/crm.prompt.js';
import { ValidationError, CRMLeadInput } from '../types/index.js';
import { logger } from '../config/logger.js';

export class ImportCoordinatorService {
  private csvService = new CSVService();
  private validationService = new ValidationService();

  constructor(
    private leadRepository: ILeadRepository,
    private llmProvider: ILLMProvider
  ) {}

  /**
   * Executes the CSV import job.
   * Parses the file, maps data semantically using LLM batches, validates them,
   * stores valid CRM leads, and emits streaming progress.
   */
  async runImport(
    filePath: string,
    options: {
      batchSize?: number;
      concurrencyLimit?: number;
      onProgress: (event: 'batch_progress' | 'import_complete' | 'error', data: any) => void;
    }
  ): Promise<void> {
    const { batchSize = 20, concurrencyLimit = 3, onProgress } = options;
    const startTime = Date.now();
    const processedEmails = new Set<string>();

    let batchCount = 0;
    let totalProcessedCount = 0;
    let totalSuccessCount = 0;
    let totalFailedCount = 0;

    const limit = createLimiter(concurrencyLimit);
    const promises: Promise<void>[] = [];

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Upload file not found on disk: ${filePath}`);
      }

      const csvStream = this.csvService.createParserStream(filePath);
      const batchStream = csvStream.pipe(new BatchTransformStream(batchSize));

      for await (const batch of batchStream) {
        batchCount++;
        const currentBatchIndex = batchCount;
        const currentBatchSize = batch.length;

        const promise = limit(async () => {
          logger.info({ batchIndex: currentBatchIndex }, 'Processing batch');
          
          let successCount = 0;
          let failureCount = 0;
          const errors: ValidationError[] = [];
          const validLeads: CRMLeadInput[] = [];

          try {
            // Call LLM mapping with exponential backoff retries
            const mappedRows = await withRetry(
              () => this.llmProvider.mapBatch(batch, CRM_SYSTEM_PROMPT),
              {
                maxAttempts: 3,
                initialDelayMs: 1000,
                onRetry: (err, attempt) => {
                  logger.warn(
                    { batchIndex: currentBatchIndex, attempt, error: err.message },
                    'Retrying batch LLM call'
                  );
                },
              }
            );

            // Validate mapped outputs
            mappedRows.forEach((row, index) => {
              const rowNumber = (currentBatchIndex - 1) * batchSize + index + 1;
              try {
                const validated = this.validationService.validateLead(row);
                
                // Deduplicate within the active import scope
                if (processedEmails.has(validated.email)) {
                  errors.push({
                    rowNumber,
                    errors: [`Duplicate lead: ${validated.email} has already been imported.`],
                    rowData: row,
                  });
                  failureCount++;
                } else {
                  processedEmails.add(validated.email);
                  validLeads.push(validated);
                  successCount++;
                }
              } catch (valError: any) {
                const errorMessages = valError.errors
                  ? valError.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
                  : [valError.message || 'Validation failed'];

                errors.push({
                  rowNumber,
                  errors: errorMessages,
                  rowData: row,
                });
                failureCount++;
              }
            });

            // Persist valid CRM leads
            if (validLeads.length > 0) {
              await this.leadRepository.createMany(validLeads);
            }
          } catch (batchError: any) {
            logger.error(
              { batchIndex: currentBatchIndex, error: batchError.message },
              'Batch failed processing'
            );
            
            // Record all rows in this batch as failed
            batch.forEach((row: any, index: number) => {
              const rowNumber = (currentBatchIndex - 1) * batchSize + index + 1;
              errors.push({
                rowNumber,
                errors: [`Batch processing failed: ${batchError.message}`],
                rowData: row,
              });
              failureCount++;
            });
          }

          // Update metrics
          totalProcessedCount += currentBatchSize;
          totalSuccessCount += successCount;
          totalFailedCount += failureCount;

          // Emit batch completion update
          onProgress('batch_progress', {
            batchIndex: currentBatchIndex,
            successCount,
            failureCount,
            totalProcessed: currentBatchSize,
            errors,
          });
        });

        promises.push(promise);
      }

      // Wait for all outstanding batch tasks to resolve
      await Promise.all(promises);

      // Clean up upload temp file
      try {
        await fs.promises.unlink(filePath);
        logger.info({ filePath }, 'Cleaned up upload temp file');
      } catch (err: any) {
        logger.warn({ filePath, error: err.message }, 'Failed to delete temp file');
      }

      const durationMs = Date.now() - startTime;
      logger.info(
        {
          totalProcessed: totalProcessedCount,
          totalSuccess: totalSuccessCount,
          totalFailed: totalFailedCount,
          durationMs,
        },
        'Import job completed successfully'
      );

      onProgress('import_complete', {
        totalProcessed: totalProcessedCount,
        totalSuccess: totalSuccessCount,
        totalFailed: totalFailedCount,
        processingTimeMs: durationMs,
      });
    } catch (streamError: any) {
      logger.error({ error: streamError.message }, 'Import stream failed');
      onProgress('error', { message: `Import failed: ${streamError.message}` });
      
      // Clean up temp file on failure
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (err: any) {
        // Ignore
      }
    }
  }
}
