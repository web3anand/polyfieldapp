/**
 * CLOB API Service
 * Handles trading operations via Polymarket CLOB API
 * 
 * Documentation: https://docs.polymarket.com/clob/
 */

const CLOB_API_BASE = 'https://clob.polymarket.com';

export interface OrderBook {
  bids: Array<{ price: number; size: string }>;
  asks: Array<{ price: number; size: string }>;
}

export interface PlaceOrderParams {
  tokenId: string;
  side: 'BUY' | 'SELL';
  size: string; // Amount in shares
  price: number; // Price (0-1)
  user: string; // User wallet address
}

export interface OrderResponse {
  order_id: string;
  status: string;
  transaction_hash?: string;
}

/**
 * Get Order Book for a market
 * @param tokenId - Market token ID
 * @returns Order book with bids and asks
 */
export async function getOrderBook(tokenId: string): Promise<OrderBook | null> {
  // CLOB API requires backend proxy due to CORS
  // Skip direct API calls to prevent console errors
  const { env } = await import('../config/env');
  
  // Always return null for now - CLOB API requires backend proxy
  // This prevents CORS errors and 404s in console
  // When backend is ready, uncomment the code below and use backend proxy endpoint
  
  // if (!env.apiBaseUrl || env.apiBaseUrl.trim() === '') {
  //   return null;
  // }
  
  // try {
  //   const response = await fetch(`${env.apiBaseUrl}/api/clob/book?token_id=${tokenId}`, {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   });
  //
  //   if (!response.ok) {
  //     throw new Error(`Failed to fetch order book: ${response.status} ${response.statusText}`);
  //   }
  //
  //   const data = await response.json();
  //   return {
  //     bids: data.bids || [],
  //     asks: data.asks || [],
  //   };
  // } catch (error: any) {
  //   console.error('Error fetching order book:', error);
  //   return null;
  // }
  
  return null;
}

/**
 * Place an order via CLOB API
 * Note: Requires authentication and may be blocked by CORS
 * @param params - Order parameters
 * @returns Order response
 */
export async function placeOrder(params: PlaceOrderParams): Promise<OrderResponse> {
  try {
    // Note: This will likely fail due to CORS and authentication
    // In production, this should go through your backend proxy
    const response = await fetch(`${CLOB_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authentication would go here
        // 'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        token_id: params.tokenId,
        side: params.side,
        size: params.size,
        price: params.price,
        user: params.user,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to place order: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('CORS')) {
      throw new Error('Trading requires backend proxy due to CORS restrictions');
    }
    throw error;
  }
}

/**
 * Place order via backend proxy (recommended)
 * @param params - Order parameters
 * @returns Order response
 */
export async function placeOrderViaProxy(params: PlaceOrderParams): Promise<OrderResponse> {
  const { env } = await import('../config/env');
  const backendUrl = env.apiBaseUrl || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if needed
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to place order: ${response.status} ${response.statusText}`);
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

