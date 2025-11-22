/**
 * CLOB API Service
 * Handles trading operations via Polymarket CLOB API
 * 
 * Documentation: https://docs.polymarket.com/developers/CLOB/introduction
 * Reference: https://docs.polymarket.com/developers/CLOB/websocket/wss-overview
 */

export const CLOB_API_BASE = 'https://clob.polymarket.com';
export const DATA_API_BASE = 'https://data-api.polymarket.com';

export interface OrderBookEntry {
  price: string;  // Price as string (0-1)
  size: string;   // Size in shares as string
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface PlaceOrderParams {
  tokenId: string;      // Token ID for YES or NO outcome
  side: 'BUY' | 'SELL';
  size: string;         // Amount in shares (as string)
  price: number;        // Price (0-1)
  orderType?: 'LIMIT' | 'MARKET';
  conditionId?: string; // Optional: condition ID for reference
  outcomeIndex?: 0 | 1; // Optional: 0 for YES, 1 for NO
}

export interface OrderResponse {
  id: string;
  status: string;
  token_id: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: string;
  created_at: string;
  transaction_hash?: string;
}

export interface Market {
  conditionId: string;
  question: string;
  slug: string;
  outcomes: string[];
  active: boolean;
  closed: boolean;
  endDate: string;
  liquidityAmm: number;
  liquidityClob: number;
  bestBid: number;
  bestAsk: number;
  volume24hrClob: number;
}

export interface Trade {
  id: string;
  token_id: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: string;
  timestamp: string;
}

export interface UserHolding {
  token_id: string;
  balance: string;
  condition_id: string;
  outcome_index: 0 | 1;
}

/**
 * Get Order Book for a market
 * @param tokenId - Market token ID (for YES or NO outcome)
 * @returns Order book with bids and asks
 * 
 * Reference: https://docs.polymarket.com/developers/CLOB/introduction
 */
export async function getOrderBook(tokenId: string): Promise<OrderBook | null> {
  const { env } = await import('../config/env');
  
  // Try backend proxy first (if configured)
  if (env.apiBaseUrl && env.apiBaseUrl.trim() !== '') {
    try {
      const response = await fetch(
        `${env.apiBaseUrl}/api/clob/book?token_id=${tokenId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          bids: data.bids || [],
          asks: data.asks || [],
        };
      }
    } catch (error: any) {
      // Backend proxy failed, try direct (will likely fail due to CORS)
      if (env.isDevelopment) {
        console.warn('Backend proxy failed, trying direct CLOB API (may fail due to CORS)');
      }
    }
  }
  
  // Try direct CLOB API (will likely fail due to CORS, but worth trying)
  try {
    const response = await fetch(`${CLOB_API_BASE}/book?token_id=${tokenId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        bids: data.bids || [],
        asks: data.asks || [],
      };
    }
  } catch (error: any) {
    // CORS error expected - return null silently
    if (env.isDevelopment && !(window as any).__clob_cors_warning_shown) {
      console.info('CLOB API requires backend proxy due to CORS restrictions');
      (window as any).__clob_cors_warning_shown = true;
    }
  }
  
  return null;
}

/**
 * Get all markets from CLOB API
 * @returns Array of markets
 */
export async function getMarkets(conditionId?: string): Promise<Market[]> {
  const { env } = await import('../config/env');
  
  // Prefer the public data API which exposes market & token metadata
  const url = conditionId
    ? `${DATA_API_BASE}/markets?condition_id=${conditionId}`
    : `${DATA_API_BASE}/markets`;
  
  // Try backend proxy first
  if (env.apiBaseUrl && env.apiBaseUrl.trim() !== '') {
    try {
      const response = await fetch(
        `${env.apiBaseUrl}/api/clob/markets${conditionId ? `?condition_id=${conditionId}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Fall through to direct API
    }
  }
  
  // Try direct API (may fail due to CORS)
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error: any) {
    if (env.isDevelopment) {
      console.warn('CLOB markets API requires backend proxy');
    }
  }
  
  return [];
}

/**
 * Place an order via CLOB API
 * Note: Requires authentication (L1 or L2) and backend proxy due to CORS
 * @param params - Order parameters
 * @param authHeaders - Authentication headers (L1 or L2)
 * @returns Order response
 * 
 * Reference: https://docs.polymarket.com/developers/CLOB/introduction
 */
export async function placeOrder(
  params: PlaceOrderParams,
  authHeaders?: Record<string, string>
): Promise<OrderResponse> {
  const { env } = await import('../config/env');
  
  // Always use backend proxy for placing orders (requires auth)
  if (!env.apiBaseUrl || env.apiBaseUrl.trim() === '') {
    throw new Error('Backend proxy required for placing orders. Set VITE_API_BASE_URL.');
  }
  
  // Prepare request body
  const requestBody = JSON.stringify({
    token_id: params.tokenId,
    side: params.side,
    size: params.size,
    price: params.price,
    order_type: params.orderType || 'LIMIT',
  });
  
  // Inject Builder headers for order attribution
  let finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders, // Include authentication headers
  };
  
  try {
    // Import builder config and inject headers
    const { getBuilderConfig } = await import('../config/builderConfig');
    const { injectBuilderHeaders } = await import('./builderAuth');
    const builderConfig = getBuilderConfig();
    
    if (builderConfig) {
      const headersWithBuilder = await injectBuilderHeaders(
        finalHeaders,
        builderConfig,
        {
          method: 'POST',
          requestPath: '/order',
          body: requestBody,
        }
      );
      finalHeaders = headersWithBuilder;
    }
  } catch (error) {
    // Builder headers are optional - continue without them
    console.warn('Could not inject Builder headers:', error);
  }
  
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/clob/orders`, {
      method: 'POST',
      headers: finalHeaders,
      body: requestBody,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Failed to place order: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend proxy not available. Start your backend server to enable trading.');
    }
    throw error;
  }
}

/**
 * Cancel an order
 * @param orderId - Order ID to cancel
 * @param authHeaders - Authentication headers
 * @returns Success status
 */
export async function cancelOrder(
  orderId: string,
  authHeaders?: Record<string, string>
): Promise<void> {
  const { env } = await import('../config/env');
  
  if (!env.apiBaseUrl || env.apiBaseUrl.trim() === '') {
    throw new Error('Backend proxy required for canceling orders.');
  }
  
  // Inject Builder headers for order attribution
  let finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };
  
  try {
    // Import builder config and inject headers
    const { getBuilderConfig } = await import('../config/builderConfig');
    const { injectBuilderHeaders } = await import('./builderAuth');
    const builderConfig = getBuilderConfig();
    
    if (builderConfig) {
      const headersWithBuilder = await injectBuilderHeaders(
        finalHeaders,
        builderConfig,
        {
          method: 'DELETE',
          requestPath: `/order/${orderId}`,
        }
      );
      finalHeaders = headersWithBuilder;
    }
  } catch (error) {
    // Builder headers are optional - continue without them
    console.warn('Could not inject Builder headers:', error);
  }
  
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/clob/orders/${orderId}`, {
      method: 'DELETE',
      headers: finalHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel order: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Backend proxy not available.');
    }
    throw error;
  }
}

