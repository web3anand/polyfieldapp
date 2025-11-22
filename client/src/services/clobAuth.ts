/**
 * Polymarket CLOB API Authentication
 * Handles L1 (Private Key) and L2 (API Key) authentication
 * 
 * Reference: https://docs.polymarket.com/developers/CLOB/authentication
 * 
 * Note: For L1 authentication, you need to install ethers:
 * npm install ethers
 * 
 * For now, these functions are placeholders. In production, use the official
 * @polymarket/clob-client SDK which handles authentication automatically.
 */

export interface L1AuthHeaders extends Record<string, string> {
  POLY_ADDRESS: string;
  POLY_SIGNATURE: string;
  POLY_TIMESTAMP: string;
  POLY_NONCE: string;
}

export interface L2AuthHeaders extends Record<string, string> {
  POLY_API_KEY: string;
  POLY_PASSPHRASE: string;
  POLY_SIGNATURE: string;
}

export type AuthHeaders = L1AuthHeaders | L2AuthHeaders;

/**
 * Generate L1 authentication headers using private key
 * @param privateKey - Wallet private key
 * @param message - Message to sign (usually request data)
 * @returns L1 authentication headers
 * 
 * Note: Requires ethers library. Install with: npm install ethers
 * For production, use @polymarket/clob-client SDK instead.
 */
export async function generateL1Auth(
  privateKey: string,
  message: string
): Promise<L1AuthHeaders> {
  // Dynamic import to avoid errors if ethers is not installed
  // Vite is configured to exclude ethers from pre-bundling
  try {
    // Use dynamic import with runtime string to prevent Vite from analyzing
    const ethersPackageName = ['ether', 's'].join('');
    // @ts-ignore - ethers is optional, may not be installed
    const ethersModule = await import(/* @vite-ignore */ ethersPackageName);
    const ethers = ethersModule.ethers || ethersModule.default || ethersModule;
    const wallet = new ethers.Wallet(privateKey);
    const address = await wallet.getAddress();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = ethers.utils.randomBytes(16).toString('hex');

    // Create EIP-712 structured data for signing
    const domain = {
      name: 'Polymarket',
      version: '1',
      chainId: 137, // Polygon mainnet
    };

    const types = {
      Message: [
        { name: 'message', type: 'string' },
        { name: 'timestamp', type: 'string' },
        { name: 'nonce', type: 'string' },
      ],
    };

    const value = {
      message,
      timestamp,
      nonce,
    };

    const signature = await wallet._signTypedData(domain, types, value);

    return {
      POLY_ADDRESS: address,
      POLY_SIGNATURE: signature,
      POLY_TIMESTAMP: timestamp,
      POLY_NONCE: nonce,
    };
  } catch (error: any) {
    throw new Error(
      'Ethers library required for L1 authentication. Install with: npm install ethers. ' +
      'Or use @polymarket/clob-client SDK which handles authentication automatically.'
    );
  }
}

/**
 * Generate L2 authentication headers using API key
 * @param apiKey - API key from Polymarket Builder Program
 * @param passphrase - Passphrase set when creating API key
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - API path
 * @param body - Request body (if any)
 * @returns L2 authentication headers
 */
export async function generateL2Auth(
  apiKey: string,
  passphrase: string,
  method: string,
  path: string,
  body?: string
): Promise<L2AuthHeaders> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Create message to sign
  const message = `${timestamp}${method}${path}${body || ''}`;
  
  // Generate HMAC signature using Web Crypto API
  // Note: This requires the API key secret, which should be stored securely
  // For production, use @polymarket/clob-client SDK which handles this automatically
  try {
    // Check if crypto.subtle is available (requires secure context)
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available. Requires secure context (HTTPS or localhost).');
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(passphrase);
    const messageData = encoder.encode(message);
    
    // Use Web Crypto API for HMAC-SHA256
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
    
    // Convert ArrayBuffer to base64 string
    const bytes = new Uint8Array(signatureBuffer);
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    const signature = btoa(binary);

    return {
      POLY_API_KEY: apiKey,
      POLY_PASSPHRASE: passphrase,
      POLY_SIGNATURE: signature,
    };
  } catch (error: any) {
    throw new Error(
      `Failed to generate L2 authentication: ${error.message}. ` +
      'For production, use @polymarket/clob-client SDK which handles authentication automatically.'
    );
  }
}

/**
 * Check if authentication headers are L1 or L2
 */
export function isL1Auth(headers: AuthHeaders): headers is L1AuthHeaders {
  return 'POLY_ADDRESS' in headers;
}

/**
 * Check if authentication headers are L2
 */
export function isL2Auth(headers: AuthHeaders): headers is L2AuthHeaders {
  return 'POLY_API_KEY' in headers;
}

