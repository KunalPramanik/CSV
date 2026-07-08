import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { CSVService } from '../services/csv.service.js';

describe('CSV Service', () => {
  it('should parse CSV stream and emit row objects', async () => {
    const csvService = new CSVService();
    
    // Create a temporary CSV file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `test-${Date.now()}.csv`);
    const csvContent = `Email,Phone,Remarks,Company\r\njohn@example.com,1234567,Needs follow up,Acme Corp\r\njane@example.com,9876543,Sale completed,Globe Corp`;
    
    fs.writeFileSync(tempFilePath, csvContent, 'utf-8');

    try {
      const stream = csvService.createParserStream(tempFilePath);
      const rows: any[] = [];

      for await (const row of stream) {
        rows.push(row);
      }

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({
        Email: 'john@example.com',
        Phone: '1234567',
        Remarks: 'Needs follow up',
        Company: 'Acme Corp',
      });
      expect(rows[1]).toEqual({
        Email: 'jane@example.com',
        Phone: '9876543',
        Remarks: 'Sale completed',
        Company: 'Globe Corp',
      });
    } finally {
      // Clean up the test file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});
