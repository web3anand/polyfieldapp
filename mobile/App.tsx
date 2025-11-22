import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Unbounded_400Regular, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { SpaceGrotesk_400Regular, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';

// Polyfills for crypto/ethers
import 'react-native-get-random-values';
import '@ethersproject/shims';
import 'react-native-url-polyfill/auto';

import { PrivyProvider } from '@privy-io/expo';
import { ThemeProvider } from './src/theme/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import { SupabaseProvider } from './src/context/SupabaseContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import { Platform, View, Text, StyleSheet } from 'react-native';

// Privy configuration from client app
const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID || 'cmhxczt420087lb0d07g6zoxs';
const PRIVY_CLIENT_ID = 'client-WY6SXTcNxkfKDc9Gqz6PWd1SAPfXyiFapy2QUh24bNCFp';

// Check if running on web - Privy Expo SDK doesn't support web
const isWeb = Platform.OS === 'web';

// Suppress embedded wallet warnings for Expo Go
// Embedded wallets require a dev build with @privy-io/expo-native-extensions
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  if (
    message.includes('Embedded wallet') ||
    message.includes('proxy not initialized') ||
    message.includes('reload proxy')
  ) {
    // Silently ignore these warnings in Expo Go
    return;
  }
  originalWarn(...args);
};

console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  if (
    message.includes('Embedded wallet') ||
    message.includes('proxy not initialized')
  ) {
    // Silently ignore these errors in Expo Go
    return;
  }
  originalError(...args);
};

export default function App() {
  // Measure startup time
  const appStartTime = Date.now();
  console.log('⏱️ App started at:', appStartTime);
  console.log('📱 App initializing with Privy App ID:', PRIVY_APP_ID);
  console.log('📱 Using Privy Client ID:', PRIVY_CLIENT_ID);
  console.log('📱 Platform:', Platform.OS);
  
  useEffect(() => {
    const elapsed = Date.now() - appStartTime;
    console.log(`✅ App rendered in ${elapsed}ms`);
    
    // Initialize enhanced WebSocket for ultra-low latency
    (async () => {
      try {
        const { enhancedWS } = await import('./src/lib/enhancedWebSocket');
        console.log('🚀 Starting Enhanced WebSocket Manager...');
        enhancedWS.start();
        
        // Cleanup on unmount
        return () => {
          enhancedWS.stop();
        };
      } catch (error) {
        console.error('Failed to initialize enhanced WebSocket:', error);
      }
    })();
  }, []);
  
  const [fontsLoaded] = useFonts({
    Unbounded_400Regular,
    Unbounded_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_700Bold,
  });
  
  // Show error message for web platform
  if (isWeb) {
    return (
      <View style={webStyles.container}>
        <View style={webStyles.card}>
          <Text style={webStyles.title}>❌ Web Platform Not Supported</Text>
          <Text style={webStyles.message}>
            This app uses @privy-io/expo which requires native modules.
          </Text>
          <Text style={webStyles.instructions}>
            Please run on a physical device or emulator:
          </Text>
          <Text style={webStyles.command}>• iOS: npx expo start --ios</Text>
          <Text style={webStyles.command}>• Android: npx expo start --android</Text>
          <Text style={webStyles.note}>
            Or scan the QR code with Expo Go on your mobile device.
          </Text>
        </View>
      </View>
    );
  }
  
  if (!fontsLoaded) {
    return <LoadingScreen />;
  }
  
  return (
    <ThemeProvider>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        clientId={PRIVY_CLIENT_ID}
      >
        <SupabaseProvider>
          <ToastProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </ToastProvider>
        </SupabaseProvider>
      </PrivyProvider>
    </ThemeProvider>
  );
}

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 24,
  },
  instructions: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  command: {
    fontSize: 14,
    color: '#6366f1',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
