/**
 * Hook to fetch and manage order book data
 */

import { useState, useEffect } from 'react';
import { getOrderBook } from '../services/clobApi';
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
        
        // Get order book from CLOB API
        // Note: tokenId might need to be derived from market.id
        const book = await getOrderBook(market.id);
        
        if (book) {
          // Transform to our format
          // Note: CLOB API returns single order book, we need to split for YES/NO
          // This is a simplified version - actual implementation may differ
          setOrderBook({
            yes: {
              bids: book.bids.map(b => ({ price: Math.round(b.price * 100), shares: parseFloat(b.size) })),
              asks: book.asks.map(a => ({ price: Math.round(a.price * 100), shares: parseFloat(a.size) })),
            },
            no: {
              bids: book.bids.map(b => ({ price: Math.round((1 - b.price) * 100), shares: parseFloat(b.size) })),
              asks: book.asks.map(a => ({ price: Math.round((1 - a.price) * 100), shares: parseFloat(a.size) })),
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

