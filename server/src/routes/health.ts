/**
 * Health Check Routes
 */

import express, { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';

const router = express.Router();
const CLOB_API_BASE = 'https://clob.polymarket.com';

/**
 * GET /health
 * Basic health check
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * GET /health/clob
 * Check CLOB API connectivity
 */
router.get('/clob', async (_req: Request, res: Response) => {
  try {
    await axios.get(`${CLOB_API_BASE}/markets?limit=1`, {
      timeout: 5000,
    });
    
    res.json({
      status: 'healthy',
      clobApi: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const axiosError = error as AxiosError;
    res.status(503).json({
      status: 'unhealthy',
      clobApi: 'disconnected',
      error: axiosError.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as healthRoutes };

