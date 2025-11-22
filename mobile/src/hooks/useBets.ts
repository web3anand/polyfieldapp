import { useState, useEffect } from 'react';
import { getUserBets, Bet } from '../utils/supabase';

export function useBets(userAddress: string | null) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userAddress) {
      setLoading(false);
      return;
    }

    loadBets();
  }, [userAddress]);

  const loadBets = async () => {
    if (!userAddress) return;

    try {
      setLoading(true);
      setError(null);

      const userBets = await getUserBets(userAddress);
      setBets(userBets);
    } catch (err: any) {
      console.error('Error loading bets:', err);
      setError(err.message || 'Failed to load trade history');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadBets();

  // Get stats
  const stats = {
    totalTrades: bets.length,
    filledTrades: bets.filter(b => b.status === 'filled').length,
    pendingTrades: bets.filter(b => b.status === 'pending').length,
    failedTrades: bets.filter(b => b.status === 'failed').length,
    totalVolume: bets
      .filter(b => b.status === 'filled')
      .reduce((sum, b) => sum + b.amount, 0),
  };

  return {
    bets,
    stats,
    loading,
    error,
    refresh,
  };
}
