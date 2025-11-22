/**
 * Hook to initialize WebSocket with authentication
 * Automatically sets up WebSocket auth when user connects
 */

import { useEffect } from 'react';
import { polymarketWS } from '../lib/polymarketWebSocket';
import { getBuilderCredentials } from '../config/builderConfig';
import { useWallet } from './useWallet';

export function useWebSocketAuth() {
  const { authenticated, address } = useWallet();

  useEffect(() => {
    // Only set up WebSocket auth if user is authenticated
    if (!authenticated || !address) {
      return;
    }

    // Get Builder credentials
    const credentials = getBuilderCredentials();
    
    if (credentials) {
      console.log('🔐 Setting up WebSocket authentication with Builder credentials...');
      polymarketWS.setAuth(
        credentials.apiKey,
        credentials.secret,
        credentials.passphrase
      );
    } else {
      console.log('ℹ️ No Builder credentials found in .env file');
      console.log('   Add VITE_BUILDER_API_KEY, VITE_BUILDER_SECRET, VITE_BUILDER_PASSPHRASE');
      console.log('   Get credentials at: https://polymarket.com/settings?tab=builder');
      console.log('   App will work without them, but no real-time price updates.');
    }
  }, [authenticated, address]);

  return { authenticated };
}
