/**
 * Data API Routes
 * Proxies requests to Polymarket Data API
 */

import express, { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';

const router = express.Router();
const DATA_API_BASE = 'https://data-api.polymarket.com';

/**
 * Extract Polymarket auth headers from request
 */
function getAuthHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // L2 Authentication (API Key)
  if (req.headers['poly-api-key']) {
    headers['POLY_API_KEY'] = req.headers['poly-api-key'] as string;
  }
  if (req.headers['poly-passphrase']) {
    headers['POLY_PASSPHRASE'] = req.headers['poly-passphrase'] as string;
  }
  if (req.headers['poly-signature']) {
    headers['POLY_SIGNATURE'] = req.headers['poly-signature'] as string;
  }
  
  // L1 Authentication (Private Key)
  if (req.headers['poly-address']) {
    headers['POLY_ADDRESS'] = req.headers['poly-address'] as string;
  }
  if (req.headers['poly-timestamp']) {
    headers['POLY_TIMESTAMP'] = req.headers['poly-timestamp'] as string;
  }
  if (req.headers['poly-nonce']) {
    headers['POLY_NONCE'] = req.headers['poly-nonce'] as string;
  }
  
  return headers;
}

/**
 * GET /api/data/markets
 * Get all markets
 */
router.get('/markets', async (req: Request, res: Response) => {
  try {
    const { limit = 100, offset = 0, active, closed } = req.query;
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (active) params.append('active', active.toString());
    if (closed) params.append('closed', closed.toString());
    
    const response = await axios.get(
      `https://gamma-api.polymarket.com/markets?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    
    res.json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching markets:', axiosError.message);
    res.status(axiosError.response?.status || 500).json({
      error: 'Failed to fetch markets',
      message: axiosError.message,
    });
  }
});

/**
 * GET /api/data/holdings
 * Get user holdings
 */
router.get('/holdings', async (req: Request, res: Response) => {
  try {
    const { user } = req.query;
    
    if (!user) {
      return res.status(400).json({
        error: 'Missing user parameter',
      });
    }
    
    const authHeaders = getAuthHeaders(req);
    
    if (Object.keys(authHeaders).length === 0) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }
    
    const response = await axios.get(
      `${DATA_API_BASE}/holdings?user=${user as string}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        timeout: 10000,
      }
    );
    
    return res.json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching holdings:', axiosError.message);
    return res.status(axiosError.response?.status || 500).json({
      error: 'Failed to fetch holdings',
      message: axiosError.message,
    });
  }
});

export { router as dataRoutes };

