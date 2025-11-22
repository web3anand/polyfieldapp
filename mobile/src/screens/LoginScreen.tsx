/**
 * Login Screen - Modal Login Options
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Platform, TextInput, KeyboardAvoidingView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { usePrivy, useLoginWithEmail, useLoginWithOAuth, useLoginWithSiwe } from '@privy-io/expo';
import { useLoginWithPasskey } from '@privy-io/expo/passkey';
import { useThemeContext } from '../theme/ThemeContext';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const theme = useTheme();
  const { colors } = useThemeContext();
  const { user, isReady } = usePrivy();
  
  const themedStyles = styles(colors);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [forceReady, setForceReady] = useState(false); // Fallback after timeout
  
  // Monitor Privy initialization time with timeout
  React.useEffect(() => {
    const startTime = Date.now();
    console.log('⏱️ LoginScreen mounted, waiting for Privy...');
    
    // Force ready after 3 seconds if Privy is still initializing
    const timeout = setTimeout(() => {
      if (!isReady) {
        console.warn('⚠️ Privy initialization taking too long, forcing UI to show');
        setForceReady(true);
      }
    }, 3000);
    
    if (isReady) {
      const elapsed = Date.now() - startTime;
      console.log(`✅ Privy ready in ${elapsed}ms`);
      clearTimeout(timeout);
    }
    
    return () => clearTimeout(timeout);
  }, [isReady]);
  
  const [loginType, setLoginType] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  // Email modal state
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Email login
  const emailLogin = useLoginWithEmail({
    onError: (error) => {
      console.error('❌ Email login error:', error);
      console.error('❌ Error name:', error?.name);
      console.error('❌ Error message:', error?.message);
      console.error('❌ This error usually means:');
      console.error('   1. Email login is not enabled in Privy Dashboard');
      console.error('   2. Email provider is not configured');
      console.error('   3. Rate limit exceeded (5 codes/hour per email)');
      console.error('❌ Fix: Go to dashboard.privy.io → Settings → Login Methods → Enable Email');
      setIsLoggingIn(false);
      setLoginType(null);
      setSendingCode(false);
      setVerifyingCode(false);
      setEmailError('Email login is not configured. Please use Twitter/X login.');
    },
    onSendCodeSuccess: ({ email }) => {
      console.log('✅ Code sent successfully to:', email);
      setIsCodeSent(true);
      setSendingCode(false);
    },
    onLoginSuccess: (user, isNewUser) => {
      console.log('✅ Email login successful!');
      console.log('✅ User ID:', user?.id);
      console.log('✅ Is new user:', isNewUser);
      setIsLoggingIn(false);
      setLoginType(null);
      setEmailModalVisible(false);
      setModalVisible(false);
      setSendingCode(false);
      setVerifyingCode(false);
    },
  });

  // Twitter login
  const { login: loginWithTwitter } = useLoginWithOAuth({
    onError: () => {
      setIsLoggingIn(false);
      setLoginType(null);
    },
  });

  // Wallet login (SIWE) - requires onSuccess callback
  const { generateSiweMessage } = useLoginWithSiwe({
    onError: () => {
      setIsLoggingIn(false);
      setLoginType(null);
    },
    onSuccess: () => {
      setIsLoggingIn(false);
      setLoginType(null);
      setModalVisible(false);
    },
  });

  // Passkey login
  const { loginWithPasskey } = useLoginWithPasskey({
    onError: () => {
      setIsLoggingIn(false);
      setLoginType(null);
    },
    onSuccess: () => {
      setIsLoggingIn(false);
      setLoginType(null);
      setModalVisible(false);
    },
  });

  // Auto-advance when authenticated
  React.useEffect(() => {
    if (user) {
      onLogin();
    }
  }, [user, onLogin]);

  const handleEmailLogin = () => {
    setLoginType('email');
    setModalVisible(false);
    setEmailModalVisible(true);
  };

  const requestEmailCode = async () => {
    setEmailError(null);
    // Basic email validation
    const emailPattern = /.+@.+\..+/;
    if (!emailPattern.test(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setSendingCode(true);
    try {
      console.log('🔵 Sending code to:', email);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
      });
      
      // Race between sendCode and timeout
      await Promise.race([
        emailLogin.sendCode({ email }),
        timeoutPromise
      ]);
      
      console.log('✅ Code sent successfully');
    } catch (e: any) {
      console.error('❌ Send code error:', e);
      console.error('❌ Error type:', e?.constructor?.name);
      console.error('❌ Error details:', JSON.stringify(e, null, 2));
      
      if (e?.message?.includes('Aborted') || e?.constructor?.name === 'AbortError') {
        setEmailError('Email login is not configured in Privy. Please use Twitter/X login instead.');
        console.error('💡 Solution: Enable email in Privy Dashboard (Settings → Login Methods)');
      } else if (e?.message?.includes('timed out')) {
        setEmailError('Request timed out. Please check your internet connection and try again.');
      } else {
        setEmailError(e?.message || 'Failed to send code. Please try again.');
      }
    } finally {
      setSendingCode(false);
    }
  };

  const submitEmailCode = async () => {
    if (!code || code.length < 4) {
      setEmailError('Enter the code sent to your email');
      return;
    }
    setVerifyingCode(true);
    setEmailError(null);
    try {
      console.log('🔵 Verifying code:', code.substring(0, 2) + '****', 'for email:', email);
      // IMPORTANT: loginWithCode requires both code AND email parameters
      await emailLogin.loginWithCode({ code: code, email: email });
      console.log('✅ Code verified successfully');
      // onSuccess handler above will close modals
    } catch (e: any) {
      console.error('❌ Verify code error:', e);
      setEmailError(e?.message || 'Invalid or expired code. Try again.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleTwitterLogin = async () => {
    setIsLoggingIn(true);
    setLoginType('twitter');
    setModalVisible(false);
    try {
      await loginWithTwitter({ provider: 'twitter' });
    } catch (error) {
      console.error('Twitter login error:', error);
      setIsLoggingIn(false);
      setLoginType(null);
    }
  };

  const handleWalletLogin = async () => {
    setLoginType('wallet');
    setModalVisible(false);
    // For now, guide the user: external wallets require WalletConnect + SIWE.
    // We’ll add this in the next iteration. Embedded wallets are created automatically after Email/X login.
    alert('External wallet connection will be enabled with WalletConnect in the next step. Use Email or X now to create your embedded wallet; you can link an external wallet later from Profile.');
  };

  const handlePasskeyLogin = async () => {
    setIsLoggingIn(true);
    setLoginType('passkey');
    try {
      // Passkeys require a valid HTTPS relying party URL on web, and
      // native configuration (allowed app IDs, key hashes) on mobile.
      // Avoid attempting passkeys on web dev where localhost/http is used.
      if (Platform.OS === 'web') {
        alert('Passkey login is not available in web dev. Use native (Expo Go) or a secure https origin.');
      } else {
        await loginWithPasskey({
          // Use your production HTTPS domain as the relying party URL
          // This must be a valid https URL, not just a bare domain.
          relyingParty: 'https://polyfield.app',
        });
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Passkey login error:', error);
      setIsLoggingIn(false);
      setLoginType(null);
    }
  };

  // Show UI immediately while Privy initializes in background
  // Users can see the screen but buttons will be disabled until ready
  const showLoading = !isReady && !forceReady;
  const effectiveReady = isReady || forceReady;

  return (
    <View style={[themedStyles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={themedStyles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={themedStyles.logo}
          resizeMode="contain"
        />
        <Text style={[themedStyles.title, { color: theme.colors.text }]}>
          Poly<Text style={themedStyles.titleAccent}>Field</Text>
        </Text>
        <Text style={[themedStyles.subtitle, { color: theme.colors.text } ]}>Prediction Markets</Text>
      </View>

      {/* Single Login Button */}
      <View style={themedStyles.buttonContainer}>
        <TouchableOpacity 
          style={[themedStyles.button, themedStyles.primaryButton, showLoading && { opacity: 0.6 }]}
          onPress={() => setModalVisible(true)}
          disabled={showLoading}
        >
          {showLoading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={themedStyles.buttonText}>Initializing...</Text>
            </>
          ) : (
            <>
              <Text style={themedStyles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={themedStyles.buttonIcon} />
            </>
          )}
        </TouchableOpacity>

        <Text style={themedStyles.infoText}>
          Wallet created automatically after login
        </Text>
      </View>

      {/* Footer */}
      <Text style={[themedStyles.disclaimer, { color: theme.colors.text }]}>
        By continuing, you agree to our Terms & Privacy Policy
      </Text>

      {/* Modal with Login Options */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={themedStyles.modalOverlay}>
    <View style={[themedStyles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.sheetTitle}>Sign In</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={themedStyles.closeButton}>
                <Ionicons name="close-circle" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <Text style={themedStyles.sheetSubtitle}>Choose your preferred method</Text>

            <View style={themedStyles.optionsContainer}>
            {/* Passkey Option */}
            <TouchableOpacity
              style={[themedStyles.option, loginType === 'passkey' && themedStyles.optionLoading]}
              onPress={handlePasskeyLogin}
              disabled={isLoggingIn}
            >
              <View style={[themedStyles.optionIcon, themedStyles.passkeyIcon]}>
                <Ionicons name="finger-print" size={24} color="#8b5cf6" />
              </View>
              <View style={themedStyles.optionContent}>
                <Text style={themedStyles.optionTitle}>Passkey</Text>
                <Text style={themedStyles.optionSubtitle}>Biometric authentication</Text>
              </View>
              {loginType === 'passkey' && <ActivityIndicator color="#8b5cf6" />}
              {loginType !== 'passkey' && (
                <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
              )}
            </TouchableOpacity>

            {/* Email Option */}
            <TouchableOpacity
              style={[themedStyles.option, loginType === 'email' && themedStyles.optionLoading]}
              onPress={handleEmailLogin}
              disabled={isLoggingIn}
            >
              <View style={[themedStyles.optionIcon, themedStyles.emailIcon]}>
                <Ionicons name="mail" size={24} color="#6366f1" />
              </View>
              <View style={themedStyles.optionContent}>
                <Text style={themedStyles.optionTitle}>Email</Text>
                <Text style={themedStyles.optionSubtitle}>One-time passcode</Text>
              </View>
              {loginType === 'email' && <ActivityIndicator color="#6366f1" />}
              {loginType !== 'email' && (
                <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
              )}
            </TouchableOpacity>

            {/* Wallets Option */}
            <TouchableOpacity
              style={[themedStyles.option, loginType === 'wallet' && themedStyles.optionLoading]}
              onPress={handleWalletLogin}
              disabled={isLoggingIn}
            >
              <View style={[themedStyles.optionIcon, themedStyles.walletIcon]}>
                <Ionicons name="wallet" size={24} color="#10b981" />
              </View>
              <View style={themedStyles.optionContent}>
                <Text style={themedStyles.optionTitle}>Wallet</Text>
                <Text style={themedStyles.optionSubtitle}>Connect external wallet</Text>
              </View>
              {loginType === 'wallet' && <ActivityIndicator color="#10b981" />}
              {loginType !== 'wallet' && (
                <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
              )}
            </TouchableOpacity>

            {/* Twitter/X Option */}
            <TouchableOpacity
              style={[themedStyles.option, loginType === 'twitter' && themedStyles.optionLoading]}
              onPress={handleTwitterLogin}
              disabled={isLoggingIn}
            >
              <View style={[themedStyles.optionIcon, themedStyles.twitterIcon]}>
                <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
              </View>
              <View style={themedStyles.optionContent}>
                <Text style={themedStyles.optionTitle}>X (Twitter)</Text>
                <Text style={themedStyles.optionSubtitle}>Social login</Text>
              </View>
              {loginType === 'twitter' && <ActivityIndicator color="#1DA1F2" />}
              {loginType !== 'twitter' && (
                <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
              )}
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email OTP Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={themedStyles.modalOverlay}>
          <View style={themedStyles.modalContent}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.sheetTitle}>{isCodeSent ? 'Enter Code' : 'Sign in with Email'}</Text>
              <TouchableOpacity onPress={() => setEmailModalVisible(false)} style={themedStyles.closeButton}>
                <Ionicons name="close-circle" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <Text style={themedStyles.sheetSubtitle}>
              {isCodeSent ? `We sent a code to ${email}` : 'We’ll email you a one-time passcode'}
            </Text>

            {!isCodeSent ? (
              <View style={{ gap: 12 }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  borderWidth: 1.5, borderColor: '#f0f0f0', borderRadius: 12, paddingHorizontal: 12,
                  backgroundColor: '#fff', height: 54
                }}>
                  <Ionicons name="mail-outline" size={20} color="#6b7280" style={{ marginRight: 8 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, color: '#111827' }}
                    placeholder="your@email.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
                {emailError ? <Text style={{ color: '#ef4444', fontSize: 12 }}>{emailError}</Text> : null}
                <TouchableOpacity
                  style={[themedStyles.button, themedStyles.primaryButton, sendingCode && { opacity: 0.7 }]}
                  onPress={requestEmailCode}
                  disabled={sendingCode}
                >
                  {sendingCode ? <ActivityIndicator color="#fff" /> : <Text style={themedStyles.buttonText}>Send Code</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  borderWidth: 1.5, borderColor: '#f0f0f0', borderRadius: 12, paddingHorizontal: 12,
                  backgroundColor: '#fff', height: 54
                }}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={{ marginRight: 8 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 18, color: '#111827', letterSpacing: 4 }}
                    placeholder="000000"
                    placeholderTextColor="#9ca3af"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
                {emailError ? <Text style={{ color: '#ef4444', fontSize: 12 }}>{emailError}</Text> : null}
                <TouchableOpacity
                  style={[themedStyles.button, themedStyles.primaryButton, verifyingCode && { opacity: 0.7 }]}
                  onPress={submitEmailCode}
                  disabled={verifyingCode}
                >
                  {verifyingCode ? <ActivityIndicator color="#fff" /> : <Text style={themedStyles.buttonText}>Verify & Login</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingVertical: 8, alignItems: 'center' }}
                  onPress={() => {
                    setIsCodeSent(false);
                    setCode('');
                    setEmailError(null);
                  }}
                  disabled={sendingCode}
                >
                  <Text style={{ color: '#6366f1', fontSize: 14, fontWeight: '600' }}>
                    Didn't receive code? Try again
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginTop: 100,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.5,
  },
  titleAccent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.accent,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.8,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '400',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  closeButton: {
    padding: 4,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    fontWeight: '400',
  },
  optionsContainer: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionLoading: {
    opacity: 0.5,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  passkeyIcon: {
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  emailIcon: {
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  walletIcon: {
    backgroundColor: `${colors.success}1A`,
    borderWidth: 1,
    borderColor: `${colors.success}40`,
  },
  twitterIcon: {
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },
});

