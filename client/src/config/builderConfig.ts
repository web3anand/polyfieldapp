/**
 * Polymarket Builder Program Configuration
 * Handles Builder API credentials and configuration for order attribution and gasless transactions
 * 
 * Documentation: https://docs.polymarket.com/developers/builders/builder-intro
 */

import { BuilderConfig, BuilderApiKeyCreds } from '@polymarket/builder-signing-sdk';

/**
 * Builder API Credentials Interface
 * These credentials are required for:
 * 1. Order Attribution - Adding authentication headers to orders
 * 2. Relayer Access - Using gasless transactions via Polymarket's relayer
 */
export interface BuilderCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

/**
 * Check if Builder credentials are configured
 */
export function hasBuilderCredentials(): boolean {
  return !!(
    import.meta.env.VITE_BUILDER_API_KEY &&
    import.meta.env.VITE_BUILDER_SECRET &&
    import.meta.env.VITE_BUILDER_PASSPHRASE
  );
}

/**
 * Get Builder API credentials from environment variables
 * 
 * Security Note: These credentials should NEVER be exposed in client-side code.
 * In production, use remote signing with a secure signing server.
 * 
 * @returns BuilderCredentials or null if not configured
 */
export function getBuilderCredentials(): BuilderCredentials | null {
  const apiKey = import.meta.env.VITE_BUILDER_API_KEY;
  const secret = import.meta.env.VITE_BUILDER_SECRET;
  const passphrase = import.meta.env.VITE_BUILDER_PASSPHRASE;

  if (!apiKey || !secret || !passphrase) {
    return null;
  }

  return {
    apiKey,
    secret,
    passphrase,
  };
}

/**
 * Create Builder Configuration for local signing
 * 
 * ⚠️ WARNING: Local signing should only be used in development!
 * In production, use remote signing to keep credentials secure.
 * 
 * @param credentials - Builder API credentials
 * @returns BuilderConfig for local signing
 */
export function createLocalBuilderConfig(credentials: BuilderCredentials): BuilderConfig {
  const builderCreds: BuilderApiKeyCreds = {
    key: credentials.apiKey,
    secret: credentials.secret,
    passphrase: credentials.passphrase,
  };

  return new BuilderConfig({
    localBuilderCreds: builderCreds,
  });
}

/**
 * Create Builder Configuration for remote signing (RECOMMENDED)
 * 
 * Remote signing keeps your Builder API credentials on a secure server.
 * The credentials never leave your server and are never exposed to clients.
 * 
 * Setup: https://github.com/Polymarket/builder-signing-server
 * 
 * @param signingServerUrl - URL of your builder signing server
 * @param authToken - Optional authorization token for added security
 * @returns BuilderConfig for remote signing
 */
export function createRemoteBuilderConfig(
  signingServerUrl: string,
  authToken?: string
): BuilderConfig {
  return new BuilderConfig({
    remoteBuilderConfig: {
      url: signingServerUrl,
      token: authToken,
    },
  });
}

/**
 * Get the appropriate Builder Configuration based on environment
 * 
 * Priority:
 * 1. Remote signing server (if VITE_BUILDER_SIGNING_SERVER_URL is set)
 * 2. Local signing (if VITE_BUILDER_API_KEY credentials are set)
 * 3. null (no builder configuration)
 * 
 * @returns BuilderConfig or null if not configured
 */
export function getBuilderConfig(): BuilderConfig | null {
  // Check for remote signing server (preferred method)
  const signingServerUrl = import.meta.env.VITE_BUILDER_SIGNING_SERVER_URL;
  const signingServerToken = import.meta.env.VITE_BUILDER_SIGNING_SERVER_TOKEN;

  if (signingServerUrl) {
    console.log('🔐 Using remote Builder signing server');
    return createRemoteBuilderConfig(signingServerUrl, signingServerToken);
  }

  // Fallback to local signing (development only)
  const credentials = getBuilderCredentials();
  if (credentials) {
    console.warn('⚠️ Using local Builder signing - NOT recommended for production!');
    console.warn('   Set up a remote signing server: https://github.com/Polymarket/builder-signing-server');
    return createLocalBuilderConfig(credentials);
  }

  // No builder configuration available
  return null;
}

/**
 * Polymarket Relayer URL
 * Public relayer for gasless transactions on Polygon
 */
export const POLYMARKET_RELAYER_URL = 'https://relayer-v2.polymarket.com/';

/**
 * Contract Addresses on Polygon Mainnet
 */
export const POLYGON_CONTRACTS = {
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  CTF: '0x4d97dcd97ec945f40cf65f87097ace5ea0476045',
  CTF_EXCHANGE: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',
  NEG_RISK_CTF_EXCHANGE: '0xC5d563A36AE78145C45a50134d48A1215220f80a',
} as const;

/**
 * Builder Leaderboard URL
 */
export const BUILDER_LEADERBOARD_URL = 'https://builders.polymarket.com/';

/**
 * Builder Profile Settings URL
 */
export const BUILDER_PROFILE_URL = 'https://polymarket.com/settings?tab=builder';

export default {
  hasBuilderCredentials,
  getBuilderCredentials,
  getBuilderConfig,
  createLocalBuilderConfig,
  createRemoteBuilderConfig,
  POLYMARKET_RELAYER_URL,
  POLYGON_CONTRACTS,
  BUILDER_LEADERBOARD_URL,
  BUILDER_PROFILE_URL,
};
