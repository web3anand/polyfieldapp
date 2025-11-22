/**
 * Polymarket Trading Service
 * Complete implementation for placing orders on Polymarket
 * 
 * Documentation: https://docs.polymarket.com/developers
 */

const CLOB_API_URL = process.env.EXPO_PUBLIC_POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';
const DATA_API_URL = process.env.EXPO_PUBLIC_POLYMARKET_DATA_URL || 'https://data-api.polymarket.com';

export interface OrderParams {
  tokenId: string;
  side: 'BUY' | 'SELL';
  size: string; // Amount in shares
  price: number; // Price (0-1 range)
  userAddress: string;
  feeRateBps?: number; // Fee rate in basis points (default: 0)
  nonce?: number; // Optional nonce for order
  expiration?: number; // Optional expiration timestamp
}

export interface SignedOrder {
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  maker: string;
  taker: string;
  salt: string;
  signature: string;
  feeRateBps: number;
  nonce: number;
  signer: string;
  expiration: number;
  side: 'BUY' | 'SELL';
}

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  transactionHash?: string;
  error?: string;
  status?: string;
}

export interface OrderBook {
  asset_id: string;
  bids: Array<{
    price: string;
    size: string;
  }>;
  asks: Array<{
    price: string;
    size: string;
  }>;
  timestamp: number;
}

export interface Market {
  condition_id: string;
  tokens: Array<{
    token_id: string;
    outcome: string;
    price: number;
  }>;
}

/**
 * Get order book for a specific token
 * @param tokenId - The token ID to fetch order book for
 * @returns Order book data
 */
export async function getOrderBook(tokenId: string): Promise<OrderBook | null> {
  try {
    const response = await fetch(`${CLOB_API_URL}/book?token_id=${tokenId}`);
    
    if (!response.ok) {
      console.error('Failed to fetch order book:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching order book:', error);
    return null;
  }
}

/**
 * Get best price from order book
 * @param tokenId - The token ID
 * @param side - BUY or SELL
 * @returns Best available price
 */
export async function getBestPrice(tokenId: string, side: 'BUY' | 'SELL'): Promise<number | null> {
  try {
    const orderBook = await getOrderBook(tokenId);
    if (!orderBook) return null;

    if (side === 'BUY' && orderBook.asks.length > 0) {
      // For buying, we want the lowest ask
      return parseFloat(orderBook.asks[0].price);
    } else if (side === 'SELL' && orderBook.bids.length > 0) {
      // For selling, we want the highest bid
      return parseFloat(orderBook.bids[0].price);
    }

    return null;
  } catch (error) {
    console.error('Error getting best price:', error);
    return null;
  }
}

/**
 * Create an unsigned order object
 * @param params - Order parameters
 * @returns Unsigned order object ready for signing
 */
export function createOrder(params: OrderParams): any {
  const {
    tokenId,
    side,
    size,
    price,
    userAddress,
    feeRateBps = 0,
    nonce = Date.now(),
    expiration = Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  } = params;

  // Calculate maker and taker amounts based on side
  // For BUY orders: makerAmount is USDC, takerAmount is shares
  // For SELL orders: makerAmount is shares, takerAmount is USDC
  // Manual parseUnits replacement (USDC has 6 decimals)
  const sharesAmount = Math.floor(parseFloat(size) * 1e6).toString();
  const usdcAmount = Math.floor(parseFloat(size) * price * 1e6).toString();

  const order = {
    salt: nonce.toString(),
    maker: userAddress.toLowerCase(),
    signer: userAddress.toLowerCase(),
    taker: '0x0000000000000000000000000000000000000000', // Zero address = any taker
    tokenId,
    makerAmount: side === 'BUY' ? usdcAmount : sharesAmount,
    takerAmount: side === 'BUY' ? sharesAmount : usdcAmount,
    side,
    feeRateBps,
    nonce,
    expiration,
  };

  return order;
}

/**
 * Sign an order using Privy wallet (EIP-712)
 * @param order - Order object to sign  
 * @param signTypedData - Privy's signTypedData function
 * @returns Signed order
 */
export async function signOrderWithPrivy(
  order: any,
  signTypedData: (data: any) => Promise<string>
): Promise<SignedOrder> {
  try {
    const domain = {
      name: 'Polymarket CTF Exchange',
      version: '1',
      chainId: 137, // Polygon
      verifyingContract: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E', // CTF Exchange
    };

    const types = {
      Order: [
        { name: 'salt', type: 'uint256' },
        { name: 'maker', type: 'address' },
        { name: 'signer', type: 'address' },
        { name: 'taker', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'makerAmount', type: 'uint256' },
        { name: 'takerAmount', type: 'uint256' },
        { name: 'expiration', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'feeRateBps', type: 'uint256' },
        { name: 'side', type: 'uint8' },
        { name: 'signatureType', type: 'uint8' },
      ],
    };

    // For EIP-712 signing, side must be 0 or 1
    const value = {
      ...order,
      side: order.side === 'BUY' ? 0 : 1,
      signatureType: 0, // EOA signature
    };

    const signature = await signTypedData({
      domain,
      types,
      value,
      primaryType: 'Order',
    });

    // Return order with signature and correct format for API
    return {
      ...order,
      side: order.side === 'BUY' ? 0 : 1, // API expects 0/1 not string
      signatureType: 0,
      signature,
    };
  } catch (error) {
    console.error('Error signing order:', error);
    throw error;
  }
}

/**
 * Submit a signed order to Polymarket CLOB
 * @param signedOrder - The signed order object
 * @returns Order response
 */
export async function submitOrder(signedOrder: SignedOrder): Promise<OrderResponse> {
  try {
    const response = await fetch(`${CLOB_API_URL}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedOrder),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to submit order',
      };
    }

    return {
      success: true,
      orderId: data.orderID || data.order_id,
      transactionHash: data.transactionHash,
      status: 'submitted',
    };
  } catch (error: any) {
    console.error('Error submitting order:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit order',
    };
  }
}

/**
 * Complete order flow: create, sign with Privy, and submit via backend
 * @param params - Order parameters
 * @param signTypedData - Privy's signTypedData function
 * @param apiBaseUrl - Backend API URL for Builder attribution
 * @returns Order response
 */
export async function placeOrder(
  params: OrderParams,
  signTypedData: (data: any) => Promise<string>,
  apiBaseUrl: string
): Promise<OrderResponse> {
  try {
    console.log('🎯 Creating order:', params);

    // Step 1: Create unsigned order
    const order = createOrder(params);
    console.log('📝 Order created:', order);

    // Step 2: Sign the order with Privy wallet
    const signedOrder = await signOrderWithPrivy(order, signTypedData);
    console.log('✍️ Order signed with Privy');

    // Step 3: Submit to backend (adds Builder headers) then CLOB
    const response = await fetch(`${apiBaseUrl}/api/orders/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedOrder),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to submit order',
      };
    }

    return {
      success: true,
      orderId: data.orderId,
      transactionHash: data.transactionHash,
      status: 'submitted',
    };
  } catch (error: any) {
    console.error('❌ Error placing order:', error);
    return {
      success: false,
      error: error.message || 'Failed to place order',
    };
  }
}

