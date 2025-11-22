/**
 * Hook for Polymarket CLOB API Client
 * Provides easy access to CLOB API functions with authentication
 * 
 * This hook manages authentication and provides methods for:
 * - Getting markets
 * - Getting order books
 * - Placing orders
 * - Managing user orders
 */

import { useState, useCallback } from 'react';
import { useWallet } from './useWallet';
import {
  getOrderBook,
  getMarkets,
  placeOrder,
  cancelOrder,
  getUserOrders,
  getTrades,
  getUserHoldings,
  type PlaceOrderParams,
  type OrderResponse,
  type OrderBook,
  type Market as ClobMarket,
} from '../services/clobApi';
import {
  generateL1Auth,
  generateL2Auth,
  type AuthHeaders,
} from '../services/clobAuth';
import { polymarketWS } from '../lib/polymarketWebSocket';

export interface UseClobClientReturn {
  // Authentication
  isAuthenticated: boolean;
  setL1Auth: (privateKey: string) => Promise<void>;
  setL2Auth: (apiKey: string, passphrase: string) => Promise<void>;
  clearAuth: () => void;
  
  // Market data
  getMarkets: (conditionId?: string) => Promise<ClobMarket[]>;
  getOrderBook: (tokenId: string) => Promise<OrderBook | null>;
  getTrades: (tokenId: string) => Promise<any[]>;
  
  // Trading
  placeOrder: (params: PlaceOrderParams) => Promise<OrderResponse>;
  cancelOrder: (orderId: string) => Promise<void>;
  getUserOrders: () => Promise<OrderResponse[]>;
  getUserHoldings: () => Promise<any[]>;
  
  // WebSocket
  enableWebSocket: (enable: boolean) => void;
  isWebSocketEnabled: boolean;
}

/**
 * Hook for managing Polymarket CLOB API client
 * Authentication is handled automatically via Privy when a wallet is connected
 */
export function useClobClient(): UseClobClientReturn {
  const { address, isConnected: isWalletConnected } = useWallet();
  const [authHeaders, setAuthHeaders] = useState<AuthHeaders | null>(null);
  const [isWebSocketEnabled, setIsWebSocketEnabled] = useState(false);

  // Set L1 authentication (using private key)
  // Note: This is kept for backward compatibility but should not be called directly
  // Privy handles authentication automatically
  const setL1Auth = useCallback(async (privateKey: string) => {
    try {
      const message = `Authenticate to Polymarket CLOB API - ${Date.now()}`;
      const headers = await generateL1Auth(privateKey, message);
      setAuthHeaders(headers);
      
      // Configure WebSocket authentication if enabled
      if (isWebSocketEnabled && headers.POLY_API_KEY && headers.POLY_SECRET && headers.POLY_PASSPHRASE) {
        polymarketWS.setAuth(headers.POLY_API_KEY, headers.POLY_SECRET, headers.POLY_PASSPHRASE);
      }
    } catch (error: any) {
      throw new Error(`Failed to set L1 authentication: ${error.message}`);
    }
  }, [isWebSocketEnabled]);

  // Set L2 authentication (using API key)
  const setL2Auth = useCallback(async (apiKey: string, passphrase: string) => {
    try {
      // Generate auth for a sample request
      const headers = await generateL2Auth(apiKey, passphrase, 'GET', '/markets', '');
      setAuthHeaders(headers);
      
      // Configure WebSocket authentication if enabled
      if (isWebSocketEnabled && headers.POLY_API_KEY && headers.POLY_SECRET && headers.POLY_PASSPHRASE) {
        polymarketWS.setAuth(headers.POLY_API_KEY, headers.POLY_SECRET, headers.POLY_PASSPHRASE);
      }
    } catch (error: any) {
      throw new Error(`Failed to set L2 authentication: ${error.message}`);
    }
  }, [isWebSocketEnabled]);

  // Clear authentication
  const clearAuth = useCallback(() => {
    setAuthHeaders(null);
    polymarketWS.disconnect();
  }, []);

  // Enable/disable WebSocket
  const enableWebSocket = useCallback((enable: boolean) => {
    setIsWebSocketEnabled(enable);
    if (enable && authHeaders && authHeaders.POLY_API_KEY && authHeaders.POLY_SECRET && authHeaders.POLY_PASSPHRASE) {
      polymarketWS.setAuth(authHeaders.POLY_API_KEY, authHeaders.POLY_SECRET, authHeaders.POLY_PASSPHRASE);
    } else if (!enable) {
      polymarketWS.disconnect();
    }
  }, [authHeaders]);

  // Wrapped API functions with authentication
  const getMarketsWithAuth = useCallback(async (conditionId?: string) => {
    return getMarkets(conditionId);
  }, []);

  const getOrderBookWithAuth = useCallback(async (tokenId: string) => {
    return getOrderBook(tokenId);
  }, []);

  const getTradesWithAuth = useCallback(async (tokenId: string) => {
    return getTrades(tokenId);
  }, []);

  const placeOrderWithAuth = useCallback(async (params: PlaceOrderParams) => {
    if (!authHeaders) {
      throw new Error('Authentication required. Call setL1Auth() or setL2Auth() first.');
    }
    if (!address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    return placeOrder(params, authHeaders);
  }, [authHeaders, address]);

  const cancelOrderWithAuth = useCallback(async (orderId: string) => {
    if (!authHeaders) {
      throw new Error('Authentication required.');
    }
    return cancelOrder(orderId, authHeaders);
  }, [authHeaders]);

  const getUserOrdersWithAuth = useCallback(async () => {
    if (!address) {
      return [];
    }
    return getUserOrders(address, authHeaders || undefined);
  }, [address, authHeaders]);

  const getUserHoldingsWithAuth = useCallback(async () => {
    if (!address) {
      return [];
    }
    return getUserHoldings(address, authHeaders || undefined);
  }, [address, authHeaders]);

  return {
    // Authentication
    isAuthenticated: !!authHeaders,
    setL1Auth,
    setL2Auth,
    clearAuth,
    
    // Market data (no auth required)
    getMarkets: getMarketsWithAuth,
    getOrderBook: getOrderBookWithAuth,
    getTrades: getTradesWithAuth,
    
    // Trading (requires auth)
    placeOrder: placeOrderWithAuth,
    cancelOrder: cancelOrderWithAuth,
    getUserOrders: getUserOrdersWithAuth,
    getUserHoldings: getUserHoldingsWithAuth,
    
    // WebSocket
    enableWebSocket,
    isWebSocketEnabled,
  };
}

