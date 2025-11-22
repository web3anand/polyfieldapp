/**
 * User Holdings Component
 * Displays user's token holdings from Polymarket CLOB API
 */

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { useClobClient } from '../hooks/useClobClient';
import { useWallet } from '../hooks/useWallet';
import { toast } from 'sonner';

interface Holding {
  tokenId: string;
  balance: string;
  marketTitle?: string;
  currentPrice?: number;
  value?: number;
}

export function UserHoldings() {
  const clob = useClobClient();
  const { address } = useWallet();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = async () => {
    if (!address || !clob.isAuthenticated) {
      setHoldings([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userHoldings = await clob.getUserHoldings();
      setHoldings(userHoldings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch holdings');
      console.error('Error fetching holdings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHoldings, 30000);
    return () => clearInterval(interval);
  }, [address, clob.isAuthenticated]);

  if (!clob.isAuthenticated) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="text-[var(--text-primary)] font-medium mb-2">
          Authentication Required
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Configure authentication in Profile settings to view your holdings
        </p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="text-[var(--text-primary)] font-medium mb-2">
          Wallet Not Connected
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Connect your wallet to view holdings
        </p>
      </div>
    );
  }

  if (loading && holdings.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-500 mx-auto mb-3 animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading holdings...</p>
      </div>
    );
  }

  if (error && holdings.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <p className="text-[var(--text-primary)] font-medium mb-2">Error</p>
        <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
        <button
          onClick={fetchHoldings}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm text-white transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <Wallet className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-[var(--text-primary)] font-medium mb-2">
          No Holdings
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Your token holdings will appear here
        </p>
      </div>
    );
  }

  const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[var(--text-primary)] font-semibold">
            Holdings ({holdings.length})
          </h3>
          {totalValue > 0 && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Total Value: ${totalValue.toFixed(2)}
            </p>
          )}
        </div>
        <button
          onClick={fetchHoldings}
          disabled={loading}
          className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-all disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-[var(--text-secondary)] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {holdings.map((holding) => {
        const balance = parseFloat(holding.balance);
        const value = holding.value || (holding.currentPrice ? balance * holding.currentPrice : 0);
        const isPositive = value > 0;

        return (
          <div
            key={holding.tokenId}
            className="glass-card rounded-xl p-4 border border-[var(--border-color)]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
                  {holding.marketTitle || 'Market'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Token: {holding.tokenId.slice(0, 8)}...{holding.tokenId.slice(-6)}
                </p>
              </div>
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-rose-500" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Balance</p>
                <p className="text-[var(--text-primary)] font-medium">
                  {balance.toLocaleString()} shares
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Value</p>
                <p className={`font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${value.toFixed(2)}
                </p>
              </div>
              {holding.currentPrice && (
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Current Price</p>
                  <p className="text-[var(--text-primary)] font-medium">
                    {(holding.currentPrice * 100).toFixed(0)}¢
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

