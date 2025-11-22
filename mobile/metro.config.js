// Metro configuration for Expo SDK 52
// Aliases react-native-passkeys to a shim so Expo Go/web can bundle without native module.
// Forces jose to use browser build to avoid Node crypto imports.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure resolver
config.resolver = config.resolver || {};

// Add custom resolution logic
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Resolve jose to the browser build
  if (moduleName === 'jose') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/jose/dist/browser/index.js'),
      type: 'sourceFile',
    };
  }
  
  // Resolve react-native-passkeys to shim
  if (moduleName === 'react-native-passkeys') {
    return {
      filePath: path.resolve(__dirname, 'shims/react-native-passkeys.js'),
      type: 'sourceFile',
    };
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

// Prioritize browser conditions for packages with multiple entry points
config.resolver.resolverMainFields = ['browser', 'react-native', 'main'];

module.exports = config;
