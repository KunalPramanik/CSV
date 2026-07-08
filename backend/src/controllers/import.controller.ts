import { Request, Response, NextFunction } from 'express';
import { ImportCoordinatorService } from '../services/import-coordinator.service.js';
import { leadRepository } from '../repositories/lead.repository.memory.js';
import { OpenAIProvider } from '../services/llm/openai.provider.js';
import { ILLMProvider } from '../services/llm/provider.interface.js';
import { logger } from '../config/logger.js';

export class ImportController {
  private coordinatorService: ImportCoordinatorService;
  private provider: ILLMProvider;

  constructor(customProvider?: ILLMProvider) {
    // Inject mock provider in tests, or default to OpenAIProvider in production
    this.provider = customProvider || new OpenAIProvider();
    this.coordinatorService = new ImportCoordinatorService(leadRepository, this.provider);
  }

  /**
   * Accepts multipart file upload and streams progress events using Server-Sent Events (SSE).
   */
  importCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'No CSV file uploaded.',
      });
      return;
    }

    const filePath = req.file.path;
    
    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Prevent proxy buffering
    res.flushHeaders();

    logger.info({ file: req.file, reqId: req.id }, 'Starting CSV import process');

    // Keep connection alive with SSE comment heartbeat
    const heartbeatInterval = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    let isAborted = false;
    
    req.on('close', () => {
      logger.warn({ reqId: req.id }, 'SSE stream connection closed by client');
      isAborted = true;
      clearInterval(heartbeatInterval);
    });

    const sendEvent = (event: string, data: any) => {
      if (isAborted) return;
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendEvent('connection_established', { jobId: req.id });

      // Run import pipeline
      await this.coordinatorService.runImport(filePath, {
        batchSize: 20,
        concurrencyLimit: 3,
        onProgress: (event, data) => {
          if (isAborted) return;
          sendEvent(event, data);
        }
      });

    } catch (err: any) {
      logger.error({ error: err.message, reqId: req.id }, 'Import coordinator failed');
      sendEvent('error', { message: err.message || 'Import job failed' });
    } finally {
      clearInterval(heartbeatInterval);
      if (!isAborted) {
        res.end();
      }
    }
  };

  /**
   * Retrieves all imported CRM leads from the repository.
   */
  getLeads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leads = await leadRepository.findAll();
      res.status(200).json({
        status: 'success',
        results: leads.length,
        data: leads,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Clears all leads from the repository database.
   */
  clearLeads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await leadRepository.clear();
      res.status(200).json({
        status: 'success',
        message: 'CRM Lead database cleared.',
      });
    } catch (err) {
      next(err);
    }
  };
}
export const importController = new ImportController();
