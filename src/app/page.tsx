"use client";
import useSWR from "swr";
import { MarketCard } from "@/components/ui/MarketCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MarketsHome() {
  const { data, isLoading, error } = useSWR<any[]>(`/api/markets/list?sort=trending`, fetcher);
  const markets = data || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EAF2FF" }}>
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Markets</h1>
          <div className="hidden md:block text-sm text-gray-500">{isLoading ? "…" : markets.length} items</div>
        </div>

        <div className="inline-flex bg-white rounded-xl border p-1 mb-6">
          {([
            { key: "trending", label: "Trending" },
            { key: "new", label: "New" },
            { key: "ending", label: "Ending Soon" },
          ] as const).map((t) => (
            <a
              key={t.key}
              href={`/?sort=${t.key}`}
              className={`px-3 py-1 rounded-md text-sm ${"trending" === t.key ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {t.label}
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="animate-pulse">
                  <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-48 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                  <div className="mt-4 h-2 w-full bg-gray-200 rounded" />
                  <div className="mt-2 flex justify-between">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="h-8 bg-gray-200 rounded" />
                    <div className="h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))
          )}
          {!isLoading && error && (
            <div className="col-span-full text-center text-red-500 py-12">Failed to load markets</div>
          )}
          {!isLoading && !error && markets.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-12">No markets found.</div>
          )}
          {!isLoading && !error && markets.map((market) => (
            <MarketCard key={market.id} market={market} href={`/markets/${market.id}`} />
          ))}
        </div>
      </main>
    </div>
  );
}

