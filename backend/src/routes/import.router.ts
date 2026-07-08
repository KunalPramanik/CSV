import { Router } from 'express';
import { importController } from '../controllers/import.controller.js';
import { importLimiter } from '../middleware/rate-limiter.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

// Upload CSV file and initiate streaming import job
router.post(
  '/',
  importLimiter,
  uploadMiddleware.single('file'),
  importController.importCsv
);

// Fetch all imported CRM leads
router.get('/leads', importController.getLeads);

// Clear lead storage database
router.delete('/leads', importController.clearLeads);

export default router;
