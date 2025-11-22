/**
 * Markets Service
 * Integrates Polymarket API with our backend
 * 
 * Note: Polymarket API has CORS restrictions, so requests must go through
 * backend proxy. This service will use backend proxy when available.
 */

import { getMarketsViaProxy } from './polymarketProxy';
import type { Market } from '../types';

// Helper functions
function formatLiquidity(liquidity: number): string {
  if (liquidity >= 1000000) {
    return `$${(liquidity / 1000000).toFixed(1)}M`;
  } else if (liquidity >= 1000) {
    return `$${(liquidity / 1000).toFixed(0)}k`;
  }
  return `$${liquidity.toFixed(0)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Get markets from backend API
 * Backend proxies requests to Polymarket API to avoid CORS issues
 * 
 * @param limit - Number of markets to fetch
 * @param offset - Pagination offset
 * @param useCache - Unused (kept for compatibility)
 * @returns Array of markets
 */
export async function getMarkets(
  limit: number = 100,
  offset: number = 0,
  useCache: boolean = true
): Promise<Market[]> {
  try {
    // Fetch markets from backend API proxy
    // Backend will proxy to Polymarket API
    const markets = await getMarketsViaProxy(limit, offset);
    
    // Return markets as-is (already in Market format from backend)
    return markets;
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}


