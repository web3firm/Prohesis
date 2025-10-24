"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

import { Web3Auth } from "@web3auth/modal";
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

// Env
const WEB3AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "";
const WEB3AUTH_NETWORK = process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK || "sapphire_devnet";
const RPC_URL =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.NEXT_PUBLIC_ALCHEMY_RPC ||
  "https://sepolia.base.org";

function buildConnectors() {
  const list: any[] = [injected()];
  if (!WEB3AUTH_CLIENT_ID) {
    console.warn("Web3Auth clientId missing. Set NEXT_PUBLIC_WEB3AUTH_CLIENT_ID to enable Web3Auth in the connect modal.");
    return list;
  }
  // Only on client
  if (typeof window === "undefined") return list;
  try {
    const chainConfig = {
      chainNamespace: "eip155",
      chainId: `0x${baseSepolia.id.toString(16)}`,
      rpcTarget: RPC_URL,
      displayName: "Base Sepolia",
      blockExplorer: "https://sepolia.basescan.org",
      ticker: "ETH",
      tickerName: "Ethereum",
    } as const;
    const privateKeyProvider = new (EthereumPrivateKeyProvider as any)({
      config: { chainConfig },
    });
    const web3AuthInstance = new Web3Auth({
      clientId: WEB3AUTH_CLIENT_ID,
      web3AuthNetwork: WEB3AUTH_NETWORK as any,
      privateKeyProvider,
      uiConfig: { appName: "Prohesis", mode: "auto" },
    });
    const web3authConnector = Web3AuthConnector({
      web3AuthInstance,
      id: "web3auth",
      name: "Web3Auth",
      type: "web3auth",
    });
    list.unshift(web3authConnector as unknown as any);
  } catch (e) {
    console.warn("Web3Auth initialization failed:", (e as any)?.message || e);
  }
  return list;
}

export const config = createConfig({
  ssr: true,
  chains: [baseSepolia],
  connectors: buildConnectors(),
  transports: { [baseSepolia.id]: http(RPC_URL) },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({ accentColor: "#2563eb", borderRadius: "large" })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
