/**
 * CLOB API Routes
 * Proxies requests to Polymarket CLOB API
 */

import express, { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';

const router = express.Router();
const CLOB_API_BASE = 'https://clob.polymarket.com';

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
 * GET /api/clob/markets
 * Get all markets or filter by condition_id
 */
router.get('/markets', async (req: Request, res: Response) => {
  try {
    const { condition_id } = req.query;
    const url = condition_id
      ? `${CLOB_API_BASE}/markets?condition_id=${condition_id as string}`
      : `${CLOB_API_BASE}/markets`;
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
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
 * GET /api/clob/book
 * Get order book for a token
 */
router.get('/book', async (req: Request, res: Response) => {
  try {
    const { token_id } = req.query;
    
    if (!token_id) {
      return res.status(400).json({
        error: 'Missing token_id parameter',
      });
    }
    
    const response = await axios.get(`${CLOB_API_BASE}/book?token_id=${token_id as string}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    return res.json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching order book:', axiosError.message);
    return res.status(axiosError.response?.status || 500).json({
      error: 'Failed to fetch order book',
      message: axiosError.message,
    });
  }
});

/**
 * GET /api/clob/trades
 * Get trades for a token
 */
router.get('/trades', async (req: Request, res: Response) => {
  try {
    const { token_id, limit = 100 } = req.query;
    
    if (!token_id) {
      return res.status(400).json({
        error: 'Missing token_id parameter',
      });
    }
    
    const response = await axios.get(
      `${CLOB_API_BASE}/trades?token_id=${token_id as string}&limit=${limit as string}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    return res.json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching trades:', axiosError.message);
    return res.status(axiosError.response?.status || 500).json({
      error: 'Failed to fetch trades',
      message: axiosError.message,
    });
  }
});

/**
 * POST /api/clob/orders
 * Place a new order
 */
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const authHeaders = getAuthHeaders(req);
    
    if (Object.keys(authHeaders).length === 0) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide authentication headers',
      });
    }
    
    const response = await axios.post(`${CLOB_API_BASE}/orders`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      timeout: 30000,
    });
    
    return res.json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error placing order:', axiosError.message);
    return res.status(axiosError.response?.status || 500).json({
      error: 'Failed to place order',
      message: (axiosError.response?.data as any)?.message || axiosError.message,
    });
  }
});

/**
 * DELETE /api/clob/orders/:orderId
 * Cancel an order
 */
router.delete('/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const authHeaders = getAuthHeaders(req);
    
    if (Object.keys(authHeaders).length === 0) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }
    
    const response = await axios.delete(`${CLOB_API_BASE}/orders/${orderId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      timeout: 10000,
    });
    
    return res.json(response.data || { success: true });
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error canceling order:', axiosError.message);
    return res.status(axiosError.response?.status || 500).json({
      error: 'Failed to cancel order',
      message: (axiosError.response?.data as any)?.message || axiosError.message,
    });
  }
});

/**
 * GET /api/clob/orders
 * Get user orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { user } = req.query;
    const authHeaders = getAuthHeaders(req);
    
    if (!user) {
      return res.status(400).json({
        error: 'Missing user parameter',
      });
    }
    
    if (Object.keys(authHeaders).length === 0) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }
    
    const response = await axios.get(
      `${CLOB_API_BASE}/orders?user=${user as string}`,
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
    console.error('Error fetching user orders:', axiosError.message);
    return res.status(axiosError.response?.status || 500).json({
      error: 'Failed to fetch user orders',
      message: axiosError.message,
    });
  }
});

/**
 * POST /api/clob/validate
 * Validate provided L2 (API key + passphrase + signature) by forwarding
 * to a safe read-only endpoint on the CLOB API. Returns { valid: boolean }
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const authHeaders = getAuthHeaders(req);

    if (Object.keys(authHeaders).length === 0) {
      return res.status(401).json({ valid: false, error: 'Missing authentication headers' });
    }

    // Use a harmless read-only endpoint that requires auth: GET /orders?user={zero}
    // We use an impossible user address as the read target so we don't affect real data.
    const testUser = '0x0000000000000000000000000000000000000000';

    const response = await axios.get(`${CLOB_API_BASE}/orders?user=${testUser}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      timeout: 10000,
    });

    // If we get any 2xx response, consider the credentials valid
    return res.json({ valid: true, status: response.status });
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Validation error:', axiosError.message);
    return res.status(axiosError.response?.status || 400).json({
      valid: false,
      message: (axiosError.response?.data as any) || axiosError.message,
    });
  }
});

export { router as clobRoutes };

