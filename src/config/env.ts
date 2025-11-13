/**
 * Environment configuration
 * Loads environment variables with type safety
 */

export const env = {
  // API Configuration
  // Backend API URL - used as fallback if direct Polymarket API calls fail due to CORS
  // Set to empty string to use Polymarket API directly (may be blocked by CORS)
  // Override with VITE_API_BASE_URL environment variable if needed
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  
  // External APIs
  externalApi1Url: import.meta.env.VITE_EXTERNAL_API_1_URL || '',
  externalApi2Url: import.meta.env.VITE_EXTERNAL_API_2_URL || '',
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Polymarket Mobile',
  appVersion: import.meta.env.VITE_APP_VERSION || '0.1.0',
  
  // Environment
  env: import.meta.env.VITE_ENV || import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Feature Flags
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
} as const;

// Validate required environment variables
if (env.isProduction && !env.apiBaseUrl) {
  console.warn('⚠️ VITE_API_BASE_URL is not set in production!');
}

export default env;

