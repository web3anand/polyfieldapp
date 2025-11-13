/**
 * Privy Authentication Configuration
 * Handles wallet connection and authentication
 */

export interface PrivyConfig {
  appId: string;
  config: {
    loginMethods: string[];
    appearance: {
      theme: string;
      accentColor: string;
    };
    embeddedWallets: {
      createOnLogin: string;
    };
  };
}

/**
 * Get Privy Configuration
 * Loads from environment variables
 */
export function getPrivyConfig(): PrivyConfig {
  // Use environment variable or fallback to provided App ID
  // App ID: cmhxczt420087lb0d07g6zoxs
  const appId = import.meta.env.VITE_PRIVY_APP_ID || 'cmhxczt420087lb0d07g6zoxs';

  if (!appId) {
    console.warn('VITE_PRIVY_APP_ID not set. Authentication will not work.');
  } else {
    console.log('✅ Privy App ID configured:', appId);
  }

  return {
    appId: appId || '',
    config: {
      // Login methods as per Privy docs: https://docs.privy.io/basics/react/quickstart
      loginMethods: ['wallet', 'email', 'sms'],
      appearance: {
        theme: 'dark',
        accentColor: '#6366f1', // Indigo color matching app theme
      },
      embeddedWallets: {
        // Auto-create embedded wallets for users without wallets
        // This enables gasless transactions via Privy
        createOnLogin: 'users-without-wallets',
      },
    },
  };
}

/**
 * Initialize Privy (if using Privy SDK)
 * This will be called when Privy SDK is integrated
 */
export async function initPrivy() {
  // TODO: Initialize Privy SDK when integrated
  // import { PrivyProvider } from '@privy-io/react-auth';
  // This will wrap the app in PrivyProvider
}

