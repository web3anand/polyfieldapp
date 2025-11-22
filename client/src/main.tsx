import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import AppWithAuth from "./components/AppWithAuth.tsx";
import "./index.css";
import { getPrivyConfig } from "./lib/privy-config";
import { initConsoleFilters } from "./utils/consoleFilters";

// Initialize console filters to suppress harmless warnings
initConsoleFilters();

// Get Privy configuration (includes fallback App ID)
const privyConfig = getPrivyConfig();
const hasPrivyAppId = privyConfig.appId && privyConfig.appId.length > 0;

// Log current origin for Privy setup (helpful for debugging)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  const currentOrigin = window.location.origin;
  const isUsingEnvVar = !!import.meta.env.VITE_PRIVY_APP_ID;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Privy Configuration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 Current Origin:', currentOrigin);
  console.log('📍 Privy App ID:', privyConfig.appId);
  console.log('📍 Source:', isUsingEnvVar ? 'Environment Variable (VITE_PRIVY_APP_ID)' : 'Fallback App ID');
  console.log('');
  console.log('✅ VERIFICATION CHECKLIST:');
  console.log('   1. Go to: https://dashboard.privy.io/');
  console.log('   2. Find app with App ID:', privyConfig.appId);
  console.log('   3. Go to: Settings → Allowed Origins');
  console.log('   4. Verify this origin is listed:', currentOrigin);
  console.log('   5. Make sure NO trailing slash (http://localhost:3001 not http://localhost:3001/)');
  console.log('');
  if (!isUsingEnvVar) {
    console.warn('⚠️  Using FALLBACK App ID. If you have your own App ID:');
    console.warn('   Create client/.env file with: VITE_PRIVY_APP_ID=your_app_id_here');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Always wrap with PrivyProvider since we have a fallback App ID
// The fallback ensures the app works even without VITE_PRIVY_APP_ID env var
const AppWrapper = (
  <PrivyProvider
    appId={privyConfig.appId}
    config={{
      ...privyConfig.config,
      loginMethods: privyConfig.config.loginMethods as any,
      appearance: privyConfig.config.appearance,
      embeddedWallets: {
        createOnLogin: privyConfig.config.embeddedWallets.createOnLogin as any,
      },
      // Privy will automatically detect the origin from window.location
      // Make sure your Privy dashboard has your origin added as an allowed origin
      // See PRIVY_ORIGIN_SETUP.md for instructions
    }}
  >
    <AppWithAuth />
  </PrivyProvider>
);

createRoot(document.getElementById("root")!).render(AppWrapper);
  