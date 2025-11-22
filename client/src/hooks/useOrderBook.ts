/**
 * Hook to fetch and manage order book data
 */

import { useState, useEffect } from 'react';
import { getOrderBook } from '../services/clobApi';
import { getTokenIdFromMarket } from '../utils/tokenMapping';
import type { Market } from '../types';

export interface OrderBookData {
  yes: {
    bids: Array<{ price: number; shares: number }>;
    asks: Array<{ price: number; shares: number }>;
  };
  no: {
    bids: Array<{ price: number; shares: number }>;
    asks: Array<{ price: number; shares: number }>;
  };
}

export function useOrderBook(market: Market | null) {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!market) {
      setOrderBook(null);
      return;
    }

    const fetchOrderBook = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token IDs from market
        const yesTokenId = getTokenIdFromMarket(market, 'yes');
        const noTokenId = getTokenIdFromMarket(market, 'no');
        
        // Fetch order books for both YES and NO tokens
        const [yesBook, noBook] = await Promise.all([
          yesTokenId ? getOrderBook(yesTokenId) : Promise.resolve(null),
          noTokenId ? getOrderBook(noTokenId) : Promise.resolve(null),
        ]);
        
        if (yesBook || noBook) {
          // Transform to our format
          setOrderBook({
            yes: {
              bids: yesBook?.bids.map(b => ({ 
                price: Math.round(parseFloat(b.price) * 100), 
                shares: parseFloat(b.size) 
              })) || [],
              asks: yesBook?.asks.map(a => ({ 
                price: Math.round(parseFloat(a.price) * 100), 
                shares: parseFloat(a.size) 
              })) || [],
            },
            no: {
              // For NO, prices are inverted (1 - price)
              bids: noBook?.bids.map(b => ({ 
                price: Math.round((1 - parseFloat(b.price)) * 100), 
                shares: parseFloat(b.size) 
              })) || [],
              asks: noBook?.asks.map(a => ({ 
                price: Math.round((1 - parseFloat(a.price)) * 100), 
                shares: parseFloat(a.size) 
              })) || [],
            },
          });
        } else {
          // Fallback to empty order book if API unavailable
          setOrderBook(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch order book');
        setOrderBook(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderBook();
    
    // Refresh order book every 10 seconds (reduced frequency to avoid spam)
    const interval = setInterval(fetchOrderBook, 10000);
    
    return () => clearInterval(interval);
  }, [market?.id]);

  return { orderBook, loading, error, refetch: () => {} };
}

