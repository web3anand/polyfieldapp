/**
 * Vercel Serverless Function: /api/markets
 * Proxies Polymarket API to avoid CORS issues
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const POLYMARKET_API = 'https://gamma-api.polymarket.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract query parameters
    const { limit = '100', offset = '0' } = req.query;

    // Build Polymarket API URL
    const polymarketUrl = `${POLYMARKET_API}/markets?limit=${limit}&offset=${offset}&active=true&closed=false`;

    console.log(`Fetching from Polymarket API: ${polymarketUrl}`);

    // Fetch from Polymarket API
    const response = await fetch(polymarketUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Polymarket API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `Polymarket API error: ${response.statusText}`,
      });
    }

    // Parse JSON response
    const data = await response.json();

    // Return the data
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching markets:', error);
    return res.status(500).json({
      error: 'Failed to fetch markets',
      message: error.message,
    });
  }
}
