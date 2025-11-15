import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import AppWithAuth from "./components/AppWithAuth.tsx";
import "./index.css";
import "./styles/globals.css";
import { getPrivyConfig } from "./lib/privy-config";

// Get Privy configuration (includes fallback App ID)
const privyConfig = getPrivyConfig();
const hasPrivyAppId = privyConfig.appId && privyConfig.appId.length > 0;

// Always wrap with PrivyProvider since we have a fallback App ID
// The fallback ensures the app works even without VITE_PRIVY_APP_ID env var
const AppWrapper = (
  <PrivyProvider
    appId={privyConfig.appId}
    config={{
      loginMethods: privyConfig.config.loginMethods as any,
      appearance: privyConfig.config.appearance,
      embeddedWallets: {
        createOnLogin: privyConfig.config.embeddedWallets.createOnLogin as any,
      },
      // Privy will automatically detect the origin from window.location
      // Make sure your Privy dashboard has your Vercel URL added as an allowed origin
    }}
  >
    <AppWithAuth />
  </PrivyProvider>
);

createRoot(document.getElementById("root")!).render(AppWrapper);
  