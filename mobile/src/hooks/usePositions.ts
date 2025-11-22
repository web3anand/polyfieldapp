import { useState, useEffect } from 'react';
import { getUserPositions, getOpenPositions, getClosedPositions, Position } from '../utils/supabase';

export function usePositions(userAddress: string | null) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [closedPositions, setClosedPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userAddress) {
      setLoading(false);
      return;
    }

    loadPositions();
  }, [userAddress]);

  const loadPositions = async () => {
    if (!userAddress) return;

    try {
      setLoading(true);
      setError(null);

      const [allPositions, open, closed] = await Promise.all([
        getUserPositions(userAddress),
        getOpenPositions(userAddress),
        getClosedPositions(userAddress),
      ]);

      setPositions(allPositions);
      setOpenPositions(open);
      setClosedPositions(closed);
    } catch (err: any) {
      console.error('Error loading positions:', err);
      setError(err.message || 'Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadPositions();

  return {
    positions,
    openPositions,
    closedPositions,
    loading,
    error,
    refresh,
  };
}
