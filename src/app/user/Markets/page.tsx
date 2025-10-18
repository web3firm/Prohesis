"use client";


import { useEffect, useState } from "react";
import { MarketCard } from "@/components/ui/MarketCard";

export default function MarketsPage() {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarkets() {
      setLoading(true);
      setError(null);
      try {
  const res = await fetch("/api/markets/list");
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Malformed API response");
        }
        // If DB returned nothing, fallback to reading directly from the factory
        if (data.length === 0) {
          try {
            const res2 = await fetch("/api/markets/from-factory");
            if (res2.ok) {
              const fromFactory = await res2.json();
              // Annotate source so UI can show where it came from
              setMarkets(fromFactory.map((m: any) => ({ ...m, _source: 'factory' })));
            } else {
              setMarkets([]);
            }
          } catch {
            setMarkets([]);
          }
        } else {
          setMarkets(data.map((m: any) => ({ ...m, _source: 'db' })));
        }
      } catch (e: any) {
        setError(e.message || "Failed to load markets");
        setMarkets([]);
      } finally {
        setLoading(false);
      }
    }
    loadMarkets();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center tracking-tight">Prediction Markets</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-48" />
          ))
        ) : error ? (
          <div className="col-span-full text-center text-red-500 py-12">{error}</div>
        ) : markets.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">No markets found.</div>
        ) : (
          markets.map((market) => (
            <MarketCard key={market.id ?? market.address} market={market} />
          ))
        )}
      </div>
    </main>
  );
}
