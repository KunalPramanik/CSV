import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export interface CustomError extends Error {
  statusCode?: number;
  details?: any;
}

export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      statusCode,
      details: err.details,
    },
    req: {
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
  }, 'Unhandled request error');

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(err.details ? { details: err.details } : {}),
  });
}
