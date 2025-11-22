/**
 * CLOB API Service (React Native)
 * Handles trading operations via Polymarket CLOB API
 * 
 * Documentation: https://docs.polymarket.com/developers/CLOB/introduction
 */

export const CLOB_API_BASE = 'https://clob.polymarket.com';
export const DATA_API_BASE = 'https://data-api.polymarket.com';

export interface OrderBookEntry {
  price: string;
  size: string;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface PlaceOrderParams {
  tokenId: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: number;
  orderType?: 'LIMIT' | 'MARKET';
  conditionId?: string;
  outcomeIndex?: 0 | 1;
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

// Environment config for mobile
const getApiBaseUrl = () => {
  // TODO: Replace with your backend URL or Vercel deployment
  return process.env.EXPO_PUBLIC_API_BASE_URL || '';
};

/**
 * Get Order Book for a market
 */
export async function getOrderBook(tokenId: string): Promise<OrderBook | null> {
  const apiBaseUrl = getApiBaseUrl();
  
  if (apiBaseUrl) {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/clob/book?token_id=${tokenId}`,
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
    } catch (error) {
      console.log('📡 Backend proxy not available, using direct CLOB API');
    }
  }
  // Fallback: try direct CLOB API endpoints (React Native is not blocked by browser CORS)
  const tryEndpoints = async (): Promise<OrderBook | null> => {
    const candidates = [
      `${CLOB_API_BASE}/book?token_id=${tokenId}`,
      `${CLOB_API_BASE}/orderbook?token_id=${tokenId}`,
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.bids || data.asks)) {
            return {
              bids: data.bids || [],
              asks: data.asks || [],
            };
          }
        }
      } catch (e) {
        // try next
      }
    }
    return null;
  };

  return await tryEndpoints();
}

/**
 * Get all markets from CLOB API
 */
export async function getMarkets(conditionId?: string): Promise<Market[]> {
  const apiBaseUrl = getApiBaseUrl();
  
  const url = conditionId
    ? `${DATA_API_BASE}/markets?condition_id=${conditionId}`
    : `${DATA_API_BASE}/markets`;
  
  if (apiBaseUrl) {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/clob/markets${conditionId ? `?condition_id=${conditionId}` : ''}`,
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
  } catch (error) {
    console.warn('CLOB markets API error:', error);
  }
  
  return [];
}

/**
 * Place an order via CLOB API
 */
export async function placeOrder(
  params: PlaceOrderParams,
  authHeaders?: Record<string, string>
): Promise<OrderResponse> {
  const apiBaseUrl = getApiBaseUrl();
  
  if (!apiBaseUrl) {
    throw new Error('Backend proxy required for placing orders. Set EXPO_PUBLIC_API_BASE_URL.');
  }
  
  const requestBody = JSON.stringify({
    token_id: params.tokenId,
    side: params.side,
    size: params.size,
    price: params.price,
    order_type: params.orderType || 'LIMIT',
  });
  
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/clob/orders`, {
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
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Backend proxy not available. Check your connection.');
    }
    throw error;
  }
}

/**
 * Get batch prices for multiple tokens
 */
export async function getBatchPrices(tokenIds: string[]): Promise<{ token_id: string; price: string }[]> {
  const apiBaseUrl = getApiBaseUrl();
  const requestBody = tokenIds.map(id => ({ token_id: id }));
  
  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/clob/prices`, {
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
  } catch (error) {
    console.warn('Batch prices API error:', error);
  }
  
  return [];
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  orderId: string,
  authHeaders?: Record<string, string>
): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  
  if (!apiBaseUrl) {
    throw new Error('Backend proxy required for canceling orders.');
  }
  
  const response = await fetch(`${apiBaseUrl}/api/clob/orders/${orderId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel order: ${response.status}`);
  }
}

/**
 * Get user orders
 */
export async function getUserOrders(
  userAddress: string,
  authHeaders?: Record<string, string>
): Promise<OrderResponse[]> {
  const apiBaseUrl = getApiBaseUrl();
  
  if (!apiBaseUrl) {
    return [];
  }
  
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/clob/orders?user=${userAddress}`,
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
 * Get user holdings
 */
export async function getUserHoldings(
  userAddress: string,
  authHeaders?: Record<string, string>
): Promise<UserHolding[]> {
  const apiBaseUrl = getApiBaseUrl();
  
  if (!apiBaseUrl) {
    return [];
  }
  
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/data/holdings?user=${userAddress}`,
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
 * Fetch market price via order book (for polling fallback)
 */
export async function fetchMarketPrice(
  tokenId: string
): Promise<{ yesPrice: number; noPrice: number } | null> {
  try {
    const orderBook = await getOrderBook(tokenId);
    
    if (!orderBook || !orderBook.bids.length || !orderBook.asks.length) {
      return null;
    }

    // Get best bid/ask
    const bestBid = parseFloat(orderBook.bids[0].price);
    const bestAsk = parseFloat(orderBook.asks[0].price);
    
    // Calculate mid price
    const yesPrice = (bestBid + bestAsk) / 2;
    const noPrice = 1 - yesPrice;
    
    return { yesPrice, noPrice };
  } catch (error) {
    return null;
  }
}
