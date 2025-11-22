/**
 * Etherscan API Service (V2)
 * Fetch blockchain data using Etherscan V2 unified multichain API
 * 
 * API Documentation: https://docs.etherscan.io/
 * V2 Migration Guide: https://docs.etherscan.io/v2-migration
 */

const ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api';
const POLYGON_CHAIN_ID = '137'; // Polygon mainnet
const ETHERSCAN_API_KEY = process.env.EXPO_PUBLIC_ETHERSCAN_API_KEY || '6BCHGFTTXTE7ESGQ6JQWAAGVMBFKGZSKD2';
// Native USDC on Polygon (not bridged USDC.e)
const USDC_ADDRESS = process.env.EXPO_PUBLIC_USDC_ADDRESS || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

export interface TokenBalance {
  balance: string;
  decimals: number;
  symbol: string;
  formatted: string; // Human-readable balance
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  blockNumber: string;
  confirmations: string;
}

/**
 * Get USDC balance for a wallet address
 * @param address - Wallet address
 * @returns USDC balance with decimals
 */
export async function getUSDCBalance(address: string): Promise<TokenBalance> {
  try {
    console.log('🔍 Fetching balance for address:', address);
    console.log('🔍 Using USDC contract:', USDC_ADDRESS);
    
    const params = new URLSearchParams({
      chainid: POLYGON_CHAIN_ID,
      module: 'account',
      action: 'tokenbalance',
      contractaddress: USDC_ADDRESS,
      address: address,
      tag: 'latest',
      apikey: ETHERSCAN_API_KEY,
    });

    const url = `${ETHERSCAN_API_URL}?${params}`;
    console.log('🌐 API URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📡 API Response:', JSON.stringify(data));

    if (data.status === '1' && data.result) {
      // USDC has 6 decimals on Polygon
      const decimals = 6;
      const rawBalance = data.result;
      const formatted = (parseInt(rawBalance) / Math.pow(10, decimals)).toFixed(2);
      
      console.log('✅ Balance parsed:', { rawBalance, formatted });

      return {
        balance: rawBalance,
        decimals,
        symbol: 'USDC',
        formatted,
      };
    }

    console.warn('⚠️ API returned status 0 or no result:', data);
    return {
      balance: '0',
      decimals: 6,
      symbol: 'USDC',
      formatted: '0.00',
    };
  } catch (error) {
    console.error('❌ Error fetching USDC balance:', error);
    return {
      balance: '0',
      decimals: 6,
      symbol: 'USDC',
      formatted: '0.00',
    };
  }
}

/**
 * Get MATIC balance for a wallet address
 * @param address - Wallet address
 * @returns MATIC balance
 */
export async function getMaticBalance(address: string): Promise<string> {
  try {
    const params = new URLSearchParams({
      chainid: POLYGON_CHAIN_ID,
      module: 'account',
      action: 'balance',
      address: address,
      tag: 'latest',
      apikey: ETHERSCAN_API_KEY,
    });

    const response = await fetch(`${ETHERSCAN_API_URL}?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      // Convert from wei to MATIC (18 decimals)
      const balanceInMatic = (parseInt(data.result) / Math.pow(10, 18)).toFixed(4);
      return balanceInMatic;
    }

    return '0.00';
  } catch (error) {
    console.error('Error fetching MATIC balance:', error);
    return '0.00';
  }
}

/**
 * Get transaction history for a wallet
 * @param address - Wallet address
 * @param limit - Number of transactions to fetch (default: 10)
 * @returns Array of transactions
 */
export async function getTransactionHistory(
  address: string,
  limit: number = 10
): Promise<Transaction[]> {
  try {
    const params = new URLSearchParams({
      chainid: POLYGON_CHAIN_ID,
      module: 'account',
      action: 'txlist',
      address: address,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: limit.toString(),
      sort: 'desc',
      apikey: ETHERSCAN_API_KEY,
    });

    const response = await fetch(`${ETHERSCAN_API_URL}?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timeStamp: tx.timeStamp,
        blockNumber: tx.blockNumber,
        confirmations: tx.confirmations,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

/**
 * Get ERC-20 token transfers for a wallet
 * @param address - Wallet address
 * @param contractAddress - Token contract address (optional, defaults to USDC)
 * @param limit - Number of transfers to fetch
 * @returns Array of token transfers
 */
export async function getTokenTransfers(
  address: string,
  contractAddress: string = USDC_ADDRESS,
  limit: number = 10
): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      chainid: POLYGON_CHAIN_ID,
      module: 'account',
      action: 'tokentx',
      contractaddress: contractAddress,
      address: address,
      page: '1',
      offset: limit.toString(),
      sort: 'desc',
      apikey: ETHERSCAN_API_KEY,
    });

    const response = await fetch(`${ETHERSCAN_API_URL}?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return data.result;
    }

    return [];
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    return [];
  }
}

/**
 * Check if an address has enough USDC balance
 * @param address - Wallet address
 * @param requiredAmount - Required amount in USDC (as number)
 * @returns Boolean indicating if balance is sufficient
 */
export async function hasEnoughUSDC(
  address: string,
  requiredAmount: number
): Promise<{ sufficient: boolean; balance: string; required: string }> {
  try {
    const balanceData = await getUSDCBalance(address);
    const currentBalance = parseFloat(balanceData.formatted);
    
    return {
      sufficient: currentBalance >= requiredAmount,
      balance: balanceData.formatted,
      required: requiredAmount.toFixed(2),
    };
  } catch (error) {
    console.error('Error checking USDC balance:', error);
    return {
      sufficient: false,
      balance: '0.00',
      required: requiredAmount.toFixed(2),
    };
  }
}

/**
 * Get gas price estimation
 * @returns Gas price in Gwei
 */
export async function getGasPrice(): Promise<string> {
  try {
    const params = new URLSearchParams({
      chainid: POLYGON_CHAIN_ID,
      module: 'proxy',
      action: 'eth_gasPrice',
      apikey: ETHERSCAN_API_KEY,
    });

    const response = await fetch(`${ETHERSCAN_API_URL}?${params}`);
    const data = await response.json();

    if (data.result) {
      // Convert from wei to Gwei
      const gasPriceGwei = (parseInt(data.result, 16) / Math.pow(10, 9)).toFixed(2);
      return gasPriceGwei;
    }

    return '30'; // Default fallback
  } catch (error) {
    console.error('Error fetching gas price:', error);
    return '30';
  }
}

/**
 * Verify if a transaction has been confirmed
 * @param txHash - Transaction hash
 * @returns Transaction confirmation status
 */
export async function getTransactionStatus(txHash: string): Promise<{
  confirmed: boolean;
  confirmations: number;
  status: string;
}> {
  try {
    const params = new URLSearchParams({
      chainid: POLYGON_CHAIN_ID,
      module: 'transaction',
      action: 'gettxreceiptstatus',
      txhash: txHash,
      apikey: ETHERSCAN_API_KEY,
    });

    const response = await fetch(`${ETHERSCAN_API_URL}?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return {
        confirmed: data.result.status === '1',
        confirmations: 0, // Would need another API call to get block confirmations
        status: data.result.status === '1' ? 'Success' : 'Failed',
      };
    }

    return {
      confirmed: false,
      confirmations: 0,
      status: 'Pending',
    };
  } catch (error) {
    console.error('Error fetching transaction status:', error);
    return {
      confirmed: false,
      confirmations: 0,
      status: 'Unknown',
    };
  }
}