/**
 * Get user orders
 * @param userAddress - User wallet address
 * @param authHeaders - Authentication headers
 * @returns Array of orders
 */
export async function getUserOrders(
  userAddress: string,
  authHeaders?: Record<string, string>
): Promise<OrderResponse[]> {
  const { env } = await import('../config/env');
  
  if (!env.apiBaseUrl || env.apiBaseUrl.trim() === '') {
    return [];
  }
  
  try {
    const response = await fetch(
      `${env.apiBaseUrl}/api/clob/orders?user=${userAddress}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      }
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Silently fail
  }
  
  return [];
}

/**
 * Get trades for a token
 * @param tokenId - Token ID
 * @returns Array of trades
 */
export async function getTrades(tokenId: string): Promise<Trade[]> {
  const { env } = await import('../config/env');
  
  // Try backend proxy first
  if (env.apiBaseUrl && env.apiBaseUrl.trim() !== '') {
    try {
      const response = await fetch(
        `${env.apiBaseUrl}/api/clob/trades?token_id=${tokenId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Fall through
    }
  }
  
  // Try direct API
  try {
    const response = await fetch(`${CLOB_API_BASE}/trades?token_id=${tokenId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Silently fail
  }
  
  return [];
}

/**
 * Get user holdings
 * @param userAddress - User wallet address
 * @param authHeaders - Authentication headers
 * @returns Array of holdings
 */
export async function getUserHoldings(
  userAddress: string,
  authHeaders?: Record<string, string>
): Promise<UserHolding[]> {
  const { env } = await import('../config/env');
  
  if (!env.apiBaseUrl || env.apiBaseUrl.trim() === '') {
    return [];
  }
  
  try {
    const response = await fetch(
      `${env.apiBaseUrl}/api/data/holdings?user=${userAddress}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      }
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Silently fail
  }
  
  return [];
}

/**
 * Get prices for multiple tokens in a single batch request
 * This is much more efficient than calling getPrice() multiple times
 * 
 * Rate Limit: 80 requests/10s (vs 200/10s for individual calls)
 * Benefit: Reduces 100 individual calls to 1 batch call
 * 
 * @param tokenIds - Array of token IDs to fetch prices for
 * @returns Array of prices { token_id, price }
 */
export async function getBatchPrices(tokenIds: string[]): Promise<{ token_id: string; price: string }[]> {
  const { env } = await import('../config/env');
  
  // Prepare request body
  const requestBody = tokenIds.map(id => ({ token_id: id }));
  
  // Try backend proxy first
  if (env.apiBaseUrl && env.apiBaseUrl.trim() !== '') {
    try {
      const response = await fetch(`${env.apiBaseUrl}/api/clob/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Fall through to direct API
    }
  }
  
  // Try direct CLOB API
  try {
    const response = await fetch(`${CLOB_API_BASE}/prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error: any) {
    if (env.isDevelopment) {
      console.warn('Batch prices API requires backend proxy due to CORS');
    }
  }
  
  return [];
}

/**
 * Get order books for multiple tokens in a single batch request
 * 
 * Rate Limit: 80 requests/10s (vs 200/10s for individual calls)
 * 
 * @param tokenIds - Array of token IDs to fetch order books for
 * @returns Array of order books
 */
export async function getBatchOrderBooks(
  tokenIds: string[]
): Promise<{ token_id: string; bids: OrderBookEntry[]; asks: OrderBookEntry[] }[]> {
  const { env } = await import('../config/env');
  
  // Prepare request body
  const requestBody = tokenIds.map(id => ({ token_id: id }));
  
  // Try backend proxy first
  if (env.apiBaseUrl && env.apiBaseUrl.trim() !== '') {
    try {
      const response = await fetch(`${env.apiBaseUrl}/api/clob/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Fall through
    }
  }
  
  // Try direct CLOB API
  try {
    const response = await fetch(`${CLOB_API_BASE}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error: any) {
    if (env.isDevelopment) {
      console.warn('Batch order books API requires backend proxy due to CORS');
    }
  }
  
  return [];
}

/**
 * Cancel all open orders for the user
 * Emergency function to quickly exit all positions
 * 
 * Rate Limit: 20 requests/10s (burst), 5 requests/10s (sustained)
 * 
 * @param authHeaders - Authentication headers
 * @returns Success status
 */
export async function cancelAllOrders(authHeaders?: Record<string, string>): Promise<void> {
  const { env } = await import('../config/env');
  
  if (!env.apiBaseUrl || env.apiBaseUrl.trim() === '') {
    throw new Error('Backend proxy required for canceling orders.');
  }
  
  // Inject Builder headers
  let finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };
  
  try {
    const { getBuilderConfig } = await import('../config/builderConfig');
    const { injectBuilderHeaders } = await import('./builderAuth');
    const builderConfig = getBuilderConfig();
    
    if (builderConfig) {
      const headersWithBuilder = await injectBuilderHeaders(
        finalHeaders,
        builderConfig,
        {
          method: 'DELETE',
          requestPath: '/cancel-all',
        }
      );
      finalHeaders = headersWithBuilder;
    }
  } catch (error) {
    console.warn('Could not inject Builder headers:', error);
  }
  
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/clob/cancel-all`, {
      method: 'DELETE',
      headers: finalHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel all orders: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Backend proxy not available.');
    }
    throw error;
  }
}

/**
 * Cancel all open orders for a specific market
 * 
 * Rate Limit: 80 requests/10s (burst), 20 requests/10s (sustained)
 * 
 * @param assetId - Asset ID (token ID) to cancel orders for
 * @param authHeaders - Authentication headers
 * @returns Success status
 */
export async function cancelMarketOrders(
  assetId: string,
  authHeaders?: Record<string, string>
): Promise<void> {
  const { env } = await import('../config/env');
  
  if (!env.apiBaseUrl || env.apiBaseUrl.trim() === '') {
    throw new Error('Backend proxy required for canceling orders.');
  }
  
  const requestBody = JSON.stringify({ asset_id: assetId });
  
  // Inject Builder headers
  let finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };
  
  try {
    const { getBuilderConfig } = await import('../config/builderConfig');
    const { injectBuilderHeaders } = await import('./builderAuth');
    const builderConfig = getBuilderConfig();
    
    if (builderConfig) {
      const headersWithBuilder = await injectBuilderHeaders(
        finalHeaders,
        builderConfig,
        {
          method: 'DELETE',
          requestPath: '/cancel-market-orders',
          body: requestBody,
        }
      );
      finalHeaders = headersWithBuilder;
    }
  } catch (error) {
    console.warn('Could not inject Builder headers:', error);
  }
  
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/clob/cancel-market-orders`, {
      method: 'DELETE',
      headers: finalHeaders,
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel market orders: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Backend proxy not available.');
    }
    throw error;
  }
}

/**
 * Check if an order will match (pre-flight check)
 * Use this before placing an order to avoid failed submissions
 * 
 * @param tokenId - Token ID
 * @param price - Order price (0-1)
 * @param side - BUY or SELL
 * @param size - Order size in shares
 * @returns Whether the order will score/match
 */
export async function isOrderScoring(
  tokenId: string,
  price: number,
  side: 'BUY' | 'SELL',
  size: string
): Promise<{ scoring: boolean }> {
  const { env } = await import('../config/env');
  
  const requestBody = JSON.stringify({
    token_id: tokenId,
    price: price.toString(),
    side,
    size,
  });
  
  // Try backend proxy first
  if (env.apiBaseUrl && env.apiBaseUrl.trim() !== '') {
    try {
      const response = await fetch(`${env.apiBaseUrl}/api/clob/order-scoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Fall through
    }
  }
  
  // Try direct CLOB API
  try {
    const response = await fetch(`${CLOB_API_BASE}/order-scoring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Silently fail
  }
  
  // Default to true (assume order will match)
  return { scoring: true };
}

/**
 * Get balance and allowance information for a user
 * Checks if user has approved USDC for trading
 * 
 * @param assetType - 'COLLATERAL' (USDC) or 'CONDITIONAL' (outcome tokens)
 * @param authHeaders - Authentication headers
 * @returns Balance and allowance info
 */
export async function getBalanceAllowance(
  assetType: 'COLLATERAL' | 'CONDITIONAL' = 'COLLATERAL',
  authHeaders?: Record<string, string>
): Promise<{
  balance: string;
  allowance: string;
  allowance_sufficient: boolean;
} | null> {
  const { env } = await import('../config/env');
  
  if (!env.apiBaseUrl || env.apiBaseUrl.trim() === '') {
    return null;
  }
  
  try {
    const response = await fetch(
      `${env.apiBaseUrl}/api/clob/balance-allowance?asset_type=${assetType}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      }
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Silently fail
  }
  
  return null;
}

/**
 * Update balance allowance (approve USDC for trading)
 * This uses EIP-712 signature, not a blockchain transaction
 * User signs a message to approve USDC spending
 * 
 * Rate Limit: 20 requests/10s
 * 
 * @param assetType - 'COLLATERAL' (USDC) or 'CONDITIONAL' (outcome tokens)
 * @param authHeaders - Authentication headers
 * @returns Success status
 */
export async function updateBalanceAllowance(
  assetType: 'COLLATERAL' | 'CONDITIONAL' = 'COLLATERAL',
  authHeaders?: Record<string, string>
): Promise<void> {
  const { env } = await import('../config/env');
  
  if (!env.apiBaseUrl || env.apiBaseUrl.trim() === '') {
    throw new Error('Backend proxy required for updating allowance.');
  }
  
  const requestBody = JSON.stringify({ asset_type: assetType });
  
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/clob/balance-allowance/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`Failed to update allowance: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Backend proxy not available.');
    }
    throw error;
  }
}

/**
 * Get historical price data for a token
 * Useful for charts and volatility analysis
 * 
 * @param tokenId - Token ID
 * @param interval - Time interval ('1h', '6h', '1d', '1w', 'max')
 * @param fidelity - Data points per interval (default: 1)
 * @returns Array of historical prices
 */
export async function getPricesHistory(
  tokenId: string,
  interval: '1h' | '6h' | '1d' | '1w' | 'max' = '1d',
  fidelity: number = 1
): Promise<{ timestamp: number; price: string }[]> {
  const { env } = await import('../config/env');
  
  // Try backend proxy first
  if (env.apiBaseUrl && env.apiBaseUrl.trim() !== '') {
    try {
      const response = await fetch(
        `${env.apiBaseUrl}/api/clob/prices-history?token_id=${tokenId}&interval=${interval}&fidelity=${fidelity}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Fall through
    }
  }
  
  // Try direct CLOB API
  try {
    const response = await fetch(
      `${CLOB_API_BASE}/prices-history?token_id=${tokenId}&interval=${interval}&fidelity=${fidelity}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Silently fail
  }
  
  return [];
}

/**
 * Place order via backend proxy (legacy function - use placeOrder instead)
 * @deprecated Use placeOrder() instead
 */
export async function placeOrderViaProxy(params: PlaceOrderParams): Promise<OrderResponse> {
  return placeOrder(params);
}

