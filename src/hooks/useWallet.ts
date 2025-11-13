/**
 * Hook to get wallet address from Privy
 * Based on Privy documentation: https://docs.privy.io/basics/react/quickstart
 */

import { usePrivy, useWallets } from '@privy-io/react-auth';

export function useWallet() {
  // Use Privy hooks - these work when PrivyProvider is mounted
  // Based on Privy docs: https://docs.privy.io/basics/react/quickstart
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  // useWallets returns { wallets: Wallet[] }
  // Get the primary wallet address from the first wallet
  const walletList = wallets?.wallets || wallets || [];
  const address = authenticated && walletList.length > 0 
    ? walletList[0].address 
    : null;

  // Get the full wallet object
  const wallet = authenticated && walletList.length > 0 
    ? walletList[0] 
    : null;

  return {
    address,
    wallet,
    authenticated: authenticated || false,
    isConnected: authenticated && address !== null,
    user: user || null,
  };
}

