/**
 * Polymarket Proxy Service
 * Fetches markets from Polymarket API directly or through backend proxy
 * 
 * Note: Polymarket API has CORS restrictions, so direct calls may fail.
 * If CORS blocks the request, use a backend proxy.
 */

import { env } from '../config/env';
import type { Market } from '../types';

// Polymarket API endpoints
// Use Vite proxy in development, Vercel serverless function in production
const POLYMARKET_GAMMA_API = env.isDevelopment 
  ? '/polymarket-api'  // Use Vite proxy in dev (bypasses CORS)
  : '/api/polymarket-proxy';  // Use Vercel serverless function in production
const BACKEND_API_BASE = env.apiBaseUrl || '';

/**
 * Get markets from Polymarket API directly or through backend proxy
 * Tries Polymarket API first, falls back to backend proxy if CORS blocks
 */
export async function getMarketsViaProxy(
  limit: number = 100,
  offset: number = 0
): Promise<Market[]> {
  // Try Polymarket API directly first
  try {
    const polymarketUrl = `${POLYMARKET_GAMMA_API}/markets?limit=${limit}&offset=${offset}&active=true&closed=false`;
    
    if (env.isDevelopment && !(window as any).__polymarket_direct_attempt) {
      console.info('🔄 Fetching markets via Vite proxy (bypasses CORS)...');
      (window as any).__polymarket_direct_attempt = true;
    }
    
    const response = await fetch(polymarketUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Polymarket API returned non-JSON response');
    }

    const data = await response.json();
    
    // Transform Polymarket API response to our Market format
    // Handle both array response and object with markets property
    const rawMarkets = Array.isArray(data) ? data : (data.markets || []);
    
    const markets: Market[] = rawMarkets
      .filter((market: any) => market.active !== false && market.closed !== true)
      .map((market: any) => {
        // Parse outcomes if it's a string
        let outcomes = market.outcomes;
        if (typeof outcomes === 'string') {
          try {
            outcomes = JSON.parse(outcomes);
          } catch {
            outcomes = ['Yes', 'No'];
          }
        }
        
        // Get prices - Polymarket API uses bestBid/bestAsk
        // bestBid = YES price, bestAsk = NO price (inverted)
        // If bestBid/bestAsk are 0, use defaults
        let yesPrice = 0.5;
        let noPrice = 0.5;
        
        if (market.bestBid !== undefined && market.bestBid > 0) {
          yesPrice = market.bestBid;
        }
        if (market.bestAsk !== undefined && market.bestAsk > 0 && market.bestAsk < 1) {
          noPrice = 1 - market.bestAsk;
        }
        
        // If prices still default, try to calculate from spread
        if (yesPrice === 0.5 && noPrice === 0.5 && market.spread !== undefined) {
          // Use spread to estimate prices
          yesPrice = 0.5;
          noPrice = 0.5;
        }
        
        // Calculate liquidity from AMM + CLOB
        const liquidity = (market.liquidityAmm || 0) + (market.liquidityClob || 0) || 
                         (market.liquidity || 0);
        
        // Extract category from multiple sources: sport field, tags, event title, or market question
        const sportField = (market.sport || market.sportName || '').toLowerCase();
        const tags = Array.isArray(market.tags) ? market.tags.join(' ').toLowerCase() : (market.tags || '').toLowerCase();
        const eventTitle = (market.events?.[0]?.title || '').toLowerCase();
        const question = (market.question || market.title || '').toLowerCase();
        const searchText = `${sportField} ${tags} ${eventTitle} ${question}`;
        
        // Determine category from search text (check most specific first)
        let category = 'Football'; // Default
        
        if (searchText.includes('cricket')) {
          category = 'Cricket';
        } else if (searchText.includes('basketball')) {
          category = 'Basketball';
        } else if (searchText.includes('baseball')) {
          category = 'Baseball';
        } else if (searchText.includes('soccer') || searchText.includes('football')) {
          // Soccer and Football are similar - prioritize soccer if mentioned
          category = searchText.includes('soccer') ? 'Soccer' : 'Football';
        } else if (searchText.includes('tennis')) {
          category = 'Tennis';
        } else if (searchText.includes('hockey')) {
          category = 'Hockey';
        } else if (searchText.includes('mma') || searchText.includes('mixed martial arts')) {
          category = 'MMA';
        } else if (searchText.includes('boxing')) {
          category = 'Boxing';
        }
        
        // Extract image URL from Polymarket API response
        // API may return: image, imageUrl, or image_url
        const imageUrl = market.image || market.imageUrl || market.image_url || undefined;
        
        return {
          id: market.id || market.conditionId || String(market.slug || ''),
          title: market.question || market.title || 'Untitled Market',
          category: category as any,
          yesPrice: Math.round(yesPrice * 100),
          noPrice: Math.round(noPrice * 100),
          volume: formatLiquidity(liquidity),
          participants: market.competitive || 0,
          endDate: market.endDate ? new Date(market.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
          imageUrl: imageUrl,
          trending: undefined,
        };
      });

    if (markets.length > 0) {
      if (env.isDevelopment && !(window as any).__polymarket_direct_success) {
        console.info(`✅ Successfully fetched ${markets.length} markets from Polymarket API via proxy`);
        (window as any).__polymarket_direct_success = true;
      }
      return markets;
    } else {
      // No markets returned - might be empty response or parsing issue
      if (env.isDevelopment && !(window as any).__polymarket_empty_warning) {
        console.warn('⚠️ Polymarket API returned empty markets array. Raw data:', data);
        (window as any).__polymarket_empty_warning = true;
      }
      // Fall through to backend proxy
    }
  } catch (error: any) {
    // CORS error - try backend proxy instead
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('CORS') ||
        error.message?.includes('NetworkError') ||
        error.name === 'TypeError' ||
        error.message?.includes('Access-Control-Allow-Origin')) {
      if (env.isDevelopment && !(window as any).__polymarket_cors_warning) {
        console.warn('⚠️ Direct Polymarket API call blocked by CORS. Trying backend proxy...', error.message);
        (window as any).__polymarket_cors_warning = true;
      }
      // Fall through to backend proxy
    } else {
      // Other error from Polymarket API
      if (env.isDevelopment && !(window as any).__polymarket_api_error) {
        console.error('❌ Polymarket API error:', error.message, error);
        (window as any).__polymarket_api_error = true;
      }
      // Fall through to backend proxy
    }
  }

  // Fallback: Try backend proxy (only if backend is configured)
  if (!BACKEND_API_BASE || BACKEND_API_BASE.trim() === '') {
    // No backend configured - return empty array to prevent 404s
    if (env.isDevelopment) {
      console.info('Skipping backend proxy call - no backend configured (VITE_API_BASE_URL not set)');
    }
    return [];
  }

  try {
    const response = await fetch(
      `${BACKEND_API_BASE}/api/markets?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch markets: ${response.status} ${response.statusText}`);
    }

    // Check if response is actually JSON (not HTML)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Backend returned HTML (likely Vite dev server or error page)
      if (env.isDevelopment && !(window as any).__backend_html_warning_shown) {
        console.warn(
          `Backend API endpoint not found at ${BACKEND_API_BASE}/api/markets. ` +
          `Received HTML instead of JSON. Make sure your backend server is running and the endpoint is configured.`
        );
        (window as any).__backend_html_warning_shown = true;
      }
      return [];
    }

    const data = await response.json();
    
    // Handle different response formats
    // Backend may return { markets: [...] } or just [...]
    const markets = Array.isArray(data) ? data : (data.markets || []);
    
    return markets;
  } catch (error: any) {
    // JSON parse errors (HTML response)
    if (error.message?.includes('Unexpected token') || 
        error.message?.includes('not valid JSON') ||
        error.message?.includes('<!DOCTYPE')) {
      if (env.isDevelopment && !(window as any).__backend_html_warning_shown) {
        console.warn(
          `Backend API endpoint returned HTML instead of JSON at ${BACKEND_API_BASE}/api/markets. ` +
          `This usually means the endpoint doesn't exist. Make sure your backend server has the /api/markets route configured.`
        );
        (window as any).__backend_html_warning_shown = true;
      }
      return [];
    }

    // Connection errors - backend not available
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.message?.includes('NetworkError')) {
      // Backend not available - silently return empty array
      // Only log once to avoid spam
      if (env.isDevelopment && !(window as any).__backend_warning_shown) {
        const backendUrl = BACKEND_API_BASE || 'http://localhost:8000';
        console.info(`Backend not available. Markets will load when backend server is running at ${backendUrl}`);
        (window as any).__backend_warning_shown = true;
      }
      return [];
    }
    
    // Other errors
    if (env.isDevelopment) {
      console.error('Error fetching markets via proxy:', error);
    }
    return [];
  }
}

// Helper function to format liquidity
function formatLiquidity(liquidity: number): string {
  if (liquidity >= 1000000) {
    return `$${(liquidity / 1000000).toFixed(1)}M`;
  } else if (liquidity >= 1000) {
    return `$${(liquidity / 1000).toFixed(0)}k`;
  }
  return `$${liquidity.toFixed(0)}`;
}

