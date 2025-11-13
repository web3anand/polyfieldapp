/// <reference types="vite/client" />
import React from 'react';
import { motion } from 'motion/react';
import { PolyFieldLogo } from './PolyFieldLogo';
import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

function LoadingScreenWithAuth() {
  // These hooks are safe to call because this component only renders
  // when PrivyProvider is mounted (from AppWithPrivy)
  const { ready, authenticated, login } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging (remove in production)
  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      const showLoginValue = authenticated !== true;
      console.log('[LoadingScreen] ready:', ready, 'authenticated:', authenticated, 'showLogin:', showLoginValue, 'type:', typeof authenticated);
      if (!showLoginValue) {
        console.warn('[LoadingScreen] ⚠️ Login UI NOT showing! authenticated is:', authenticated, 'type:', typeof authenticated);
      } else {
        console.log('[LoadingScreen] ✅ Login UI WILL show. authenticated !== true is true');
      }
    }
  }, [ready, authenticated]);

  // Handle login - Privy will show its own modal with wallet/email options
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await login();
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to connect');
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL: Always show login UI when not authenticated
  // This ensures the login screen stays visible until user successfully logs in
  // Only show "Loading markets..." if authenticated (which means we're loading the app)
  // Use explicit boolean check - show login if authenticated is NOT explicitly true
  // Default to showing login if authenticated is undefined (initial state)
  const showLogin = authenticated !== true;
  
  // Debug: Log the actual values to help diagnose
  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      console.log('[LoadingScreen] showLogin calculation:', {
        authenticated,
        'authenticated !== true': authenticated !== true,
        'typeof authenticated': typeof authenticated,
        showLogin,
        ready
      });
    }
  }, [authenticated, showLogin, ready]);
  
  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-between pt-6 pb-4 relative">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Hexagons */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`hex-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0.5, 1.5, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <polygon
                points="20,3 37,13 37,27 20,37 3,27 3,13"
                fill="none"
                stroke={`hsl(${240 + i * 10}, 70%, 60%)`}
                strokeWidth="2"
                opacity="0.4"
              />
            </svg>
          </motion.div>
        ))}

        {/* Floating Circles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 4 + Math.random() * 8,
              height: 4 + Math.random() * 8,
              background: `hsl(${240 + i * 8}, 70%, 60%)`,
            }}
            initial={{ opacity: 0, y: 100 }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [-100, 100],
            }}
            transition={{
              duration: 5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      {/* Scanlines Effect */}
      <div className="scanlines pointer-events-none" />

      {/* Top Content Container */}
      <div className="flex flex-col items-center pt-6">
        {/* Logo Container */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ 
            duration: 1.2, 
            ease: "easeOut",
            type: "spring",
            stiffness: 100
          }}
          className="relative z-10"
        >
          <PolyFieldLogo size={120} />
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-3 text-center"
        >
          <h1 className="text-4xl font-[Orbitron] text-[var(--text-primary)] tracking-wide mb-1">
            PolyField
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="text-[var(--text-muted)] text-sm"
          >
            Predict. Play. Profit.
          </motion.p>
        </motion.div>

        {/* Loading Bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "280px" }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="mt-4 h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden relative"
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
          />
        </motion.div>
      </div>

      {/* Loading Text or Login UI */}
      {/* Always show login UI container - will show login buttons when ready, or spinner when not ready */}
      {/* CRITICAL: Always render the container, then conditionally show login or loading */}
      {(!showLogin || !ready) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ready ? 0.3 : 1.5, duration: 0.5 }}
          className="mt-6 w-full max-w-sm px-4 relative z-20"
        >
        {/* Show login UI if not authenticated (this includes undefined, false, null) */}
        {showLogin ? (
          <>
            {/* Show loading spinner while Privy initializes */}
            {!ready && (
              <div className="flex flex-col items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full mb-4"
                />
                <p className="text-white/70 text-sm">Initializing authentication...</p>
              </div>
            )}
          </>
        ) : (
          // User is authenticated - show loading message
          <div className="glass-card rounded-2xl p-6 border border-white/10 bg-[var(--bg-secondary)]/90 backdrop-blur-md text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"
            />
            <p className="text-[var(--text-primary)] text-sm">Loading markets...</p>
          </div>
        )}
      </motion.div>
      )}

      {/* New Login Button - Positioned at Bottom */}
      {showLogin && ready && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full flex justify-center z-30 px-4 mb-12"
        >
          <div className="w-full max-w-sm flex flex-col items-center gap-2.5">
            <motion.button
              onClick={handleLogin}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-auto min-w-[200px] flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-[Days_One] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '30px' }}
            >
              <span>Enter prediction</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Info Text */}
            <p className="text-white/50 text-xs text-center mt-4">
              By connecting, you agree to our Terms of Service
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function LoadingScreenWithoutAuth() {
  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col justify-start pt-16 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Hexagons */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`hex-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0.5, 1.5, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <polygon
                points="20,3 37,13 37,27 20,37 3,27 3,13"
                fill="none"
                stroke={`hsl(${240 + i * 10}, 70%, 60%)`}
                strokeWidth="2"
                opacity="0.4"
              />
            </svg>
          </motion.div>
        ))}

        {/* Floating Circles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 4 + Math.random() * 8,
              height: 4 + Math.random() * 8,
              background: `hsl(${240 + i * 8}, 70%, 60%)`,
            }}
            initial={{ opacity: 0, y: 100 }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [-100, 100],
            }}
            transition={{
              duration: 5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      {/* Scanlines Effect */}
      <div className="scanlines pointer-events-none" />

      {/* Logo Container */}
      <motion.div
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ 
          duration: 1.2, 
          ease: "easeOut",
          type: "spring",
          stiffness: 100
        }}
        className="relative z-10"
      >
        <PolyFieldLogo size={140} />
      </motion.div>

      {/* App Name */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-4 text-center"
      >
        <h1 className="text-4xl font-[Orbitron] text-[var(--text-primary)] tracking-wide mb-2">
          PolyField
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="text-[var(--text-muted)] text-sm"
        >
          Predict. Play. Profit.
        </motion.p>
      </motion.div>

      {/* Loading Bar */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "280px" }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="mt-6 h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden relative"
      >
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
        />
      </motion.div>

      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.5 }}
        className="mt-4 text-[var(--text-muted)] text-xs tracking-wider"
      >
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading markets...
        </motion.span>
      </motion.div>
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
