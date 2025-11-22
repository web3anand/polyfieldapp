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

// Removed: OrderParams interface (no longer needed - using pre-signed orders from client)

/**
 * POST /api/orders/submit
 * Submit a pre-signed order with Builder attribution headers
 * Order is already signed by user's Privy wallet (EIP-712)
 * Server adds Builder headers for attribution tracking only
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const signedOrder = req.body;

    // Validate that we have a signed order
    if (!signedOrder || !signedOrder.signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing signed order or signature',
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

    console.log('📝 Submitting pre-signed order with Builder attribution');

    // Prepare payload with required fields per Polymarket CLOB docs
    const payload = {
      order: signedOrder,
      owner: signedOrder.maker, // User's wallet address (not API key)
      orderType: 'GTC', // Good-Til-Cancelled
    };

    // Create Builder API HMAC signature for attribution
    const timestamp = Date.now().toString();
    const method = 'POST';
    const path = '/order';
    const body = JSON.stringify(payload);
    const message = timestamp + method + path + body;
    
    const crypto = await import('crypto');
    const builderSignature = crypto.createHmac('sha256', POLYMARKET_SECRET)
      .update(message)
      .digest('hex');

    // Submit order to CLOB with user's signature + Builder attribution headers
    const response = await axios.post(
      `${CLOB_API_BASE}/order`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          // Builder attribution headers
          'POLY_BUILDER_API_KEY': POLYMARKET_API_KEY,
          'POLY_BUILDER_TIMESTAMP': timestamp,
          'POLY_BUILDER_PASSPHRASE': POLYMARKET_PASSPHRASE,
          'POLY_BUILDER_SIGNATURE': builderSignature,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Order submitted successfully:', response.data);

    return res.status(200).json({
      success: true,
      orderId: response.data.orderID || response.data.id,
      transactionHash: response.data.transactionHash,
      status: response.data.status || 'submitted',
      message: 'Order placed successfully with Builder attribution',
    });

  } catch (error: any) {
    console.error('❌ Error submitting order:', error);
    
    // Handle Axios errors with response data
    if (error.response) {
      return res.status(error.response.status || 500).json({
        success: false,
        error: error.response.data?.error || error.message,
        details: error.response.data,
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit order',
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
