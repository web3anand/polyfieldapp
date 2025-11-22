/**
 * Polymarket Order Service
 * Handles order creation, signing, and submission to CLOB API
 */

import { ethers } from 'ethers';
import axios from 'axios';

const CLOB_API_URL = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon

interface OrderParams {
  tokenId: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: number;
  userAddress: string;
  feeRateBps?: number;
  nonce?: number;
  expiration?: number;
}

interface SignedOrder {
  salt: string;
  maker: string;
  signer: string;
  taker: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  side: number;
  feeRateBps: number;
  nonce: number;
  expiration: number;
  signature: string;
}

/**
 * Build EIP-712 typed data for order signing
 */
function buildOrderTypedData(order: any, chainId: number = CHAIN_ID) {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Order: [
        { name: 'salt', type: 'uint256' },
        { name: 'maker', type: 'address' },
        { name: 'signer', type: 'address' },
        { name: 'taker', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'makerAmount', type: 'uint256' },
        { name: 'takerAmount', type: 'uint256' },
        { name: 'side', type: 'uint8' },
        { name: 'feeRateBps', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiration', type: 'uint256' },
      ],
    },
    primaryType: 'Order',
    domain: {
      name: 'Polymarket CTF Exchange',
      version: '1',
      chainId,
      verifyingContract: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E', // CTF Exchange on Polygon
    },
    message: order,
  };
}

/**
 * Create unsigned order object
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
    expiration = Math.floor(Date.now() / 1000) + 86400, // 24 hours
  } = params;

  // Calculate amounts (USDC has 6 decimals)
  const sizeFloat = parseFloat(size);
  const sharesAmount = Math.floor(sizeFloat * 1_000_000).toString();
  const usdcAmount = Math.floor(sizeFloat * price * 1_000_000).toString();

  return {
    salt: nonce.toString(),
    maker: userAddress.toLowerCase(),
    signer: userAddress.toLowerCase(),
    taker: '0x0000000000000000000000000000000000000000',
    tokenId,
    makerAmount: side === 'BUY' ? usdcAmount : sharesAmount,
    takerAmount: side === 'BUY' ? sharesAmount : usdcAmount,
    side: side === 'BUY' ? 0 : 1,
    feeRateBps,
    nonce,
    expiration,
  };
}

/**
 * Sign order with private key
 */
export async function signOrder(
  order: any,
  privateKey: string
): Promise<SignedOrder> {
  try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey);
    
    // Build EIP-712 typed data
    const typedData = buildOrderTypedData(order);
    
    // Sign using EIP-712
    const signature = await wallet._signTypedData(
      typedData.domain,
      { Order: typedData.types.Order },
      typedData.message
    );

    return {
      ...order,
      signature,
    };
  } catch (error: any) {
    throw new Error(`Failed to sign order: ${error.message}`);
  }
}

/**
 * Submit signed order to Polymarket CLOB API
 */
export async function submitOrder(
  signedOrder: SignedOrder,
  apiKey?: string,
  apiSecret?: string,
  apiPassphrase?: string
): Promise<any> {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    // Add L2 authentication headers if provided
    if (apiKey && apiSecret && apiPassphrase) {
      const timestamp = Date.now().toString();
      const method = 'POST';
      const path = '/orders';
      const body = JSON.stringify(signedOrder);
      
      // Create signature for L2 auth
      const message = timestamp + method + path + body;
      const signature = ethers.utils
        .keccak256(ethers.utils.toUtf8Bytes(message + apiSecret))
        .slice(2);

      headers['POLY_API_KEY'] = apiKey;
      headers['POLY_SIGNATURE'] = signature;
      headers['POLY_TIMESTAMP'] = timestamp;
      headers['POLY_PASSPHRASE'] = apiPassphrase;
    }

    const response = await axios.post(
      `${CLOB_API_URL}/orders`,
      signedOrder,
      {
        headers,
        timeout: 30000,
      }
    );

    return {
      success: true,
      orderId: response.data.orderID || response.data.id,
      data: response.data,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message
      );
    }
    throw error;
  }
}

/**
 * Place complete order (create + sign + submit)
 */
export async function placeOrder(
  params: OrderParams,
  privateKey: string,
  apiKey?: string,
  apiSecret?: string,
  apiPassphrase?: string
): Promise<any> {
  try {
    console.log('📝 Creating order:', params);
    
    // Step 1: Create unsigned order
    const order = createOrder(params);
    console.log('📦 Order created:', order);

    // Step 2: Sign order
    const signedOrder = await signOrder(order, privateKey);
    console.log('✍️ Order signed');

    // Step 3: Submit to CLOB
    const result = await submitOrder(
      signedOrder,
      apiKey,
      apiSecret,
      apiPassphrase
    );
    console.log('✅ Order submitted:', result);

    return result;
  } catch (error: any) {
    console.error('❌ Error placing order:', error);
    throw error;
  }
}
