/**
 * App wrapper that conditionally uses Privy authentication
 */

import { useState, useEffect } from 'react';
import { LineChart, Wallet, UserCircle } from 'lucide-react';
import { MarketsPage } from './MarketsPage';
import { PortfolioPage } from './PortfolioPage';
import { ProfilePage } from './ProfilePage';
import { LoadingScreen } from './LoadingScreen';
import { LoginScreen } from './LoginScreen';
import { ThemeProvider } from './ThemeContext';
import { Toaster } from './ui/sonner';
import { AnimatedBackground } from './AnimatedBackground';
import { usePrivy } from '@privy-io/react-auth';
import { getPrivyConfig } from '../lib/privy-config';

type Tab = 'markets' | 'portfolio' | 'profile';

// Check if Privy is configured (uses fallback App ID if env var not set)
const privyConfig = getPrivyConfig();
const isPrivyConfigured = privyConfig.appId && privyConfig.appId.length > 0;

export default function AppWithAuth() {
  const [activeTab, setActiveTab] = useState<Tab>('markets');
  // Start with loading true - will be set to false when we know auth state
  const [isLoading, setIsLoading] = useState(true);
  
  // CRITICAL: Privy App ID check (will use fallback if env var not set)
  // The fallback ensures the app works even without explicitly setting VITE_PRIVY_APP_ID
  if (!isPrivyConfigured) {
    console.error('❌ Privy configuration error: No App ID available (neither env var nor fallback)');
    return (
      <ThemeProvider>
        <div className="h-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <div className="text-center p-8 glass-card rounded-2xl max-w-md">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Configuration Error</h2>
            <p className="text-[var(--text-secondary)] mb-2">Unable to initialize authentication.</p>
            <p className="text-[var(--text-muted)] text-sm">Please contact support.</p>
          </div>
        </div>
        <Toaster theme="dark" />
      </ThemeProvider>
    );
  }

  // Use Privy hooks only if configured
  return <AppWithPrivy activeTab={activeTab} setActiveTab={setActiveTab} isLoading={isLoading} setIsLoading={setIsLoading} />;
}

function AppWithPrivy({ activeTab, setActiveTab, isLoading, setIsLoading }: { activeTab: Tab; setActiveTab: (tab: Tab) => void; isLoading: boolean; setIsLoading: (loading: boolean) => void }) {
  // Use Privy hooks - this component only renders when PrivyProvider is mounted
  const { ready, authenticated } = usePrivy();

  // Debug logging (remove in production)
  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      console.log('[AppWithPrivy] ready:', ready, 'authenticated:', authenticated);
    }
  }, [ready, authenticated]);

  useEffect(() => {
    // CRITICAL: If user is not authenticated, immediately show login screen (no delay)
    if (ready && authenticated !== true) {
      setIsLoading(false);
      return;
    }
    
    // If user is authenticated, immediately show app (no loading delay)
    if (ready && authenticated === true) {
      setIsLoading(false);
      return;
    }
    
    // If Privy is not ready yet, keep loading state
    // This will show LoadingScreen which will show login UI when ready
  }, [ready, authenticated, setIsLoading]);

  // CRITICAL: Wait for Privy to be ready before checking authentication
  // If Privy is not ready yet, show loading screen (will show login UI when ready)
  if (!ready) {
    return (
      <ThemeProvider>
        <LoadingScreen />
        <Toaster theme="dark" />
      </ThemeProvider>
    );
  }

  // CRITICAL: Only allow access if user is EXPLICITLY authenticated
  // This check happens AFTER ready is true, so we can trust the authenticated value
  // If authenticated is not exactly true (false, undefined, null), show login screen
  if (authenticated !== true) {
    // Reset loading state to ensure login UI shows immediately
    setIsLoading(false);
    return (
      <ThemeProvider>
        <LoadingScreen />
        <Toaster theme="dark" />
      </ThemeProvider>
    );
  }

  // User is authenticated - show main app (no loading delay for authenticated users)
  return <AppContent activeTab={activeTab} setActiveTab={setActiveTab} isLoading={false} setIsLoading={setIsLoading} />;
}

function AppContent({ activeTab, setActiveTab, isLoading, setIsLoading }: { activeTab: Tab; setActiveTab: (tab: Tab) => void; isLoading: boolean; setIsLoading: (loading: boolean) => void }) {
  // AppContent should only render when user is authenticated
  // Debug logging
  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      console.log('[AppContent] Rendering, activeTab:', activeTab);
    }
  }, [activeTab]);

  return (
    <ThemeProvider>
      <div className="h-screen w-screen bg-[var(--bg-primary)] flex flex-col transition-colors duration-300 relative overflow-hidden">
        <AnimatedBackground />
        
        {/* Top bar for debugging */}
        {import.meta.env.DEV && (
          <div className="fixed top-2 right-2 bg-black/80 text-white text-xs p-2 rounded z-50 font-mono">
            <div>Tab: {activeTab}</div>
          </div>
        )}
        
        <main className="flex-1 overflow-hidden relative z-10">
          <div className="h-full max-w-7xl mx-auto">
            {activeTab === 'markets' && <MarketsPage />}
            {activeTab === 'portfolio' && <PortfolioPage />}
            {activeTab === 'profile' && <ProfilePage />}
          </div>
        </main>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="glass-card rounded-full shadow-2xl flex items-center gap-1 h-14 px-2">
            <button
              onClick={() => setActiveTab('markets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeTab === 'markets' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span className="text-sm font-medium">Markets</span>
            </button>
            
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeTab === 'portfolio' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">Portfolio</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeTab === 'profile' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Profile</span>
            </button>
          </div>
        </nav>
      </div>
      <Toaster theme={activeTab === 'profile' ? 'system' : 'dark'} />
    </ThemeProvider>
  );
}

