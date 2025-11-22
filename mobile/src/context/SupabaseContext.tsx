import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, getOrCreateUser } from '../utils/supabase';
import { usePrivy } from '@privy-io/expo';

interface SupabaseContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const privyContext = usePrivy();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Privy context is available
    if (!privyContext) {
      console.log('⏳ Waiting for Privy to initialize...');
      setLoading(false);
      return;
    }

    const { user, isReady } = privyContext;

    if (!isReady) {
      console.log('⏳ Privy not ready yet...');
      return;
    }

    if (user) {
      // Get wallet address from Privy user
      const wallet = user.linked_accounts?.find(
        (a: any) => a.type === 'wallet' && 'wallet_client_type' in a && a.wallet_client_type === 'privy'
      );
      
      if (wallet && 'address' in wallet) {
        loadUserProfile(wallet.address);
      } else {
        console.log('⏳ Waiting for embedded wallet creation...');
        setLoading(false);
      }
    } else {
      setUserProfile(null);
      setLoading(false);
    }
  }, [privyContext?.user, privyContext?.isReady]);

  const loadUserProfile = async (walletAddress: string) => {
    try {
      console.log('📊 Loading user profile for wallet:', walletAddress);
      const profile = await getOrCreateUser(walletAddress);
      setUserProfile(profile);
      console.log('✅ User profile loaded:', profile.display_name || 'No display name');
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (privyContext?.user) {
      const wallet = privyContext.user.linked_accounts?.find(
        (a: any) => a.type === 'wallet' && 'wallet_client_type' in a && a.wallet_client_type === 'privy'
      );
      
      if (wallet && 'address' in wallet) {
        await loadUserProfile(wallet.address);
      }
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        userProfile,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
