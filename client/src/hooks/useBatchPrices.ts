/**
 * Hook for batch fetching market prices
 * Uses Polymarket's batch price API to fetch multiple prices in one request
 * This is MUCH more efficient than individual calls
 * 
 * Rate Limit: 80 requests/10s for batch vs 200 requests/10s for individual
 * Benefit: 1 request for 100 markets vs 100 requests
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getBatchPrices } from '../services/clobApi';
import type { Market } from '../types';

interface PriceUpdate {
  marketId: string;
  yesPrice: number;
  noPrice: number;
}

export interface UseBatchPricesOptions {
  pollingInterval?: number; // Default: 30 seconds
  enabled?: boolean;        // Default: true
}

/**
 * Batch fetch prices for multiple markets
 * 
 * @param markets - Array of markets to fetch prices for
 * @param options - Configuration options
 * @returns Object with prices map and loading state
 */
export function useBatchPrices(
  markets: Market[],
  options: UseBatchPricesOptions = {}
) {
  const { pollingInterval = 30000, enabled = true } = options;
  
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchPrices = useCallback(async () => {
    if (!enabled || markets.length === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Extract token IDs from markets
      const tokenIds: string[] = [];
      const marketTokenMap = new Map<string, { marketId: string; side: 'yes' | 'no' }>();

      markets.forEach(market => {
        if (market.yesTokenId) {
          tokenIds.push(market.yesTokenId);
          marketTokenMap.set(market.yesTokenId, { marketId: market.id, side: 'yes' });
        }
        if (market.noTokenId) {
          tokenIds.push(market.noTokenId);
          marketTokenMap.set(market.noTokenId, { marketId: market.id, side: 'no' });
        }
      });

      if (tokenIds.length === 0) {
        // No token IDs available - can't use batch API
        setLoading(false);
        return;
      }

      // Batch fetch prices (max 100 at a time due to API limits)
      const batchSize = 100;
      const batches: string[][] = [];
      
      for (let i = 0; i < tokenIds.length; i += batchSize) {
        batches.push(tokenIds.slice(i, i + batchSize));
      }

      // Fetch all batches in parallel
      const allPriceData = await Promise.all(
        batches.map(batch => getBatchPrices(batch))
      );

      // Flatten results
      const priceData = allPriceData.flat();

      // Build price map
      const newPrices = new Map<string, PriceUpdate>();

      priceData.forEach(data => {
        const mapping = marketTokenMap.get(data.token_id);
        if (!mapping) return;

        const { marketId, side } = mapping;
        const price = Math.round(parseFloat(data.price) * 100);

        // Get existing entry or create new one
        const existing = newPrices.get(marketId) || {
          marketId,
          yesPrice: 50,
          noPrice: 50,
        };

        if (side === 'yes') {
          existing.yesPrice = price;
        } else {
          existing.noPrice = price;
        }

        newPrices.set(marketId, existing);
      });

      if (isMountedRef.current) {
        setPrices(newPrices);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch batch prices');
        console.error('Batch price fetch error:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [markets, enabled]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchPrices();

    // Set up polling
    if (enabled && pollingInterval > 0) {
      pollingIntervalRef.current = setInterval(fetchPrices, pollingInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchPrices, enabled, pollingInterval]);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices,
  };
}

/**
 * Get price for a specific market from the batch prices map
 */
export function getPriceFromBatch(
  prices: Map<string, PriceUpdate>,
  marketId: string
): PriceUpdate | null {
  return prices.get(marketId) || null;
}
