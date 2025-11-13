import { useState, useEffect } from 'react';
import { apiClient, apiEndpoints } from '../services/api';
import { Transaction, Trade, ClosedPosition } from '../types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Transaction[]>(apiEndpoints.transactions.list);
      // If backend is not available, response.data will be empty array
      setTransactions(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      // Handle connection errors and 500 errors (backend not ready) gracefully
      const isBackendNotReady = err.status === 0 || err.status === 500;
      
      if (!isBackendNotReady) {
        setError(err.message || 'Failed to fetch transactions');
        console.error('Error fetching transactions:', err);
      } else {
        // Backend not available or not ready - silently show empty state
        // Only log once in development
        if (import.meta.env.DEV && !(window as any).__transactions_warning_shown) {
          console.info('Backend not ready. Transactions will load when backend is available.');
          (window as any).__transactions_warning_shown = true;
        }
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return { transactions, loading, error, refetch: fetchTransactions };
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Trade[]>(apiEndpoints.trades.history);
      // If backend is not available, response.data will be empty array
      setTrades(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      // Handle connection errors and 500 errors (backend not ready) gracefully
      const isBackendNotReady = err.status === 0 || err.status === 500;
      
      if (!isBackendNotReady) {
        setError(err.message || 'Failed to fetch trades');
        console.error('Error fetching trades:', err);
      } else {
        // Backend not available or not ready - silently show empty state
        // Only log once in development
        if (import.meta.env.DEV && !(window as any).__trades_warning_shown) {
          console.info('Backend not ready. Trades will load when backend is available.');
          (window as any).__trades_warning_shown = true;
        }
        setTrades([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return { trades, loading, error, refetch: fetchTrades };
}

export function useClosedPositions() {
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClosedPositions();
  }, []);

  const fetchClosedPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<ClosedPosition[]>(apiEndpoints.closedPositions.list);
      // If backend is not available, response.data will be empty array
      setClosedPositions(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      // Handle connection errors and 500 errors (backend not ready) gracefully
      const isBackendNotReady = err.status === 0 || err.status === 500;
      
      if (!isBackendNotReady) {
        setError(err.message || 'Failed to fetch closed positions');
        console.error('Error fetching closed positions:', err);
      } else {
        // Backend not available or not ready - silently show empty state
        // Only log once in development
        if (import.meta.env.DEV && !(window as any).__closed_positions_warning_shown) {
          console.info('Backend not ready. Closed positions will load when backend is available.');
          (window as any).__closed_positions_warning_shown = true;
        }
        setClosedPositions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return { closedPositions, loading, error, refetch: fetchClosedPositions };
}

