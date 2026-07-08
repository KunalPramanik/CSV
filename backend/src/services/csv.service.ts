import fs from 'fs';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export class CSVService {
  /**
   * Creates a readable object stream from a CSV file path.
   * Trims whitespace from headers.
   * @param filePath Absolute path of the CSV file on disk.
   */
  createParserStream(filePath: string): Readable {
    return fs.createReadStream(filePath)
      .pipe(csvParser({
        mapHeaders: ({ header }) => header.trim(),
      }));
  }
}
