"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { baseSepolia } from "wagmi/chains";
import { createPublicClient, http, formatEther } from "viem";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<string>("0");

  // Real-time portfolio data
  const { data: portfolioData } = useSWR(
    address ? `/api/user/portfolio?wallet=${address}` : null,
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Use portfolio data when available
  console.log('Portfolio data:', portfolioData);

  const client = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(
          process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
        ),
      }),
    []
  );

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    try {
      const bal = await client.getBalance({ address: address as `0x${string}` });
      setBalance(formatEther(bal));
    } catch (e) {
      console.error("Failed to fetch balance", e);
    }
  }, [address, client]);

  useEffect(() => {
    fetchBalance();
    // Refresh balance every 15 seconds
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  if (!isConnected) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-sm text-gray-600 dark:text-gray-400">Connect your wallet to view your portfolio.</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Portfolio</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">Network: Base Sepolia</div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400">EOA Address</div>
          <div className="font-mono text-sm break-all text-gray-900 dark:text-white">{address}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400">Base Sepolia Balance</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">{balance} ETH</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Bridging</div>
          <div className="space-x-2">
            <a
              href="https://bridge.base.org/"
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              Open Base Bridge
            </a>
            <a
              href="https://testnet.across.to/"
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              Across Testnet
            </a>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Programmatic bridging can be added (Across/Socket/LI.FI) with your chosen provider.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Open Positions</h2>
          <Link href="/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View Dashboard
          </Link>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Coming soon: positions, PnL, and history.</div>
      </section>
    </div>
  );
}
