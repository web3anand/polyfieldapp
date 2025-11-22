/**
 * Hook for managing USDC balance and allowance
 * Checks if user has approved USDC for trading on Polymarket
 */

import { useState, useEffect, useCallback } from 'react';
import { getBalanceAllowance, updateBalanceAllowance } from '../services/clobApi';
import { useWallet } from './useWallet';

export interface BalanceAllowanceInfo {
  balance: string;          // User's USDC balance
  allowance: string;        // Approved USDC amount
  allowanceSufficient: boolean; // Whether allowance is sufficient for trading
}

export function useBalanceAllowance(authHeaders?: Record<string, string>) {
  const { isConnected } = useWallet();
  const [info, setInfo] = useState<BalanceAllowanceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch balance and allowance
  const fetchInfo = useCallback(async () => {
    if (!isConnected || !authHeaders) {
      setInfo(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getBalanceAllowance('COLLATERAL', authHeaders);
      
      if (data) {
        setInfo({
          balance: data.balance,
          allowance: data.allowance,
          allowanceSufficient: data.allowance_sufficient,
        });
      } else {
        setInfo(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balance/allowance');
      console.error('Balance/allowance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, authHeaders]);

  // Update allowance (approve USDC for trading)
  const approveUSDC = useCallback(async () => {
    if (!isConnected || !authHeaders) {
      throw new Error('Wallet not connected or authentication required');
    }

    try {
      setUpdating(true);
      setError(null);

      await updateBalanceAllowance('COLLATERAL', authHeaders);
      
      // Refresh info after update
      await fetchInfo();
    } catch (err: any) {
      setError(err.message || 'Failed to approve USDC');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [isConnected, authHeaders, fetchInfo]);

  // Fetch on mount and when wallet connects
  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  return {
    info,
    loading,
    error,
    updating,
    refetch: fetchInfo,
    approveUSDC,
  };
}
