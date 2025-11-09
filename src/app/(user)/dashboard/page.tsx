"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import useSWR from "swr";
import CopyTradingCard from "@/components/copytrading/CopyTradingCard";

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
    <div className="w-full p-6 min-h-screen bg-gradient-to-br from-purple-50/10 to-magenta-50/10">
      {/* Top: title + search look (to mirror admin) */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Your Bets</h1>
        <p className="text-sm text-purple-200 mt-1">Track your active bets, pending claims, and history.</p>
      </div>

      {/* Copy Trading Stats */}
      {address && (
        <div className="mb-6">
          <CopyTradingCard userId={address} />
        </div>
      )}

      {/* Tabs */}
      <div className="inline-flex bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-1 mb-6 shadow-sm flex-wrap">
        {[
          { key: "active", label: `Active (${active.length})` },
          { key: "pending", label: `Pending Claims (${pending.length})` },
          { key: "past", label: `Past (${past.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-gradient-to-r from-purple-600 to-magenta-600 text-white shadow-md" : "text-purple-200 hover:bg-white/10"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <section className="bg-white/10 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/20">
        {isLoading ? (
          <div className="text-purple-200">Loading…</div>
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
  if (!items || items.length === 0) return <div className="text-purple-200 text-sm">{empty}</div>;
  return (
    <ul className="divide-y divide-white/10">
      {items.map((b: any) => (
        <li key={b.id} className="py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-white truncate">{b.title || `Market ${b.marketId || b.id}`}</div>
            <div className="text-xs text-purple-300">{b.status || "Open"}</div>
          </div>
          {typeof b.amount !== "undefined" && (
            <div className="text-sm text-purple-200">{Number(b.amount).toFixed(4)} ETH</div>
          )}
        </li>
      ))}
    </ul>
  );
}

