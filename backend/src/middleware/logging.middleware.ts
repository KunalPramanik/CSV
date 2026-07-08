import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';

// Extend Express Request interface to include a custom id string
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  req.id = uuidv4();
  const startTime = Date.now();

  logger.info({
    reqId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, 'Incoming request');

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      reqId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      durationMs: duration,
    }, 'Request completed');
  });

  next();
}
