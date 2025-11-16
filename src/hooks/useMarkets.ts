import { useState, useEffect, useRef, useCallback } from 'react';
import { getMarkets } from '../services/marketsService';
import { Market } from '../types';

// Polling interval: 30 seconds (markets update frequently)
const POLLING_INTERVAL = 30000;

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchMarkets = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = Date.now();
      const data = await getMarkets(100, 0, false);
      const marketsArray = Array.isArray(data) ? data : [];
      
      // Only update if component is still mounted
      if (isMountedRef.current) {
        setMarkets(marketsArray);
        
        // Log success/failure for debugging
        if (marketsArray.length === 0 && process.env.NODE_ENV === 'development') {
          console.warn('⚠️ No markets returned. Check console for API errors.');
        } else if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Fetched ${marketsArray.length} markets at ${new Date().toLocaleTimeString()}`);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch markets';
      if (isMountedRef.current) {
        setError(errorMessage);
        console.error('Error fetching markets:', err);
        setMarkets([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchMarkets(true);
    
    // Set up polling to refresh markets periodically
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchMarkets(false); // Don't show loading spinner on auto-refresh
      }
    }, POLLING_INTERVAL);
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchMarkets]);

  // Manual refresh function
  const refetch = useCallback(() => {
    fetchMarkets(true);
  }, [fetchMarkets]);

  return { markets, loading, error, refetch };
}

