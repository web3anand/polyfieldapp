import { useState, useEffect, useRef, useCallback } from 'react';
import { getMarkets } from '../services/marketsService';
import { Market } from '../types';

// NO POLLING - WebSocket provides real-time price updates
// Markets are fetched once on mount and can be manually refreshed via refetch()
// This eliminates unnecessary API calls and prevents ERR_INSUFFICIENT_RESOURCES

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchMarkets = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      // Fetch markets - WebSocket will keep prices updated in real-time
      // Initial fetch gets market metadata (title, description, etc.)
      const data = await getMarkets(500, 0, false);
      const marketsArray = Array.isArray(data) ? data : [];
      
      // Only update if component is still mounted
      if (isMountedRef.current) {
        setMarkets(marketsArray);
        
        // Log success/failure for debugging
        if (marketsArray.length === 0 && process.env.NODE_ENV === 'development') {
          console.warn('⚠️ No markets returned. Check console for API errors.');
        } else if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Fetched ${marketsArray.length} markets (WebSocket will handle live updates)`);
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
    
    // Initial fetch only - no polling
    // WebSocket handles real-time price updates
    fetchMarkets(true);
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchMarkets]);

  // Manual refresh function - user can trigger via UI button
  const refetch = useCallback(() => {
    fetchMarkets(true);
  }, [fetchMarkets]);

  return { markets, loading, error, refetch };
}

