/**
 * Health Check Handler
 */

import { Request, Response } from 'express';
import { logger } from '../services/logger.js';

export async function healthCheck(req: Request, res: Response) {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'coachartie-email',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
    
    logger.debug('Health check performed', healthData);
    res.json(healthData);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed'
    });
  }
}