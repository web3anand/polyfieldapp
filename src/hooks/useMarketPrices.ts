/**
 * Hook for real-time market price updates via WebSocket
 */

import { useState, useEffect, useCallback } from 'react';
import { polymarketWS } from '../lib/polymarketWebSocket';
import type { Market } from '../types';

export function useMarketPrices(market: Market) {
  const [yesPrice, setYesPrice] = useState(market.yesPrice);
  const [noPrice, setNoPrice] = useState(market.noPrice);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Update prices when market prop changes
    setYesPrice(market.yesPrice);
    setNoPrice(market.noPrice);
  }, [market.yesPrice, market.noPrice]);

  useEffect(() => {
    // Subscribe to real-time price updates
    const unsubscribe = polymarketWS.subscribe(
      market.id,
      (newYesPrice: number, newNoPrice: number) => {
        // Convert from decimal (0-1) to cents (0-100)
        setYesPrice(Math.round(newYesPrice * 100));
        setNoPrice(Math.round(newNoPrice * 100));
      }
    );

    // Check connection status
    setIsConnected(polymarketWS.isConnected());

    // Update connection status periodically
    const interval = setInterval(() => {
      setIsConnected(polymarketWS.isConnected());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [market.id]);

  return {
    yesPrice,
    noPrice,
    isConnected,
    updatePrices: useCallback((newYesPrice: number, newNoPrice: number) => {
      setYesPrice(newYesPrice);
      setNoPrice(newNoPrice);
    }, []),
  };
}

