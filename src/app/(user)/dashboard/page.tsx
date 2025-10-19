"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export const dynamic = "force-dynamic";

type BetItem = { id: string; title: string; amount?: number; marketId?: string; status?: string };

export default function DashboardPage() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<BetItem[]>([]);
  const [pending, setPending] = useState<BetItem[]>([]);
  const [past, setPast] = useState<BetItem[]>([]);
  const [tab, setTab] = useState<"active" | "pending" | "past">("active");

  useEffect(() => {
    (async () => {
      if (!address) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/user/bets?wallet=${address}`);
        const data = await res.json();
        setActive(data.activeBets || []);
        setPending(data.pendingClaims || []);
        setPast(data.pastBets || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Top: title + search look (to mirror admin) */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Your Bets</h1>
        <p className="text-sm text-gray-500">Track your active bets, pending claims, and history.</p>
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-white rounded-xl border p-1 mb-4">
        {[
          { key: "active", label: `Active (${active.length})` },
          { key: "pending", label: `Pending Claims (${pending.length})` },
          { key: "past", label: `Past (${past.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-3 py-1 rounded-md text-sm ${tab === t.key ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <section className="bg-white border rounded-xl p-4">
        {loading ? (
          <div className="text-gray-500">Loading…</div>
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
  if (!items || items.length === 0) return <div className="text-gray-500 text-sm">{empty}</div>;
  return (
    <ul className="divide-y">
      {items.map((b: any) => (
        <li key={b.id} className="py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{b.title || `Market ${b.marketId || b.id}`}</div>
            <div className="text-xs text-gray-500">{b.status || "Open"}</div>
          </div>
          {typeof b.amount !== "undefined" && (
            <div className="text-sm text-gray-600">{Number(b.amount).toFixed(4)} ETH</div>
          )}
        </li>
      ))}
    </ul>
  );
}

