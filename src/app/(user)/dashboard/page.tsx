"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import useSWR from "swr";

export const dynamic = "force-dynamic";

type BetItem = { id: string; title: string; amount?: number; marketId?: string; status?: string };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { address } = useAccount();
  const [tab, setTab] = useState<"active" | "pending" | "past">("active");

  // Real-time data fetching with SWR
  const { data, isLoading } = useSWR(
    address ? `/api/user/bets?wallet=${address}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const active = data?.activeBets || [];
  const pending = data?.pendingClaims || [];
  const past = data?.pastBets || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Top: title + search look (to mirror admin) */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Bets</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Track your active bets, pending claims, and history.</p>
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 mb-4 flex-wrap">
        {[
          { key: "active", label: `Active (${active.length})` },
          { key: "pending", label: `Pending Claims (${pending.length})` },
          { key: "past", label: `Past (${past.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-3 py-1 rounded-md text-sm ${tab === t.key ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        {isLoading ? (
          <div className="text-gray-500 dark:text-gray-400">Loading…</div>
        ) : tab === "active" ? (
          <BetList items={active} empty="No active bets." />
        ) : tab === "pending" ? (
          <BetList items={pending} empty="No pending claims." />
        ) : (
          <BetList items={past} empty="No past bets." />
        )}
      </section>
    </div>
  );
}

function BetList({ items, empty }: { items: BetItem[]; empty: string }) {
  if (!items || items.length === 0) return <div className="text-gray-500 dark:text-gray-400 text-sm">{empty}</div>;
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {items.map((b: any) => (
        <li key={b.id} className="py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">{b.title || `Market ${b.marketId || b.id}`}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{b.status || "Open"}</div>
          </div>
          {typeof b.amount !== "undefined" && (
            <div className="text-sm text-gray-600 dark:text-gray-300">{Number(b.amount).toFixed(4)} ETH</div>
          )}
        </li>
      ))}
    </ul>
  );
}

