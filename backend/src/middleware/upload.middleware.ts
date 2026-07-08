import multer from 'multer';
import os from 'os';
import { env } from '../config/env.config.js';

export const uploadMiddleware = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, // Configurable limit in MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV mime-types or .csv file extensions
    const isCsv = file.mimetype === 'text/csv' || 
                  file.mimetype === 'application/vnd.ms-excel' ||
                  file.originalname.toLowerCase().endsWith('.csv');
                  
    if (isCsv) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});
