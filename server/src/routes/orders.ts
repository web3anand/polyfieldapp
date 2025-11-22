/**
 * Orders API Routes (Direct)
 * Order placement using Polymarket Builder API credentials
 */

import express, { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';

const router = express.Router();
const CLOB_API_BASE = 'https://clob.polymarket.com';

// Load Builder API credentials from environment
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

    // Check if Builder API credentials are configured
    if (!POLYMARKET_API_KEY || !POLYMARKET_SECRET || !POLYMARKET_PASSPHRASE) {
      return res.status(503).json({
        success: false,
        error: 'Server not configured for trading. Contact administrator.',
        hint: 'POLYMARKET_API_KEY, SECRET, and PASSPHRASE required',
      });
    }

    console.log('📝 Placing order:', { tokenId, side, size, price, userAddress });

    // Create HMAC signature for Builder API auth
    const timestamp = Date.now().toString();
    const method = 'POST';
    const path = '/orders';
    
    const orderPayload = {
      salt: nonce.toString(),
      maker: userAddress.toLowerCase(),
      signer: userAddress.toLowerCase(),
      taker: '0x0000000000000000000000000000000000000000',
      tokenId,
      makerAmount: side === 'BUY' 
        ? Math.floor(parseFloat(size) * price * 1_000_000).toString()
        : Math.floor(parseFloat(size) * 1_000_000).toString(),
      takerAmount: side === 'BUY'
        ? Math.floor(parseFloat(size) * 1_000_000).toString()
        : Math.floor(parseFloat(size) * price * 1_000_000).toString(),
      side: side === 'BUY' ? 0 : 1,
      feeRateBps,
      nonce,
      expiration,
    };

    const body = JSON.stringify(orderPayload);
    const message = timestamp + method + path + body;
    
    // Create HMAC signature
    const crypto = await import('crypto');
    const signature = crypto.createHmac('sha256', POLYMARKET_SECRET)
      .update(message)
      .digest('hex');

    // Submit order to CLOB with Builder headers
    const response = await axios.post(
      `${CLOB_API_BASE}/orders`,
      orderPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Origin': 'https://polymarket.com',
          'Referer': 'https://polymarket.com/',
          'POLY_BUILDER_API_KEY': POLYMARKET_API_KEY,
          'POLY_BUILDER_TIMESTAMP': timestamp,
          'POLY_BUILDER_PASSPHRASE': POLYMARKET_PASSPHRASE,
          'POLY_BUILDER_SIGNATURE': signature,
        },
        timeout: 30000,
      }
    );

    return res.status(200).json({
      success: true,
      orderId: response.data.orderID || response.data.id,
      message: 'Order placed successfully',
      data: response.data,
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
