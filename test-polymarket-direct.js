/**
 * Test script to check if Polymarket API can be accessed directly
 * This will test if CORS allows direct browser access
 */

const POLYMARKET_API = 'https://gamma-api.polymarket.com';
const TEST_URL = `${POLYMARKET_API}/markets?limit=5&offset=0&active=true&closed=false`;

console.log('🧪 Testing Direct Polymarket API Access...\n');
console.log(`API URL: ${TEST_URL}\n`);

async function testDirectAPI() {
  try {
    console.log('📡 Attempting to fetch from Polymarket API directly...');
    
    const response = await fetch(TEST_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`CORS Headers: ${response.headers.get('access-control-allow-origin') || 'Not set'}\n`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.log('❌ ERROR: Response is not JSON!');
      console.log('Response preview:', text.substring(0, 200));
      return { success: false, reason: 'Not JSON', cors: false };
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log('⚠️  WARNING: No markets in response');
      console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
      return { success: false, reason: 'Empty data', cors: true };
    }

    console.log(`✅ SUCCESS: Fetched ${data.length} markets directly from Polymarket API!\n`);
    
    // Display first market
    if (data.length > 0) {
      console.log('📊 Sample Market:');
      console.log(JSON.stringify(data[0], null, 2));
    }

    return { success: true, marketsCount: data.length, cors: true };
  } catch (error) {
    const errorMsg = error.message || error.toString();
    console.log('❌ ERROR:', errorMsg);
    
    if (errorMsg.includes('Failed to fetch') || 
        errorMsg.includes('CORS') ||
        errorMsg.includes('NetworkError') ||
        error.name === 'TypeError') {
      console.log('\n🚫 CORS BLOCKED: Direct API access is blocked by CORS policy');
      console.log('💡 This means you MUST use a backend proxy');
      return { success: false, reason: 'CORS blocked', cors: false };
    } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ENOTFOUND')) {
      console.log('\n❌ Network Error: Cannot reach Polymarket API');
      return { success: false, reason: 'Network error', cors: false };
    } else {
      console.log('\n❌ Unknown Error:', errorMsg);
      return { success: false, reason: errorMsg, cors: false };
    }
  }
}

// Run the test
testDirectAPI()
  .then(result => {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS:');
    console.log('='.repeat(50));
    console.log(`Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    console.log(`CORS Allowed: ${result.cors ? '✅ YES' : '❌ NO (BLOCKED)'}`);
    console.log(`Reason: ${result.reason || 'N/A'}`);
    if (result.marketsCount) {
      console.log(`Markets Fetched: ${result.marketsCount}`);
    }
    console.log('\n💡 Recommendation:');
    if (result.cors && result.success) {
      console.log('✅ Direct API access works! You can use Polymarket API directly.');
    } else {
      console.log('❌ Direct API access blocked. You MUST use a backend proxy.');
    }
    console.log('='.repeat(50));
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

