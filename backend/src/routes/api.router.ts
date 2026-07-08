import { Router } from 'express';
import healthRouter from './health.router.js';
import importRouter from './import.router.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/import', importRouter);

export default router;
