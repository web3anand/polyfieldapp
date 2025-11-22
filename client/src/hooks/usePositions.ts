import { useState, useEffect } from 'react';
import { apiClient, apiEndpoints } from '../services/api';
import { Position } from '../types';

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Position[]>(apiEndpoints.positions.list);
      // If backend is not available, response.data will be empty array
      setPositions(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      // Handle connection errors and 500 errors (backend not ready) gracefully
      const isBackendNotReady = err.status === 0 || err.status === 500;
      
      if (!isBackendNotReady) {
        setError(err.message || 'Failed to fetch positions');
        console.error('Error fetching positions:', err);
      } else {
        // Backend not available or not ready - silently show empty state
        // Only log once in development
        if (import.meta.env.DEV && !(window as any).__positions_warning_shown) {
          console.info('Backend not ready. Positions will load when backend is available.');
          (window as any).__positions_warning_shown = true;
        }
        setPositions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return { positions, loading, error, refetch: fetchPositions };
}

