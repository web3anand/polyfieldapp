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

  // Debug logging
  useEffect(() => {
    console.log('[LoadingScreen] ready:', ready, 'authenticated:', authenticated);
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

  // Show login UI when not authenticated
  const showLogin = authenticated !== true;
  
  // Show button when ready and need login
  const showButton = ready && showLogin;
  
  return (
    <div className="h-screen w-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
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

      {/* Main Container - Centered everything */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md space-y-8">
        
        {/* Logo */}
        <div className="flex flex-col items-center space-y-6">
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut",
              type: "spring",
              stiffness: 100
            }}
          >
            <PolyFieldLogo size={120} />
          </motion.div>

          {/* App Name */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-[Orbitron] text-[var(--text-primary)] tracking-wide mb-2">
              PolyField
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              Predict. Play. Profit.
            </p>
          </motion.div>

          {/* Loading Bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "280px" }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden relative"
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

        {/* Button Section - Always visible when conditions met */}
        <div className="w-full flex flex-col items-center space-y-4 pt-4">
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="w-full flex flex-col items-center space-y-3"
            >
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full max-w-[320px] flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-full text-white text-lg font-[Days_One] transition-all shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Prediction</span>
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>

              <p className="text-white/50 text-xs text-center px-4">
                By connecting, you agree to our Terms of Service
              </p>
            </motion.div>
          )}

          {/* Loading spinner while Privy initializes */}
          {showLogin && !ready && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="flex flex-col items-center py-4"
            >
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3" />
              <p className="text-white/70 text-sm">Initializing...</p>
            </motion.div>
          )}

          {/* Loading markets when authenticated */}
          {!showLogin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center py-4"
            >
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3" />
              <p className="text-[var(--text-primary)] text-sm">Loading markets...</p>
            </motion.div>
          )}
        </div>

        {/* Debug Info - Remove in production */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded font-mono">
            <div>ready: {String(ready)}</div>
            <div>authenticated: {String(authenticated)}</div>
            <div>showLogin: {String(showLogin)}</div>
            <div>showButton: {String(showButton)}</div>
          </div>
        )}
      </div>
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
  // Always use the auth version since we have a fallback Privy App ID
  // The PrivyProvider is always mounted in main.tsx with the fallback
  return <LoadingScreenWithAuth />;
}
