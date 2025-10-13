"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  getDefaultConfig,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "prohesis-default";

// ✅ Build the config with getDefaultConfig (simplified for v2)
export const config = getDefaultConfig({
  appName: "Prohesis",
  projectId,
  chains: [sepolia],
  ssr: true, // enables SSR-friendly setup for Next.js 15+
});

// ✅ Create a QueryClient for RainbowKit + Wagmi
const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "#2563eb",
            borderRadius: "large",
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
