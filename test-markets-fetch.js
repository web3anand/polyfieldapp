/**
 * Test script to check if markets are being fetched correctly
 * Run with: node test-markets-fetch.js
 * 
 * Note: Requires Node.js 18+ for native fetch, or install node-fetch
 */

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.warn('⚠️  Node.js 18+ required for native fetch. Current version:', nodeVersion);
  console.log('💡 Try: Use the HTML test file (test-markets-fetch.html) in your browser instead');
  process.exit(1);
}

const BACKEND_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_ENDPOINT = `${BACKEND_URL}/api/markets`;

console.log('🧪 Testing Markets Fetch...\n');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`API Endpoint: ${API_ENDPOINT}\n`);

async function testMarketsFetch() {
  try {
    console.log('📡 Attempting to fetch markets...');
    
    const response = await fetch(`${API_ENDPOINT}?limit=10&offset=0`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}\n`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.log('❌ ERROR: Response is not JSON!');
      console.log('Response preview:', text.substring(0, 200));
      console.log('\n💡 This usually means:');
      console.log('   - Backend endpoint doesn\'t exist');
      console.log('   - Request is hitting the frontend dev server');
      console.log('   - Backend is returning HTML instead of JSON');
      return false;
    }

    const data = await response.json();
    
    // Handle different response formats
    const markets = Array.isArray(data) ? data : (data.markets || []);
    
    if (markets.length === 0) {
      console.log('⚠️  WARNING: Markets array is empty');
      console.log('Response data:', JSON.stringify(data, null, 2));
      return false;
    }

    console.log(`✅ SUCCESS: Fetched ${markets.length} markets\n`);
    
    // Display first market as sample
    if (markets.length > 0) {
      console.log('📊 Sample Market:');
      console.log(JSON.stringify(markets[0], null, 2));
    }

    // Validate market structure
    console.log('\n🔍 Validating market structure...');
    const requiredFields = ['id', 'title', 'category', 'yesPrice', 'noPrice', 'volume'];
    const sampleMarket = markets[0];
    const missingFields = requiredFields.filter(field => !(field in sampleMarket));
    
    if (missingFields.length > 0) {
      console.log(`⚠️  Missing fields: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ Market structure is valid');
    }

    return true;
  } catch (error) {
    const errorMsg = error.message || error.toString();
    console.log('❌ ERROR:', errorMsg);
    
    if (errorMsg.includes('fetch failed') || 
        errorMsg.includes('ECONNREFUSED') ||
        errorMsg.includes('ENOTFOUND') ||
        errorMsg.includes('getaddrinfo')) {
      console.log('\n💡 This usually means:');
      console.log('   - Backend server is not running');
      console.log('   - Backend URL is incorrect');
      console.log('   - Network connection issue');
      console.log(`\n🔧 Try: Start your backend server at ${BACKEND_URL}`);
      console.log('   Or use the HTML test file (test-markets-fetch.html) in your browser');
    } else if (errorMsg.includes('Unexpected token') ||
               errorMsg.includes('JSON') ||
               errorMsg.includes('parse')) {
      console.log('\n💡 This usually means:');
      console.log('   - Backend returned HTML instead of JSON');
      console.log('   - API endpoint doesn\'t exist');
    } else if (errorMsg.includes('fetch is not defined') || 
               errorMsg.includes('fetch is not a function')) {
      console.log('\n💡 This usually means:');
      console.log('   - Node.js version is too old (need 18+)');
      console.log('   - Or fetch is not available');
      console.log('\n🔧 Try: Use the HTML test file (test-markets-fetch.html) in your browser');
    }
    
    return false;
  }
}

// Run the test
testMarketsFetch()
  .then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ Test PASSED: Markets are being fetched correctly');
      process.exit(0);
    } else {
      console.log('❌ Test FAILED: Markets are not being fetched');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

