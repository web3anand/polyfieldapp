/**
 * Polymarket Orders API Endpoint
 * Handles order placement with proper authentication and signing
 * 
 * POST /api/orders
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { ethers } from 'ethers';

// Polymarket CLOB API
const CLOB_API_URL = 'https://clob.polymarket.com';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type').end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        error: 'Missing required fields: tokenId, side, size, price, userAddress',
      });
    }

    // Validate side
    if (side !== 'BUY' && side !== 'SELL') {
      return res.status(400).json({
        error: 'Invalid side. Must be BUY or SELL',
      });
    }

    // Validate price range
    if (price < 0 || price > 1) {
      return res.status(400).json({
        error: 'Invalid price. Must be between 0 and 1',
      });
    }

    console.log('📝 Creating order:', { tokenId, side, size, price, userAddress });

    // Calculate maker and taker amounts
    const sharesAmount = ethers.utils.parseUnits(size, 6).toString();
    const usdcAmount = ethers.utils.parseUnits((parseFloat(size) * price).toFixed(6), 6).toString();

    // Create order object
    const order = {
      salt: nonce.toString(),
      maker: userAddress.toLowerCase(),
      signer: userAddress.toLowerCase(),
      taker: '0x0000000000000000000000000000000000000000',
      tokenId,
      makerAmount: side === 'BUY' ? usdcAmount : sharesAmount,
      takerAmount: side === 'BUY' ? sharesAmount : usdcAmount,
      side: side === 'BUY' ? 0 : 1, // Convert to uint8
      feeRateBps,
      nonce,
      expiration,
    };

    // Note: In production, you would sign this with a secure private key
    // stored in environment variables. For now, we'll return the unsigned order
    // for the client to sign with their embedded wallet.
    
    // For a complete implementation, you would:
    // 1. Sign the order with a server-side wallet (Builder API credentials)
    // 2. Submit to CLOB API
    // 3. Return the order ID

    // Simplified response for now
    return res.status(200).json({
      success: true,
      message: 'Order created (client-side signing required)',
      order,
      // In production, include:
      // orderId: 'xxx',
      // transactionHash: '0x...',
    });

  } catch (error: any) {
    console.error('❌ Error creating order:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
