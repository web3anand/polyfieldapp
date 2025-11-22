/**
 * Hook for live score updates via WebSocket
 * Updates scores and percentages without re-rendering the whole page
 */

import { useState, useEffect, useRef } from 'react';
import { Market } from '../types';
import { polymarketWS } from '../lib/polymarketWebSocket';

export interface LiveScoreData {
  homeScore: number;
  awayScore: number;
  yesPercentage: number; // YES price as percentage
  noPercentage: number; // NO price as percentage
  period?: string; // e.g., "3rd QTR", "2nd Half", etc.
  isConnected: boolean;
}

/**
 * Hook to get live scores and percentages for a market
 * Uses WebSocket for real-time updates, only updates specific values
 */
export function useLiveScores(market: Market): LiveScoreData {
  const [yesPercentage, setYesPercentage] = useState(market.yesPrice);
  const [noPercentage, setNoPercentage] = useState(market.noPrice);
  const [isConnected, setIsConnected] = useState(polymarketWS.isConnected());
  
  // Use refs to store scores to avoid unnecessary re-renders
  // Scores should be fetched from external sports API in production
  const scoresRef = useRef({ homeScore: 0, awayScore: 0 });
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [period, setPeriod] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Subscribe to price updates (which we'll use as percentages)
    const handlePriceUpdate = (newYesPrice: number, newNoPrice: number) => {
      // Prices come as decimals (0-1), convert to cents (0-100) for display
      const yesPct = Math.round(newYesPrice * 100);
      const noPct = Math.round(newNoPrice * 100);
      
      // Update percentages (only update if changed to avoid unnecessary re-renders)
      setYesPercentage(prev => prev !== yesPct ? yesPct : prev);
      setNoPercentage(prev => prev !== noPct ? noPct : prev);
      
      // TODO: Fetch actual scores from sports API
      // Scores should be fetched from an external API (e.g., ESPN, TheScore, etc.)
      // For now, scores remain at 0 until API integration is complete
    };

    // Subscribe to market updates
    const unsubscribe = polymarketWS.subscribe(
      market.conditionId || market.id,
      handlePriceUpdate
    );

    // Update connection status periodically
    const connectionInterval = setInterval(() => {
      setIsConnected(polymarketWS.isConnected());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(connectionInterval);
    };
  }, [market.id, market.conditionId]);

  return {
    homeScore,
    awayScore,
    yesPercentage,
    noPercentage,
    period,
    isConnected,
  };
}

