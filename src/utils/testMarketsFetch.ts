/**
 * Utility function to test markets fetching
 * Can be called from browser console or used in tests
 */

import { getMarkets } from '../services/marketsService';
import type { Market } from '../types';

export interface TestResult {
  success: boolean;
  marketsCount: number;
  error?: string;
  sampleMarket?: Market;
  issues?: string[];
}

/**
 * Test if markets are being fetched correctly
 * @returns Test result with details
 */
export async function testMarketsFetch(): Promise<TestResult> {
  const result: TestResult = {
    success: false,
    marketsCount: 0,
    issues: [],
  };

  try {
    console.log('🧪 Testing markets fetch...');
    
    const markets = await getMarkets(10, 0, false);
    
    if (markets.length === 0) {
      result.error = 'No markets returned';
      result.issues?.push('Markets array is empty');
      console.warn('⚠️ No markets returned');
      return result;
    }

    result.marketsCount = markets.length;
    result.sampleMarket = markets[0];

    // Validate market structure
    const requiredFields: (keyof Market)[] = ['id', 'title', 'category', 'yesPrice', 'noPrice', 'volume'];
    const sampleMarket = markets[0];
    
    const missingFields = requiredFields.filter(field => !(field in sampleMarket));
    if (missingFields.length > 0) {
      result.issues?.push(`Missing fields: ${missingFields.join(', ')}`);
    }

    // Validate field types
    if (typeof sampleMarket.id !== 'string') {
      result.issues?.push('Field "id" should be string');
    }
    if (typeof sampleMarket.title !== 'string') {
      result.issues?.push('Field "title" should be string');
    }
    if (typeof sampleMarket.yesPrice !== 'number') {
      result.issues?.push('Field "yesPrice" should be number');
    }
    if (typeof sampleMarket.noPrice !== 'number') {
      result.issues?.push('Field "noPrice" should be number');
    }

    if (result.issues && result.issues.length === 0) {
      result.success = true;
      console.log(`✅ Success: Fetched ${markets.length} markets`);
      console.log('Sample market:', sampleMarket);
    } else {
      console.warn('⚠️ Markets fetched but with issues:', result.issues);
    }

    return result;
  } catch (error: any) {
    result.error = error.message || 'Unknown error';
    result.issues?.push(result.error);
    
    console.error('❌ Error fetching markets:', error);
    
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('ERR_CONNECTION_REFUSED')) {
      result.issues?.push('Backend server is not running or not accessible');
    } else if (error.message?.includes('Unexpected token') || 
               error.message?.includes('not valid JSON')) {
      result.issues?.push('Backend returned HTML instead of JSON');
    }

    return result;
  }
}

/**
 * Run test and log results to console
 */
export async function runMarketsTest(): Promise<void> {
  console.log('='.repeat(50));
  console.log('🧪 MARKETS FETCH TEST');
  console.log('='.repeat(50));
  
  const result = await testMarketsFetch();
  
  console.log('\n📊 Test Results:');
  console.log(`Success: ${result.success ? '✅' : '❌'}`);
  console.log(`Markets Count: ${result.marketsCount}`);
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
  
  if (result.issues && result.issues.length > 0) {
    console.log('\n⚠️ Issues:');
    result.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (result.sampleMarket) {
    console.log('\n📋 Sample Market:');
    console.log(JSON.stringify(result.sampleMarket, null, 2));
  }
  
  console.log('\n' + '='.repeat(50));
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).testMarketsFetch = runMarketsTest;
}