/**
 * Place order via backend (client signs with Privy, backend adds Builder headers)
 * This is the recommended flow for gasless trading with attribution tracking
 * @param params - Order parameters
 * @param signTypedData - Privy's signTypedData function
 * @param apiBaseUrl - Backend API base URL
 * @returns Order response
 */
export async function placeOrderViaBackend(
  params: OrderParams,
  signTypedData: (data: any) => Promise<string>,
  apiBaseUrl: string
): Promise<OrderResponse> {
  try {
    console.log('🎯 Creating and signing order for backend submission:', params);

    // Step 1: Create unsigned order
    const order = createOrder(params);
    console.log('📝 Order created:', order);

    // Step 2: Sign with Privy wallet (EIP-712)
    const signedOrder = await signOrderWithPrivy(order, signTypedData);
    console.log('✍️ Order signed with Privy');

    // Step 3: Send signed order to backend (adds Builder headers for attribution)
    const response = await fetch(`${apiBaseUrl}/api/orders/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedOrder),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to place order',
      };
    }

    return {
      success: true,
      orderId: data.orderId,
      transactionHash: data.transactionHash,
      status: data.status || 'submitted',
    };
  } catch (error: any) {
    console.error('❌ Error placing order via backend:', error);
    return {
      success: false,
      error: error.message || 'Failed to place order',
    };
  }
}

/**
 * Get user's open orders
 * @param userAddress - User's wallet address
 * @returns Array of open orders
 */
export async function getUserOrders(userAddress: string): Promise<any[]> {
  try {
    const response = await fetch(`${CLOB_API_URL}/orders?maker=${userAddress}`);
    
    if (!response.ok) {
      console.error('Failed to fetch user orders:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

/**
 * Cancel an order
 * @param orderId - Order ID to cancel
 * @param userAddress - User's wallet address
 * @returns Cancellation response
 */
export async function cancelOrder(
  orderId: string,
  userAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CLOB_API_URL}/order/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maker: userAddress }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.error || 'Failed to cancel order',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error canceling order:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel order',
    };
  }
}

/**
 * Get market data from Data API
 * @param conditionId - Market condition ID
 * @returns Market data
 */
export async function getMarketData(conditionId: string): Promise<Market | null> {
  try {
    const response = await fetch(`${DATA_API_URL}/markets/${conditionId}`);
    
    if (!response.ok) {
      console.error('Failed to fetch market data:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}
