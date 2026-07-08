import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import multer from 'multer';
import { ImportController } from '../controllers/import.controller.js';
import { ILLMProvider } from '../services/llm/provider.interface.js';
import { leadRepository } from '../repositories/lead.repository.memory.js';
import { errorHandler } from '../middleware/error-handler.middleware.js';

class MockLLMProvider implements ILLMProvider {
  async mapBatch(rows: Record<string, any>[], systemPrompt: string): Promise<Record<string, any>[]> {
    return rows.map((row) => ({
      email: row.Email || row['Client Email'] || '',
      mobile: row.Phone || row['Mobile Phone'] || '',
      crm_note: row.Remarks || '',
      lead_owner: row.Executive || 'Unassigned',
      company: row.Company || 'Unknown',
      lead_status: 'GOOD_LEAD_FOLLOW_UP',
      data_source: 'eden_park',
    }));
  }
}

describe('Import Integration API', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Inject Mock LLM Provider into ImportController
    const mockProvider = new MockLLMProvider();
    const importController = new ImportController(mockProvider);
    
    const upload = multer({ dest: os.tmpdir() });

    // Mount API route hooks
    app.post('/api/import', upload.single('file'), importController.importCsv);
    app.get('/api/import/leads', importController.getLeads);
    app.delete('/api/import/leads', importController.clearLeads);
    
    app.use(errorHandler);
  });

  it('should accept CSV upload and stream progress events via SSE', async () => {
    // Clear memory database
    await leadRepository.clear();

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `test-upload-${Date.now()}.csv`);
    const csvContent = `Email,Phone,Remarks,Company\r\nwalter@white.com,9876543210,Blue product,White Enterprises`;
    fs.writeFileSync(tempFilePath, csvContent, 'utf-8');

    try {
      const response = await request(app)
        .post('/api/import')
        .attach('file', tempFilePath);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      
      const bodyText = response.text;
      expect(bodyText).toContain('event: connection_established');
      expect(bodyText).toContain('event: batch_progress');
      expect(bodyText).toContain('event: import_complete');

      // Verify database state
      const leads = await leadRepository.findAll();
      expect(leads).toHaveLength(1);
      expect(leads[0].email).toBe('walter@white.com');
      expect(leads[0].company).toBe('White Enterprises');
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});
