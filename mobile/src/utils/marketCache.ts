/**
 * Market Cache Utility
 * Implements AsyncStorage caching for markets with TTL
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Market } from '../types';

const CACHE_KEY = 'polyfield_markets_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheData {
  markets: Market[];
  timestamp: number;
}

/**
 * Save markets to AsyncStorage cache
 */
export async function cacheMarkets(markets: Market[]): Promise<void> {
  try {
    const cacheData: CacheData = {
      markets,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log(`💾 Cached ${markets.length} markets to AsyncStorage`);
  } catch (error) {
    console.error('Failed to cache markets:', error);
  }
}

/**
 * Get markets from AsyncStorage cache if not expired
 * @returns Cached markets or null if expired/missing
 */
export async function getCachedMarkets(): Promise<Market[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const cacheData: CacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    if (age > CACHE_TTL) {
      console.log(`⏰ Cache expired (${Math.round(age / 1000)}s old)`);
      return null;
    }

    console.log(`✅ Loaded ${cacheData.markets.length} markets from cache (${Math.round(age / 1000)}s old)`);
    return cacheData.markets;
  } catch (error) {
    console.error('Failed to read cache:', error);
    return null;
  }
}

/**
 * Clear markets cache
 */
export async function clearMarketsCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Markets cache cleared');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}
