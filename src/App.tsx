import { useState, useEffect } from 'react';
import { LineChart, Wallet, UserCircle } from 'lucide-react';
import { MarketsPage } from './components/MarketsPage';
import { PortfolioPage } from './components/PortfolioPage';
import { ProfilePage } from './components/ProfilePage';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginScreen } from './components/LoginScreen';
import { ThemeProvider } from './components/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { AnimatedBackground } from './components/AnimatedBackground';

type Tab = 'markets' | 'portfolio' | 'profile';

// Check if Privy is configured
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const isPrivyConfigured = privyAppId && privyAppId.length > 0;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('markets');
  const [isLoading, setIsLoading] = useState(true);
  
  // Only use Privy hooks if Privy is configured
  let ready = true;
  let authenticated = !isPrivyConfigured; // If not configured, consider "authenticated" to skip login
  
  if (isPrivyConfigured) {
    try {
      // Dynamic import to avoid errors when PrivyProvider is not mounted
      const { usePrivy } = require('@privy-io/react-auth');
      const privy = usePrivy();
      ready = privy.ready;
      authenticated = privy.authenticated;
    } catch (error) {
      // Privy not available - continue without auth
      console.warn('Privy not available, continuing without authentication');
    }
  }

  useEffect(() => {
    // Show loading screen for 1.5 seconds (reduced from 3)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Check if Privy is configured
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
  const isPrivyConfigured = privyAppId && privyAppId.length > 0;

  // Show login screen if Privy is configured and user is not authenticated
  if (isPrivyConfigured && (!ready || !authenticated)) {
    return (
      <ThemeProvider>
        <LoginScreen />
        <Toaster theme="dark" />
      </ThemeProvider>
    );
  }

  // If Privy is not configured, show a notice but allow app to work
  if (isPrivyConfigured && !ready) {
    return (
      <ThemeProvider>
        <div className="h-screen w-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--text-primary)]">Initializing authentication...</p>
          </div>
        </div>
        <Toaster theme="dark" />
      </ThemeProvider>
    );
  }

  // Show loading screen
  if (isLoading) {
    return (
      <ThemeProvider>
        <LoadingScreen />
        <Toaster theme="dark" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="h-screen bg-[var(--bg-primary)] flex flex-col transition-colors duration-300 relative overflow-hidden">
        {/* Animated Background */}
        <AnimatedBackground />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative z-10">
          <div className="h-full max-w-7xl mx-auto">
            {activeTab === 'markets' && <MarketsPage />}
            {activeTab === 'portfolio' && <PortfolioPage />}
            {activeTab === 'profile' && <ProfilePage />}
          </div>
        </main>

        {/* Bottom Navigation */}
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