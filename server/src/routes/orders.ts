/**
 * Orders API Routes (Direct)
 * Complete order placement with server-side signing
 */

import express, { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import { placeOrder } from '../services/polymarket.js';

const router = express.Router();
const CLOB_API_BASE = 'https://clob.polymarket.com';

// Load environment variables
const POLYMARKET_PRIVATE_KEY = process.env.POLYMARKET_PRIVATE_KEY || '';
const POLYMARKET_API_KEY = process.env.POLYMARKET_API_KEY || '';
const POLYMARKET_SECRET = process.env.POLYMARKET_SECRET || '';
const POLYMARKET_PASSPHRASE = process.env.POLYMARKET_PASSPHRASE || '';

interface OrderParams {
  tokenId: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: number;
  userAddress: string;
  feeRateBps?: number;
  nonce?: number;
  expiration?: number;
}

/**
 * POST /api/orders
 * Place a new order with server-side signing
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      tokenId,
      side,
      size,
      price,
      userAddress,
      feeRateBps = 0,
      nonce = Date.now(),
      expiration = Math.floor(Date.now() / 1000) + 86400,
    }: OrderParams = req.body;

    // Validate required fields
    if (!tokenId || !side || !size || !price || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tokenId, side, size, price, userAddress',
      });
    }

    // Validate side
    if (side !== 'BUY' && side !== 'SELL') {
      return res.status(400).json({
        success: false,
        error: 'Invalid side. Must be BUY or SELL',
      });
    }

    // Validate price range
    if (price < 0 || price > 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid price. Must be between 0 and 1',
      });
    }

    // Check if private key is configured
    if (!POLYMARKET_PRIVATE_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Server not configured for trading. Contact administrator.',
        hint: 'POLYMARKET_PRIVATE_KEY environment variable not set',
      });
    }

    console.log('📝 Placing order:', { tokenId, side, size, price, userAddress });

    // Place order using server-side signing
    const result = await placeOrder(
      {
        tokenId,
        side,
        size,
        price,
        userAddress,
        feeRateBps,
        nonce,
        expiration,
      },
      POLYMARKET_PRIVATE_KEY,
      POLYMARKET_API_KEY || undefined,
      POLYMARKET_SECRET || undefined,
      POLYMARKET_PASSPHRASE || undefined
    );

    return res.status(200).json({
      success: true,
      orderId: result.orderId,
      message: 'Order placed successfully',
      txHash: result.data?.transactionHash,
    });

  } catch (error: any) {
    console.error('❌ Error placing order:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to place order',
    });
  }
});

/**
 * GET /api/orders
 * Get user orders
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user } = req.query;
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Missing user parameter',
      });
    }

    const response = await axios.get(
      `${CLOB_API_BASE}/orders?user=${user as string}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return res.json({
      success: true,
      orders: response.data,
    });
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching orders:', axiosError.message);
    return res.status(axiosError.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: axiosError.message,
    });
  }
});

export { router as ordersRoutes };
