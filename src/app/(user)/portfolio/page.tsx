"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { baseSepolia } from "wagmi/chains";
import { createPublicClient, http, formatEther } from "viem";

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<string>("0");

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

  useEffect(() => {
    if (!address) return;
    (async () => {
      try {
        const bal = await client.getBalance({ address: address as `0x${string}` });
        setBalance(formatEther(bal));
      } catch (e) {
        console.error("Failed to fetch balance", e);
      }
    })();
  }, [address, client]);

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600">Connect your wallet to view your portfolio.</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Portfolio</h1>
        <div className="text-sm text-gray-500">Network: Base Sepolia</div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">EOA Address</div>
          <div className="font-mono text-sm break-all">{address}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Base Sepolia Balance</div>
          <div className="text-xl font-semibold">{balance} ETH</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Bridging</div>
          <div className="space-x-2">
            <a
              href="https://bridge.base.org/"
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Open Base Bridge
            </a>
            <a
              href="https://testnet.across.to/"
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Across Testnet
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Programmatic bridging can be added (Across/Socket/LI.FI) with your chosen provider.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Open Positions</h2>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            View Dashboard
          </Link>
        </div>
        <div className="text-sm text-gray-500">Coming soon: positions, PnL, and history.</div>
      </section>
    </div>
  );
}
