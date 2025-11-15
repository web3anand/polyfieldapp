/**
 * Vercel Serverless Function to proxy Polymarket API requests
 * This bypasses CORS restrictions in production
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get query parameters
  const { limit = '100', offset = '0', ...otherParams } = req.query;

  try {
    // Build Polymarket API URL
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      active: 'true',
      closed: 'false',
      ...Object.fromEntries(
        Object.entries(otherParams).map(([key, value]) => [
          key,
          Array.isArray(value) ? value[0] : String(value),
        ])
      ),
    });

    const polymarketUrl = `https://gamma-api.polymarket.com/markets?${params.toString()}`;

    // Fetch from Polymarket API
    const response = await fetch(polymarketUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolyFieldApp/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Polymarket API error: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return the data
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Polymarket proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from Polymarket API',
      message: error.message,
    });
  }
}

