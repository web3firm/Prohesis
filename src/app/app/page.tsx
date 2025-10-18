"use client";

import useSWR from "swr";
import Navbar from "@/components/ui/Navbar";
import { useMemo, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AppHome() {
  const { data } = useSWR<any[]>("/api/markets/list", fetcher);
  const [tab, setTab] = useState<"trending" | "new" | "ending">("trending");

  const markets = data || [];
  const sorted = useMemo(() => {
    const list = [...markets];
    if (tab === "trending") {
      return list.sort((a, b) => (b.yesPool + b.noPool) - (a.yesPool + a.noPool));
    } else if (tab === "new") {
      return list.sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
    } else {
      return list
        .filter((m) => m.endTime)
        .sort((a, b) => (a.endTime || 0) - (b.endTime || 0));
    }
  }, [markets, tab]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EAF2FF" }}>
      <Navbar />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Markets</h1>
          <div className="hidden md:block text-sm text-gray-500">{markets.length} items</div>
        </div>

        <div className="inline-flex bg-white rounded-xl border p-1 mb-6">
          {([
            { key: "trending", label: "Trending" },
            { key: "new", label: "New" },
            { key: "ending", label: "Ending Soon" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 rounded-md text-sm ${tab === t.key ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="font-semibold text-gray-900 truncate">{m.title}</div>
              <div className="mt-2 text-sm text-gray-600">
                Pool: {(m.yesPool + m.noPool).toFixed(3)} ETH
              </div>
              <div className="mt-1 text-xs text-gray-500">Ends: {m.endTime ? new Date(m.endTime).toLocaleString() : "-"}</div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="col-span-full text-gray-500 text-sm">No markets yet. Connect your wallet and create one from the admin panel.</div>
          )}
        </div>
      </main>
    </div>
  );
}
