/**
 * Login Screen with Privy Authentication
 * Shows before app loads if user is not authenticated
 */

import { useState } from 'react';
import { Wallet, Mail, Sparkles, ArrowRight, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePrivy, useLoginWithEmail } from '@privy-io/react-auth';
import { toast } from 'sonner';

export function LoginScreen() {
  const { ready, authenticated, login } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Handle wallet login
  const handleWalletLogin = async () => {
    try {
      setIsLoading(true);
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email login
  const handleEmailLogin = async () => {
    try {
      setIsLoading(true);
      if (!showCodeInput) {
        // Send OTP code
        await sendCode({ email });
        setShowCodeInput(true);
        toast.success('Code sent to your email!');
      } else {
        // Verify code and login
        await loginWithCode({ code });
      }
    } catch (error: any) {
      console.error('Email login error:', error);
      toast.error(error?.message || 'Failed to login with email');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while Privy initializes
  if (!ready) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"
          />
          <p className="text-white/80 text-sm">Initializing...</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't show login screen
  if (authenticated) {
    return null;
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Login Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2 font-[Days_One]">
            PolyField
          </h1>
          <p className="text-white/70 text-sm">
            Trade prediction markets with confidence
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            Welcome Back
          </h2>
          <p className="text-white/60 text-sm text-center mb-6">
            Connect your wallet to start trading
          </p>

          {/* Login Options */}
          <div className="space-y-3">
            {/* Wallet Login */}
            <motion.button
              onClick={handleWalletLogin}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="w-5 h-5" />
              <span className="flex-1 text-left">Connect Wallet</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Email Login */}
            {!showCodeInput ? (
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <motion.button
                  onClick={handleEmailLogin}
                  disabled={isLoading || !email}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white font-semibold transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className="w-5 h-5" />
                  <span className="flex-1 text-left">Continue with Email</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-white/70 text-sm text-center">
                  Enter the code sent to {email}
                </p>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest"
                />
                <motion.button
                  onClick={handleEmailLogin}
                  disabled={isLoading || code.length !== 6}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex-1 text-center">Verify Code</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <button
                  onClick={() => {
                    setShowCodeInput(false);
                    setCode('');
                  }}
                  className="w-full text-white/60 text-sm hover:text-white transition-colors"
                >
                  Use a different email
                </button>
              </div>
            )}
          </div>

          {/* Info Text */}
          <p className="text-white/50 text-xs text-center mt-6">
            By connecting, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"
              />
              <p className="text-white text-sm">Connecting...</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

