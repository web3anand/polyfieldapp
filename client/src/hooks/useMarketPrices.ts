/**
 * Hook for real-time market price updates via WebSocket
 * NO POLLING - WebSocket only for maximum efficiency
 */

import { useState, useEffect, useCallback } from 'react';
import { polymarketWS } from '../lib/polymarketWebSocket';
import { getTokenIdFromMarket } from '../utils/tokenMapping';
import type { Market } from '../types';

export function useMarketPrices(market: Market) {
  const [yesPrice, setYesPrice] = useState(market.yesPrice);
  const [noPrice, setNoPrice] = useState(market.noPrice);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Update prices when market prop changes (initial load)
    setYesPrice(market.yesPrice);
    setNoPrice(market.noPrice);
  }, [market.yesPrice, market.noPrice]);

  useEffect(() => {
    // Get token IDs for WebSocket subscription
    const yesTokenId = getTokenIdFromMarket(market, 'yes');
    const noTokenId = getTokenIdFromMarket(market, 'no');
    
    // Subscribe to real-time price updates via WebSocket
    // Use token ID if available (for MARKET channel), otherwise use condition ID
    const subscribeId = yesTokenId || market.conditionId || market.id;
    const isTokenId = !!yesTokenId;
    
    const unsubscribe = polymarketWS.subscribe(
      subscribeId,
      (newYesPrice: number, newNoPrice: number) => {
        // Convert from decimal (0-1) to cents (0-100)
        setYesPrice(Math.round(newYesPrice * 100));
        setNoPrice(Math.round(newNoPrice * 100));
      },
      isTokenId
    );

    // Monitor WebSocket connection status
    const checkConnection = () => {
      const connected = polymarketWS.isConnected();
      setIsConnected(connected);
    };

    // Initial check
    checkConnection();

    // Update connection status periodically
    const connectionInterval = setInterval(checkConnection, 5000);

    return () => {
      unsubscribe();
      clearInterval(connectionInterval);
    };
  }, [market.id, market.conditionId]);

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

