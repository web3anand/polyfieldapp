/// <reference types="vite/client" />
import React, { useEffect } from 'react';
import { PolyFieldLogo } from './PolyFieldLogo';
import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

function LoadingScreenWithAuth() {
  const { ready, authenticated, login } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [initTimeout, setInitTimeout] = useState(false);

  // Check if Privy is taking too long to initialize (likely due to origin mismatch)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!ready) {
        setInitTimeout(true);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timer);
  }, [ready]);

  // Handle login
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'Failed to connect';
      toast.error(errorMessage);
      
      // If error mentions origin, show helpful message
      if (errorMessage.includes('origin') || errorMessage.includes('Origin')) {
        const currentOrigin = window.location.origin;
        toast.error(
          `Origin mismatch: Add "${currentOrigin}" to Privy dashboard`,
          { duration: 8000 }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debug logging
  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      console.log('[LoadingScreen] ready:', ready, 'authenticated:', authenticated, 'type:', typeof authenticated);
      console.log('[LoadingScreen] Current origin:', window.location.origin);
      console.log('[LoadingScreen] Full URL:', window.location.href);
      
      // Check if Privy is stuck
      if (!ready) {
        console.warn('[LoadingScreen] Privy not ready - this might be due to:');
        console.warn('  1. Origin mismatch (check Privy dashboard)');
        console.warn('  2. Network issues');
        console.warn('  3. Wrong App ID');
        console.warn('  4. Browser cache (try hard refresh: Ctrl+Shift+R)');
      }
    }
  }, [ready, authenticated]);
  
  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center relative">
      {/* Top Content */}
      <div className="flex flex-col items-center mb-12">
        {/* Logo */}
        <div className="mb-4">
          <PolyFieldLogo size={120} />
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-4xl font-[Orbitron] text-[var(--text-primary)] tracking-wide mb-1">
            PolyField
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Predict. Play. Profit.
          </p>
        </div>
      </div>

      {/* Loading or Login */}
      {!ready ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full mb-4 animate-spin" />
          <p className="text-white/70 text-sm mb-2">Connecting to Privy...</p>
          {initTimeout && (
            <div className="glass-card rounded-xl p-4 max-w-md mt-4 border border-yellow-500/30 bg-yellow-500/10">
              <p className="text-yellow-400 text-xs font-semibold mb-2">⚠️ Initialization taking longer than expected</p>
              <p className="text-white/70 text-xs mb-2">
                If you see "origins don't match" errors, add this origin to Privy:
              </p>
              <p className="text-white text-xs font-mono bg-black/20 px-2 py-1 rounded mb-2">
                {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}
              </p>
              <a
                href="https://dashboard.privy.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 text-xs underline"
              >
                Open Privy Dashboard →
              </a>
            </div>
          )}
        </div>
      ) : authenticated !== true ? (
        <div className="w-full max-w-sm px-4 flex flex-col items-center z-10">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full max-w-[280px] flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-[Days_One] rounded-[30px] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all relative z-10"
            style={{ minHeight: '48px' }}
          >
            <span>Enter prediction</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-white/50 text-xs text-center mt-4">
            By connecting, you agree to our Terms of Service
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 border border-white/10 bg-[var(--bg-secondary)]/90 backdrop-blur-md text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-[var(--text-primary)] text-sm">Loading markets...</p>
        </div>
      )}
    </div>
  );
}

function LoadingScreenWithoutAuth() {
  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="mb-4">
          <PolyFieldLogo size={120} />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-[Orbitron] text-[var(--text-primary)] tracking-wide mb-1">
            PolyField
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Predict. Play. Profit.
          </p>
        </div>
        <div className="mt-6 text-[var(--text-muted)] text-xs">
          Loading markets...
        </div>
      </div>
    </div>
  );
}

// Export component - will use auth version if PrivyProvider is mounted
export function LoadingScreen() {
  // Check if Privy is configured via environment variable
  const isPrivyConfigured = typeof window !== 'undefined' && 
    (import.meta.env.VITE_PRIVY_APP_ID || '').length > 0;
  
  // If Privy is configured, assume PrivyProvider is mounted (it should be from main.tsx)
  // Otherwise use the fallback
  if (isPrivyConfigured) {
    return <LoadingScreenWithAuth />;
  }
  return <LoadingScreenWithoutAuth />;
}
