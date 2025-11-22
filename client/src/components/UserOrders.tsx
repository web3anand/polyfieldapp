/**
 * User Orders Component
 * Displays user's open orders from Polymarket CLOB API
 */

import { useState, useEffect } from 'react';
import { Clock, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useClobClient } from '../hooks/useClobClient';
import { useWallet } from '../hooks/useWallet';
import { toast } from 'sonner';
import type { OrderResponse } from '../services/clobApi';

export function UserOrders() {
  const clob = useClobClient();
  const { address } = useWallet();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!address || !clob.isAuthenticated) {
      setOrders([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userOrders = await clob.getUserOrders();
      setOrders(userOrders);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Refresh every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [address, clob.isAuthenticated]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await clob.cancelOrder(orderId);
      toast.success('Order cancelled');
      fetchOrders(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order');
    }
  };

  if (!clob.isAuthenticated) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="text-[var(--text-primary)] font-medium mb-2">
          Authentication Required
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Configure authentication in Profile settings to view your orders
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
          Connect your wallet to view orders
        </p>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-500 mx-auto mb-3 animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading orders...</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <p className="text-[var(--text-primary)] font-medium mb-2">Error</p>
        <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm text-white transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <Clock className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-[var(--text-primary)] font-medium mb-2">
          No Open Orders
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Your open orders will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[var(--text-primary)] font-semibold">
          Open Orders ({orders.length})
        </h3>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-all disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-[var(--text-secondary)] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {orders.map((order) => {
        const isBuy = order.side === 'BUY';
        const statusColor = order.status === 'FILLED' 
          ? 'text-emerald-500' 
          : order.status === 'CANCELLED'
          ? 'text-gray-500'
          : 'text-amber-500';

        return (
          <div
            key={order.id}
            className="glass-card rounded-xl p-4 border border-[var(--border-color)]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isBuy
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isBuy ? 'BUY' : 'SELL'}
                  </span>
                  <span className={`text-xs font-medium ${statusColor}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-primary)] font-medium">
                  {order.marketTitle || 'Market'}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Token: {order.tokenId?.slice(0, 8)}...
                </p>
              </div>
              {order.status === 'OPEN' && (
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-all group"
                  title="Cancel order"
                >
                  <X className="w-4 h-4 text-rose-400 group-hover:text-rose-300" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Size</p>
                <p className="text-[var(--text-primary)] font-medium">
                  {order.size} shares
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Price</p>
                <p className="text-[var(--text-primary)] font-medium">
                  {typeof order.price === 'number' 
                    ? `${(order.price * 100).toFixed(0)}¢`
                    : order.price}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Filled</p>
                <p className="text-[var(--text-primary)] font-medium">
                  {order.filledSize || '0'} / {order.size}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Type</p>
                <p className="text-[var(--text-primary)] font-medium">
                  {order.orderType || 'LIMIT'}
                </p>
              </div>
            </div>

            {order.createdAt && (
              <p className="text-xs text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border-color)]">
                Created: {new Date(order.createdAt).toLocaleString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

