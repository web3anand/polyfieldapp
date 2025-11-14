/**
 * Vercel Serverless Function: /api/
 * API health check endpoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: 'ok',
    message: 'PolyField API is running',
    version: '1.0.0',
    endpoints: {
      markets: '/api/markets',
      positions: '/api/positions',
      closedPositions: '/api/positions/closed',
      tradeHistory: '/api/trades/history',
      transactions: '/api/transactions',
    },
  });
}
