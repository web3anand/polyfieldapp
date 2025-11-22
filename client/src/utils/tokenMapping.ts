/**
 * Token ID Mapping Utilities
 * Maps condition IDs to token IDs for YES/NO outcomes
 * 
 * Polymarket markets have:
 * - Condition ID: Identifies the market
 * - Token IDs: Two tokens per condition (one for YES, one for NO)
 */

/**
 * Get token ID for a condition and outcome
 * @param conditionId - Market condition ID
 * @param outcomeIndex - 0 for YES, 1 for NO
 * @returns Token ID or null if cannot be determined
 * 
 * Note: This function attempts to derive token IDs, but the actual token IDs
 * should come from the Polymarket API response. If not available, this is a fallback.
 */
import { getMarkets, DATA_API_BASE } from '../services/clobApi';

export async function getTokenId(conditionId: string, outcomeIndex: 0 | 1): Promise<string | null> {
  if (!conditionId) return null;

  // Try to load market metadata from the data API via getMarkets helper
  try {
    const markets = await getMarkets(conditionId);
    if (markets && markets.length > 0) {
      const market = markets[0] as any;
      const extracted = extractTokenIds(market);
      if (outcomeIndex === 0 && extracted.yesTokenId) return extracted.yesTokenId;
      if (outcomeIndex === 1 && extracted.noTokenId) return extracted.noTokenId;
      // Some APIs include token IDs directly on outcomes array
      if (market.outcomes && Array.isArray(market.outcomes)) {
        const outcome = market.outcomes.find((o: any) => o.index === outcomeIndex || o.side === (outcomeIndex === 0 ? 'YES' : 'NO'));
        if (outcome) return outcome.tokenId || outcome.token_id || null;
      }
    }
  } catch (e) {
    // fallthrough to direct data API fetch
  }

  // As a fallback, query the data API markets endpoint directly
  try {
    const resp = await fetch(`${DATA_API_BASE}/markets?condition_id=${encodeURIComponent(conditionId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const market = data[0];
        const extracted = extractTokenIds(market);
        if (outcomeIndex === 0 && extracted.yesTokenId) return extracted.yesTokenId;
        if (outcomeIndex === 1 && extracted.noTokenId) return extracted.noTokenId;
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}

/**
 * Get both token IDs for a condition (YES and NO)
 * @param conditionId - Market condition ID
 * @returns Object with yesTokenId and noTokenId (may be null)
 */
export async function getTokenIds(conditionId: string): Promise<{ yesTokenId: string | null; noTokenId: string | null }> {
  const [yesTokenId, noTokenId] = await Promise.all([
    getTokenId(conditionId, 0),
    getTokenId(conditionId, 1),
  ]);
  
  return {
    yesTokenId,
    noTokenId,
  };
}

/**
 * Get token ID from market object (preferred method)
 * @param market - Market object that may contain token IDs
 * @param side - 'yes' or 'no'
 * @returns Token ID or null
 */
export function getTokenIdFromMarket(market: any, side: 'yes' | 'no'): string | null {
  if (side === 'yes') {
    return market.yesTokenId || market.yes_token_id || null;
  } else {
    return market.noTokenId || market.no_token_id || null;
  }
}

/**
 * Extract condition ID from market data
 * Polymarket API returns conditionId in various formats
 */
export function extractConditionId(market: any): string | null {
  return market.conditionId || 
         market.condition_id || 
         market.id || 
         null;
}

/**
 * Extract token IDs from market data
 * Some Polymarket API responses include token IDs directly
 */
export function extractTokenIds(market: any): { yesTokenId?: string; noTokenId?: string } {
  // Check if market has token IDs in outcomes
  if (market.outcomes && Array.isArray(market.outcomes)) {
    const yesOutcome = market.outcomes.find((o: any) => o.side === 'YES' || o.index === 0);
    const noOutcome = market.outcomes.find((o: any) => o.side === 'NO' || o.index === 1);
    
    return {
      yesTokenId: yesOutcome?.tokenId || yesOutcome?.token_id,
      noTokenId: noOutcome?.tokenId || noOutcome?.token_id,
    };
  }
  
  // Fallback: try to get from market object directly
  return {
    yesTokenId: market.yesTokenId || market.yes_token_id,
    noTokenId: market.noTokenId || market.no_token_id,
  };
}

