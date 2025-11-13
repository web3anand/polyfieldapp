/**
 * Enhanced Polymarket Proxy Wallet Hook
 * Manages proxy wallet creation, initialization, and betting operations
 */

import { useState, useEffect, useCallback } from 'react';
import { initPM, initPMWithBuilder, placeBet, placeBetWithBuilder } from '../lib/pm';
import { ensureProxyWallet } from '../lib/proxy-wallet';
import type { PolymarketClient, RelayerClient } from '../lib/pm';

export interface UsePolymarketProxyEnhancedReturn {
  proxyAddress: string | null;
  polymarket: PolymarketClient | null;
  relayerClient: RelayerClient | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  balance: string;
  initializeProxy: (walletClient: any, userAddress: string) => Promise<void>;
  placeBet: (
    tokenId: string,
    side: 'BUY' | 'SELL',
    amount: string,
    price: number
  ) => Promise<{ hash: string; success: boolean }>;
  refreshBalance: () => Promise<void>;
}

/**
 * Hook for managing Polymarket proxy wallet and trading operations
 */
export function usePolymarketProxyEnhanced(): UsePolymarketProxyEnhancedReturn {
  const [proxyAddress, setProxyAddress] = useState<string | null>(null);
  const [polymarket, setPolymarket] = useState<PolymarketClient | null>(null);
  const [relayerClient, setRelayerClient] = useState<RelayerClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');

  /**
   * Initialize proxy wallet and Polymarket clients
   */
  const initializeProxy = useCallback(
    async (walletClient: any, userAddress: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Ensure proxy wallet exists
        const proxyPrivateKey = await ensureProxyWallet(walletClient, userAddress);
        
        // Initialize Polymarket with Builder (gasless trading)
        const { polymarket: pmClient, relayerClient: relayer } =
          await initPMWithBuilder(proxyPrivateKey, userAddress);

        setPolymarket(pmClient);
        setRelayerClient(relayer);
        setIsInitialized(true);

        // TODO: Get proxy wallet address from private key
        // For now, we'll need to derive it
        // setProxyAddress(derivedAddress);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize proxy wallet');
        console.error('Error initializing proxy wallet:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Place a bet using the proxy wallet
   */
  const handlePlaceBet = useCallback(
    async (
      tokenId: string,
      side: 'BUY' | 'SELL',
      amount: string,
      price: number
    ): Promise<{ hash: string; success: boolean }> => {
      if (!isInitialized || !relayerClient) {
        throw new Error('Proxy wallet not initialized');
      }

      try {
        setError(null);
        
        // Use gasless trading via Builder
        const result = await placeBetWithBuilder(
          relayerClient,
          tokenId,
          side,
          amount,
          price
        );

        return result;
      } catch (err: any) {
        setError(err.message || 'Failed to place bet');
        throw err;
      }
    },
    [isInitialized, relayerClient]
  );

  /**
   * Refresh proxy wallet balance
   */
  const refreshBalance = useCallback(async () => {
    if (!proxyAddress) {
      return;
    }

    try {
      // TODO: Fetch balance from blockchain
      // const balance = await getBalance(proxyAddress);
      // setBalance(balance);
    } catch (err: any) {
      console.error('Error fetching balance:', err);
    }
  }, [proxyAddress]);

  return {
    proxyAddress,
    polymarket,
    relayerClient,
    isInitialized,
    isLoading,
    error,
    balance,
    initializeProxy,
    placeBet: handlePlaceBet,
    refreshBalance,
  };
}

