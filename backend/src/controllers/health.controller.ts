import { Request, Response } from 'express';

export class HealthController {
  /**
   * Simple system health check.
   */
  check(req: Request, res: Response) {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}
