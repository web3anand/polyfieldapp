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
  // Scores will be calculated from percentages or fetched from external API
  const scoresRef = useRef({ homeScore: 72, awayScore: 68 });
  const [homeScore, setHomeScore] = useState(72);
  const [awayScore, setAwayScore] = useState(68);
  const [period, setPeriod] = useState('3rd QTR');

  useEffect(() => {
    // Subscribe to price updates (which we'll use as percentages)
    const handlePriceUpdate = (newYesPrice: number, newNoPrice: number) => {
      // Prices come as decimals (0-1), convert to cents (0-100) for display
      const yesPct = Math.round(newYesPrice * 100);
      const noPct = Math.round(newNoPrice * 100);
      
      // Update percentages (only update if changed to avoid unnecessary re-renders)
      setYesPercentage(prev => prev !== yesPct ? yesPct : prev);
      setNoPercentage(prev => prev !== noPct ? noPct : prev);
      
      // Calculate scores based on percentages (mock calculation)
      // In a real app, you'd fetch actual scores from a sports API
      // For now, we'll simulate score changes based on percentage changes
      // Higher YES percentage = higher home score
      const newHomeScore = Math.round(50 + (newYesPrice * 50)); // 50-100 range
      const newAwayScore = Math.round(50 + (newNoPrice * 50)); // 50-100 range
      
      // Only update if scores changed significantly (avoid constant updates)
      if (Math.abs(newHomeScore - scoresRef.current.homeScore) >= 1) {
        scoresRef.current.homeScore = newHomeScore;
        setHomeScore(newHomeScore);
      }
      if (Math.abs(newAwayScore - scoresRef.current.awayScore) >= 1) {
        scoresRef.current.awayScore = newAwayScore;
        setAwayScore(newAwayScore);
      }
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

