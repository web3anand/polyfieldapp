import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import AppWithAuth from "./components/AppWithAuth.tsx";
import "./index.css";
import { getPrivyConfig } from "./lib/privy-config";

const privyConfig = getPrivyConfig();
const hasPrivyAppId = privyConfig.appId && privyConfig.appId.length > 0 && privyConfig.appId !== '';

// Only wrap with PrivyProvider if we have a valid app ID
// Otherwise, render app without authentication (for development)
const AppWrapper = hasPrivyAppId ? (
  <PrivyProvider
    appId={privyConfig.appId!}
    config={{
      loginMethods: privyConfig.config.loginMethods as any,
      appearance: privyConfig.config.appearance,
      embeddedWallets: {
        createOnLogin: privyConfig.config.embeddedWallets.createOnLogin as any,
      },
      // Privy will automatically detect the origin from window.location
      // Make sure your Privy dashboard has http://localhost:3001 added as an allowed origin
    }}
  >
    <AppWithAuth />
  </PrivyProvider>
) : (
  <AppWithAuth />
);

createRoot(document.getElementById("root")!).render(AppWrapper);
  