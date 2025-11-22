/**
 * Polymarket Proxy Service (React Native)
 * Fetches markets from Polymarket Gamma API directly using tags
 */

import type { Market } from '../types';

// Polymarket Gamma API endpoint
const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

// Sport tag IDs from Polymarket (these need to be fetched dynamically or hardcoded)
// You can get these from GET /tags or GET /sports endpoints
const SPORT_TAG_MAP: Record<string, number | null> = {
  'All': null,
  'Football': null, // American Football
  'Basketball': null,
  'Baseball': null,
  'Soccer': null,
  'Tennis': null,
  'Hockey': null,
  'MMA': null,
  'Boxing': null,
  'Cricket': null,
};

/**
 * Fetch available tags/sports from Polymarket API
 */
export async function fetchSportsTags(): Promise<void> {
  try {
    console.log('🏷️  Fetching sports metadata...');
    
    // Fetch sports metadata which contains tag mappings
    const sportsResponse = await fetch(`${GAMMA_API_BASE}/sports?_t=${Date.now()}`);
    
    if (!sportsResponse.ok) {
      throw new Error(`Failed to fetch sports: ${sportsResponse.status}`);
    }
    
    const sports = await sportsResponse.json();
    console.log(`✅ Received ${sports.length} sports`);
    
    // Map sport codes to tag IDs from the tags field
    sports.forEach((sport: any) => {
      const sportCode = (sport.sport || '').toLowerCase();
      const tagsStr = sport.tags || '';
      
      // Tags are comma-separated string like "1,517,100639,102810"
      const tagIds = tagsStr.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
      
      // Use the primary tag ID (usually the sport-specific one, not the generic "1")
      const primaryTagId = tagIds.find((id: number) => id !== 1) || tagIds[0];
      
      if (sportCode.includes('ipl') || sportCode.includes('odi') || sportCode.includes('t20') || sportCode.includes('abb') || sportCode.includes('csa')) {
        SPORT_TAG_MAP['Cricket'] = primaryTagId || 517; // 517 is cricket tag
        console.log(`🏏 Cricket tag ID: ${primaryTagId} (from ${sportCode})`);
      } else if (sportCode.includes('nba') || sportCode.includes('ncaab') || sportCode.includes('cbb')) {
        SPORT_TAG_MAP['Basketball'] = primaryTagId || 745;
      } else if (sportCode.includes('mlb')) {
        SPORT_TAG_MAP['Baseball'] = primaryTagId || 100381;
      } else if (sportCode.includes('epl') || sportCode.includes('lal') || sportCode.includes('bun') || sportCode.includes('sea') || sportCode.includes('ucl') || sportCode.includes('mls')) {
        SPORT_TAG_MAP['Soccer'] = primaryTagId || 100350;
      } else if (sportCode.includes('nfl') || sportCode.includes('cfb')) {
        SPORT_TAG_MAP['Football'] = primaryTagId || 450;
      } else if (sportCode.includes('atp') || sportCode.includes('wta')) {
        SPORT_TAG_MAP['Tennis'] = primaryTagId || 864;
      } else if (sportCode.includes('nhl')) {
        SPORT_TAG_MAP['Hockey'] = primaryTagId || 899;
      } else if (sportCode.includes('mma') || sportCode.includes('ufc')) {
        SPORT_TAG_MAP['MMA'] = primaryTagId;
      }
    });
    
    console.log('✅ Sport tags mapped:', SPORT_TAG_MAP);
  } catch (error: any) {
    console.error('❌ Error fetching sports tags:', error.message);
  }
}

/**
 * Get markets from Polymarket Gamma API using tag filtering
 */
