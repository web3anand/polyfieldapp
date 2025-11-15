/// <reference types="vite/client" />
/**
 * Polymarket Core Functions
 * Handles Polymarket API integration and trading operations
 * 
 * Documentation: https://docs.polymarket.com/
 * 
 * Note: Polymarket API has CORS restrictions. All API calls should go through
 * your backend proxy. Direct browser calls will fail.
 * 
 * For production, use:
 * - @polymarket/clob-client for trading operations
 * - Backend proxy for market data (gamma-api.polymarket.com)
 */

// Polymarket API Configuration
// These endpoints require backend proxy due to CORS
const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com';
const POLYMARKET_CLOB_API = 'https://clob.polymarket.com';
const POLYMARKET_DATA_API = 'https://data-api.polymarket.com';

export interface PolymarketClient {
  // Client instance for trading operations
}

export interface RelayerClient {
  // Relayer client for gasless trading
}

export interface Market {
  id: string;
  question: string;
  tokenId: string;
  conditionId: string;
  liquidity: number;
  odds: {
    yes: number;
    no: number;
  };
  sport?: string;
  endDate?: string;
  imageUrl?: string;
  active: boolean;
}

/**
 * Initialize Polymarket Client
 * @param privateKey - Private key for wallet operations
 * @returns PolymarketClient instance
 */
export async function initPM(privateKey: string): Promise<PolymarketClient> {
  // TODO: Initialize Polymarket SDK client
  // This will be implemented when Polymarket SDK is integrated
  throw new Error('Polymarket SDK integration pending');
}

/**
 * Initialize Polymarket Client with Builder (Gasless Trading)
 * @param privateKey - Private key for proxy wallet
 * @param onChainWalletAddress - Main wallet address
 * @returns Object with polymarket client and relayer client
 */
export async function initPMWithBuilder(
  privateKey: string,
  onChainWalletAddress: string
): Promise<{ polymarket: PolymarketClient; relayerClient: RelayerClient }> {
  // TODO: Initialize Polymarket SDK with Builder/Relayer
  // This enables gasless trading
  throw new Error('Polymarket Builder integration pending');
}

/**
 * Get Active Markets from Polymarket API
 * Note: This requires a backend proxy due to CORS restrictions.
 * The backend should proxy requests to Polymarket API.
 * 
 * @param limit - Number of markets to fetch (default: 100)
 * @param offset - Pagination offset (default: 0)
 * @returns Array of Market objects
 */
export async function getActiveMarkets(
  limit: number = 100,
  offset: number = 0
): Promise<Market[]> {
  try {
    // IMPORTANT: Direct API calls will fail due to CORS
    // This function should ONLY be called from backend proxy
    // Frontend should use getMarketsViaProxy() instead
    
    // Direct API call will fail due to CORS - this is expected
    // Backend proxy at /api/markets will handle this
    const response = await fetch(
      `${POLYMARKET_GAMMA_API}/markets?limit=${limit}&offset=${offset}&active=true&closed=false`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch markets: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Polymarket API response to our Market format
    return data.map((market: any) => ({
      id: market.id || market.conditionId,
      question: market.question || market.title,
      tokenId: market.tokenId,
      conditionId: market.conditionId,
      liquidity: market.liquidity || 0,
      odds: {
        yes: market.outcomes?.[0]?.price || 0.5,
        no: market.outcomes?.[1]?.price || 0.5,
      },
      sport: market.category || market.sport,
      endDate: market.endDate || market.end_date_iso,
      imageUrl: market.image || market.imageUrl,
      active: market.active !== false,
    }));
  } catch (error: any) {
    // CORS errors are expected - backend proxy will handle this
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      if (import.meta.env.DEV) {
        console.info('Polymarket API requires backend proxy due to CORS. This is expected until backend is ready.');
      }
      return []; // Return empty array - backend will provide data
    }
    console.error('Error fetching active markets:', error);
    return []; // Return empty array on any error
  }
}

/**
 * Get Order Book for a Market
 * @param tokenId - Market token ID
 * @returns Order book data
 */
export async function getOrderBook(tokenId: string) {
  // CLOB API requires backend proxy due to CORS
  // Return null to prevent console errors
  // This function should be called through backend proxy when available
  return null;
  
  // Uncomment when backend proxy is ready:
  // try {
  //   const { env } = await import('../config/env');
  //   const backendUrl = env.apiBaseUrl || 'http://localhost:8000';
  //   const response = await fetch(
  //     `${backendUrl}/api/clob/book?token_id=${tokenId}`
  //   );
  //
  //   if (!response.ok) {
  //     throw new Error(`Failed to fetch order book: ${response.statusText}`);
  //   }
  //
  //   return await response.json();
  // } catch (error) {
  //   console.error('Error fetching order book:', error);
  //   return null;
  // }
}

/**
 * Place Bet (Standard Transaction)
 * @param polymarket - Polymarket client instance
 * @param tokenId - Market token ID
 * @param side - 'BUY' or 'SELL'
 * @param amount - Bet amount in USDC
 * @param price - Odds/price for the bet
 * @returns Transaction result
 */
export async function placeBet(
  polymarket: PolymarketClient,
  tokenId: string,
  side: 'BUY' | 'SELL',
  amount: string,
  price: number
): Promise<{ hash: string; success: boolean }> {
  // TODO: Implement bet placement via Polymarket SDK
  // This will be implemented when Polymarket SDK is integrated
  throw new Error('Bet placement implementation pending');
}

/**
 * Place Bet with Builder (Gasless Transaction)
 * @param relayerClient - Relayer client instance
 * @param tokenId - Market token ID
 * @param side - 'BUY' or 'SELL'
 * @param amount - Bet amount in USDC
 * @param price - Odds/price for the bet
 * @returns Transaction result
 */
export async function placeBetWithBuilder(
  relayerClient: RelayerClient,
  tokenId: string,
  side: 'BUY' | 'SELL',
  amount: string,
  price: number
): Promise<{ hash: string; success: boolean }> {
  // TODO: Implement gasless bet placement via Polymarket Builder
  // This will be implemented when Polymarket SDK is integrated
  throw new Error('Gasless bet placement implementation pending');
}

/**
 * Filter Settled Markets
 * Removes markets where outcome is already determined
 */
export function filterSettledMarkets(markets: Market[]): Market[] {
  return markets.filter((market) => {
    const yesPrice = market.odds.yes;
    const noPrice = market.odds.no;
    const isSettled = yesPrice >= 0.99 || noPrice >= 0.99;
    return !isSettled;
  });
}


