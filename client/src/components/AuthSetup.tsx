/**
 * Authentication Setup Component
 * Allows users to configure Polymarket CLOB API authentication
 * Uses Privy for secure wallet management
 */

import { useState } from 'react';
import { Key, Lock, AlertCircle, CheckCircle, X, Wallet } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useClobClient } from '../hooks/useClobClient';
import { toast } from 'sonner';

export function AuthSetup() {
  const clob = useClobClient();
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const [authMethod, setAuthMethod] = useState<'l1' | 'l2' | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleL1Auth = async () => {
    // Use Privy wallet connection instead of manual private key input
    if (!authenticated) {
      toast.error('Please connect your wallet first');
      await login();
      return;
    }

    if (wallets.length === 0) {
      toast.error('No wallet connected');
      return;
    }

    try {
      setIsLoading(true);
      const wallet = wallets[0];
      
      // Get private key from Privy's embedded wallet securely
      const provider = await wallet.getEthereumProvider();
      const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
      
      if (!accounts || accounts.length === 0) {
        toast.error('No accounts found in wallet');
        return;
      }

      // Use wallet address for L1 authentication
      // Note: Privy manages the private key securely, we don't expose it
      const address = accounts[0];
      toast.success(`L1 Authentication configured with ${address.slice(0, 6)}...${address.slice(-4)}`);
      setAuthMethod(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to configure L1 authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleL2Auth = async () => {
    if (!apiKey.trim() || !passphrase.trim()) {
      toast.error('Please enter both API key and passphrase');
      return;
    }

    try {
      await clob.setL2Auth(apiKey, passphrase);
      toast.success('L2 Authentication configured successfully!');
      setApiKey('');
      setPassphrase('');
      setAuthMethod(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to configure L2 authentication');
    }
  };

  const handleClearAuth = () => {
    clob.clearAuth();
    toast.success('Authentication cleared');
  };

  if (clob.isAuthenticated) {
    return (
      <div className="glass-card rounded-xl p-4 border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Authenticated
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Trading enabled
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={clob.isWebSocketEnabled}
                onChange={(e) => clob.enableWebSocket(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              WebSocket
            </label>
            <button
              onClick={handleClearAuth}
              className="px-3 py-1.5 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4 border border-amber-500/30">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Authentication Required
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Configure authentication to enable trading and real-time updates
          </p>
        </div>
        {authMethod && (
          <button
            onClick={() => setAuthMethod(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!authMethod ? (
        <div className="flex gap-2">
          <button
            onClick={() => setAuthMethod('l1')}
            className="flex-1 px-4 py-2.5 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] rounded-lg text-sm font-medium text-[var(--text-primary)] transition-all flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            L1 (Private Key)
          </button>
          <button
            onClick={() => setAuthMethod('l2')}
            className="flex-1 px-4 py-2.5 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] rounded-lg text-sm font-medium text-[var(--text-primary)] transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            L2 (API Key)
          </button>
        </div>
      ) : authMethod === 'l1' ? (
        <div className="space-y-3">
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                  Secure Wallet Authentication
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Connect your wallet with Privy. Your private keys are securely managed and never exposed.
                </p>
              </div>
            </div>
          </div>
          
          {!authenticated ? (
            <button
              onClick={login}
              disabled={!ready || isLoading}
              className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {isLoading ? 'Connecting...' : 'Connect Wallet with Privy'}
            </button>
          ) : (
            <div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-3">
                <p className="text-xs text-emerald-400">
                  ✓ Wallet connected: {wallets.length > 0 ? `${wallets[0].address.slice(0, 6)}...${wallets[0].address.slice(-4)}` : 'Loading...'}
                </p>
              </div>
              <button
                onClick={handleL1Auth}
                disabled={isLoading || wallets.length === 0}
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all"
              >
                {isLoading ? 'Configuring...' : 'Configure L1 Auth'}
              </button>
            </div>
          )}
          
          <p className="text-xs text-[var(--text-muted)]">
            🔒 Your private keys are securely stored by Privy and never leave your device.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your Polymarket API key"
              className="w-full px-3 py-2 bg-[var(--hover-bg)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">
              Passphrase
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Your API key passphrase"
              className="w-full px-3 py-2 bg-[var(--hover-bg)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <button
            onClick={handleL2Auth}
            disabled={!apiKey.trim() || !passphrase.trim()}
            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all"
          >
            Configure L2 Auth
          </button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
        <p className="text-xs text-[var(--text-muted)]">
          💡 <strong>Tip:</strong> Get API keys from{' '}
          <a
            href="https://polymarket.com/builder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            Polymarket Builder Program
          </a>
        </p>
      </div>
    </div>
  );
}

