import { useState, useEffect } from 'react';
import { getMarkets } from '../services/marketsService';
import { Market } from '../types';

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use Polymarket service - tries direct API first, falls back to backend proxy
      const data = await getMarkets(100, 0, true);
      const marketsArray = Array.isArray(data) ? data : [];
      setMarkets(marketsArray);
      
      // Log success/failure for debugging
      if (marketsArray.length === 0 && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ No markets returned. Check console for API errors.');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch markets';
      setError(errorMessage);
      console.error('Error fetching markets:', err);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  return { markets, loading, error, refetch: fetchMarkets };
}