export async function getMarketsViaProxy(
  limit: number = 100,
  offset: number = 0,
  category?: string
): Promise<Market[]> {
  try {
    const timestamp = Date.now();
    
    // Build URL with optional tag filtering
    let url = `${GAMMA_API_BASE}/events?limit=${limit}&offset=${offset}&closed=false&_t=${timestamp}`;
    
    // Add tag_id filter if category is specified and we have the tag ID
    if (category && category !== 'All' && SPORT_TAG_MAP[category]) {
      url += `&tag_id=${SPORT_TAG_MAP[category]}`;
      console.log(`📡 Fetching ${limit} ${category} markets (tag_id: ${SPORT_TAG_MAP[category]})...`);
    } else {
      console.log(`📡 Fetching ${limit} markets from Polymarket Gamma API...`);
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Received ${Array.isArray(data) ? data.length : 'unknown'} events from API`);
    
    // Flatten events into individual markets
    const rawMarkets: any[] = [];
    if (Array.isArray(data)) {
      data.forEach(event => {
        if (Array.isArray(event.markets) && event.markets.length > 0) {
          // Each event can have multiple markets - flatten them
          event.markets.forEach((market: any) => {
            // Merge event data into market for context
            rawMarkets.push({
              ...market,
              eventTitle: event.title,
              eventImage: event.image,
              eventId: event.id,
            });
          });
        }
      });
    }
    
    console.log(`✅ Flattened into ${rawMarkets.length} individual markets`);
    
    // Log first market for debugging price sources
    if (rawMarkets.length > 0) {
      const firstMarket = rawMarkets[0];
      console.log('📊 First market price data:', {
        title: firstMarket.question || firstMarket.title,
        outcomePrices: firstMarket.outcomePrices,
        bestBid: firstMarket.bestBid,
        bestAsk: firstMarket.bestAsk,
      });
    }
    
    let logCounter = 0;
    const markets = rawMarkets
      .filter((market: any) => market.active !== false && market.closed !== true)
      .map((market: any): Market | null => {
        try {
        let outcomes = market.outcomes;
        if (typeof outcomes === 'string') {
          try {
            outcomes = JSON.parse(outcomes);
          } catch {
            outcomes = ['Yes', 'No'];
          }
        }
        
        // Extract prices - Polymarket API uses various field names
        let yesPrice = 0.5;
        let noPrice = 0.5;
        let priceSource = 'default';
        
        // Priority 1: Parse outcomePrices if it's a JSON string
        if (typeof market.outcomePrices === 'string') {
          try {
            const parsedPrices = JSON.parse(market.outcomePrices);
            if (Array.isArray(parsedPrices) && parsedPrices.length >= 2) {
              const p0 = parseFloat(parsedPrices[0]);
              const p1 = parseFloat(parsedPrices[1]);
              if (!isNaN(p0) && !isNaN(p1)) {
                yesPrice = p0;
                noPrice = p1;
                priceSource = 'outcomePrices JSON string';
              }
            }
          } catch (e) {
            // If JSON parsing fails, try comma-separated format
            if (market.outcomePrices.includes(',')) {
              const prices = market.outcomePrices.split(',').map((p: string) => parseFloat(p.trim()));
              if (prices.length >= 2 && !isNaN(prices[0]) && !isNaN(prices[1])) {
                yesPrice = prices[0];
                noPrice = prices[1];
                priceSource = 'outcomePrices comma-separated';
              }
            }
          }
        }
        // Priority 2: Use outcomePrices array if available
        else if (Array.isArray(market.outcomePrices) && market.outcomePrices.length >= 2) {
          const p0 = parseFloat(market.outcomePrices[0]);
          const p1 = parseFloat(market.outcomePrices[1]);
          if (!isNaN(p0) && !isNaN(p1)) {
            yesPrice = p0;
            noPrice = p1;
            priceSource = 'outcomePrices array';
          }
        }
        
        // Fallback: Check nested markets array
        if (yesPrice === 0.5 && noPrice === 0.5 && Array.isArray(market.markets) && market.markets.length > 0) {
          const firstMarket = market.markets[0];
          if (typeof firstMarket.outcomePrices === 'string') {
            try {
              const parsedPrices = JSON.parse(firstMarket.outcomePrices);
              if (Array.isArray(parsedPrices) && parsedPrices.length >= 2) {
                const p0 = parseFloat(parsedPrices[0]);
                const p1 = parseFloat(parsedPrices[1]);
                if (!isNaN(p0) && !isNaN(p1)) {
                  yesPrice = p0;
                  noPrice = p1;
                  priceSource = 'nested markets JSON string';
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
        
        // Final fallback: Use bestBid/bestAsk
        if (yesPrice === 0.5 && noPrice === 0.5) {
          if (typeof market.bestBid === 'number' && typeof market.bestAsk === 'number') {
            yesPrice = (market.bestBid + market.bestAsk) / 2;
            noPrice = 1 - yesPrice;
            priceSource = 'bestBid/bestAsk';
          }
          // Try outcomes array with prices
          else if (Array.isArray(market.outcomes) && market.outcomes.length >= 2) {
            const yesOutcome = market.outcomes[0];
            const noOutcome = market.outcomes[1];
            if (yesOutcome?.price !== undefined && noOutcome?.price !== undefined) {
              yesPrice = parseFloat(yesOutcome.price);
              noPrice = parseFloat(noOutcome.price);
              priceSource = 'outcomes.price';
            }
          }
        }
        
        // Ensure prices sum to ~1.0 (allow for small market inefficiencies)
        const priceSum = yesPrice + noPrice;
        if (priceSum > 0 && Math.abs(priceSum - 1.0) > 0.1) {
          // Normalize if prices don't sum close to 1
          yesPrice = yesPrice / priceSum;
          noPrice = noPrice / priceSum;
        }
        
        // Log price source for first 3 markets to debug
        if (logCounter < 3) {
          console.log(`💰 Price source: ${priceSource} - YES: ${(yesPrice * 100).toFixed(0)}% NO: ${(noPrice * 100).toFixed(0)}%`);
          logCounter += 1;
        }
        
        // Parse liquidity safely - handle string "0" and ensure numeric
        const liquidityAmm = parseFloat(market.liquidityAmm) || 0;
        const liquidityClob = parseFloat(market.liquidityClob) || 0;
        const liquidityFallback = parseFloat(market.liquidity) || 0;
        const liquidity = liquidityAmm + liquidityClob || liquidityFallback;
        
        // Extract all text sources for category detection
        const sportField = (market.sport || market.sportName || '').toLowerCase();
        
        // Handle tags array properly
        let tagsText = '';
        if (market.tags) {
          if (Array.isArray(market.tags)) {
            tagsText = market.tags.map((tag: any) => 
              typeof tag === 'string' ? tag : (tag?.label || tag?.slug || '')
            ).join(' ').toLowerCase();
          } else if (typeof market.tags === 'string') {
            try {
              const parsedTags = JSON.parse(market.tags);
              if (Array.isArray(parsedTags)) {
                tagsText = parsedTags.map((tag: any) => 
                  typeof tag === 'string' ? tag : (tag?.label || tag?.slug || '')
                ).join(' ').toLowerCase();
              } else {
                tagsText = String(market.tags).toLowerCase();
              }
            } catch {
              tagsText = String(market.tags).toLowerCase();
            }
          }
        }
        
        // Extract category from API
        let categoryText = '';
        if (market.categories) {
          if (Array.isArray(market.categories)) {
            categoryText = market.categories.map((cat: any) => 
              cat?.label || cat?.slug || ''
            ).join(' ').toLowerCase();
          } else if (typeof market.categories === 'string') {
            try {
              const parsedCategories = JSON.parse(market.categories);
              if (Array.isArray(parsedCategories)) {
                categoryText = parsedCategories.map((cat: any) => 
                  cat?.label || cat?.slug || ''
                ).join(' ').toLowerCase();
              } else {
                categoryText = String(market.categories).toLowerCase();
              }
            } catch {
              categoryText = String(market.categories).toLowerCase();
            }
          }
        }
        if (market.category && typeof market.category === 'string') {
          categoryText += ' ' + market.category.toLowerCase();
        }
        
  const eventTitle = (market.eventTitle || '').toLowerCase();
        const question = (market.question || market.title || '').toLowerCase();
        const searchText = `${sportField} ${tagsText} ${categoryText} ${eventTitle} ${question}`;
        
        // Default to Football, but prefer detected category
        let category: 'Football' | 'Basketball' | 'Baseball' | 'Soccer' | 'Tennis' | 'Hockey' | 'MMA' | 'Boxing' | 'Cricket' = 'Football';
        
        // Priority order for category detection (more specific keywords first)
        if (searchText.includes('cricket') || searchText.includes('ipl') || searchText.includes('test match') || searchText.includes('t20')) {
          category = 'Cricket';
        } else if (searchText.includes('basketball') || searchText.includes('nba') || searchText.includes('ncaa basketball')) {
          category = 'Basketball';
        } else if (searchText.includes('baseball') || searchText.includes('mlb') || searchText.includes('world series')) {
          category = 'Baseball';
        } else if (searchText.includes('soccer') || searchText.includes('premier league') || searchText.includes('uefa') || searchText.includes('champions league') || searchText.includes('la liga')) {
          category = 'Soccer';
        } else if (searchText.includes('american football') || searchText.includes('nfl') || searchText.includes('super bowl')) {
          category = 'Football';
        } else if (searchText.includes('tennis') || searchText.includes('wimbledon') || searchText.includes('us open') || searchText.includes('french open')) {
          category = 'Tennis';
        } else if (searchText.includes('hockey') || searchText.includes('nhl') || searchText.includes('stanley cup')) {
          category = 'Hockey';
        } else if (searchText.includes('mma') || searchText.includes('ufc') || searchText.includes('mixed martial arts')) {
          category = 'MMA';
        } else if (searchText.includes('boxing') || searchText.includes('heavyweight')) {
          category = 'Boxing';
        }
        // Note: If no sport keywords match, it remains 'Football' as default
        // Many non-sports markets will also default to Football
        
        const imageUrl = market.image || market.imageUrl || market.image_url || market.eventImage || undefined;
        const conditionId = market.conditionId || market.condition_id || market.id || null;
        
        let yesTokenId: string | undefined;
        let noTokenId: string | undefined;
        
        // Try to parse clobTokenIds (JSON string array)
        if (typeof market.clobTokenIds === 'string') {
          try {
            const tokenIds = JSON.parse(market.clobTokenIds);
            if (Array.isArray(tokenIds) && tokenIds.length >= 2) {
              yesTokenId = tokenIds[0];
              noTokenId = tokenIds[1];
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        // Fallback: Check outcomes array
        if (!yesTokenId && market.outcomes) {
          let outcomesArray = market.outcomes;
          if (typeof market.outcomes === 'string') {
            try {
              outcomesArray = JSON.parse(market.outcomes);
            } catch {
              outcomesArray = null;
            }
          }
          
          if (Array.isArray(outcomesArray)) {
            const yesOutcome = outcomesArray.find((o: any) => 
            o.side === 'YES' || o.index === 0 || o.outcome === 'Yes'
          );
            const noOutcome = outcomesArray.find((o: any) => 
            o.side === 'NO' || o.index === 1 || o.outcome === 'No'
          );
          
            yesTokenId = yesOutcome?.tokenId || yesOutcome?.token_id || yesOutcome?.id;
            noTokenId = noOutcome?.tokenId || noOutcome?.token_id || noOutcome?.id;
          }
        }
        
        // Final fallback: Direct properties
        if (!yesTokenId) {
          yesTokenId = market.yesTokenId || market.yes_token_id || market.tokenIdYes;
        }
        if (!noTokenId) {
          noTokenId = market.noTokenId || market.no_token_id || market.tokenIdNo;
        }
        
        // Compute end timestamp (raw market.endDate may be ISO or missing)
        let endTimestamp: number | undefined = undefined;
        if (market.endDate) {
          const parsedEnd = new Date(market.endDate);
          if (!isNaN(parsedEnd.getTime())) {
            endTimestamp = parsedEnd.getTime();
          }
        }

        const marketData = {
          id: market.id || conditionId || String(market.slug || ''),
          conditionId: conditionId || undefined,
          yesTokenId: yesTokenId,
          noTokenId: noTokenId,
          title: market.question || market.title || 'Untitled Market',
          category: category as any,
          yesPrice: yesPrice, // Keep as decimal (0-1 range)
          noPrice: noPrice,   // Keep as decimal (0-1 range)
          volume: formatLiquidity(liquidity),
          liquidity: liquidity,
          participants: market.competitive || 0,
          endDate: market.endDate ? new Date(market.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
          endTimestamp: endTimestamp,
          imageUrl: imageUrl,
          trending: undefined,
        };
        
        return marketData;
        } catch (error: any) {
          console.error('❌ Error processing market:', error.message, market);
          return null;
        }
      })
      .filter((m): m is Market => m !== null);

    console.log(`✅ Transformed ${markets.length} markets successfully`);
    return markets;
  } catch (error: any) {
    console.error('❌ Error fetching markets:', error.message);
    return [];
  }
}

function formatLiquidity(liquidity: number): string {
  if (liquidity >= 1000000) {
    return `$${(liquidity / 1000000).toFixed(1)}M`;
  } else if (liquidity >= 1000) {
    return `$${(liquidity / 1000).toFixed(0)}k`;
  }
  return `$${liquidity.toFixed(0)}`;
}
