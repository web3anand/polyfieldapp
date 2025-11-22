/**
 * Privy Authentication Configuration
 * Handles wallet connection and authentication
 */

import type { PrivyClientConfig } from '@privy-io/react-auth';

export interface PrivyConfig {
  appId: string;
  config: PrivyClientConfig;
}

/**
 * Get Privy Configuration
 * Loads from environment variables with fallback
 */
export function getPrivyConfig(): PrivyConfig {
  // Use environment variable or fallback to default App ID
  // Fallback App ID: cmhxczt420087lb0d07g6zoxs
  const envAppId = import.meta.env.VITE_PRIVY_APP_ID;
  const fallbackAppId = 'cmhxczt420087lb0d07g6zoxs';
  const appId = envAppId || fallbackAppId;

  // Log configuration status (detailed logging moved to main.tsx for better visibility)
  if (envAppId) {
    // Environment variable is set - this is good
  } else {
    // Using fallback - user should verify they're using the correct app
  }

  return {
    appId: appId,
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
    } as PrivyClientConfig,
  };
}

