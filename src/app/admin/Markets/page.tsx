"use client";


import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminMarketsPage() {

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
        setMarkets(data);
      } catch (e: any) {
        setError(e.message || "Failed to load markets");
        setMarkets([]);
      } finally {
        setLoading(false);
      }
    }
    loadMarkets();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto mt-12 space-y-10">
      <section className="card p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin: Markets</h1>
        <p className="text-gray-500">All on-chain markets (from DB)</p>
      </section>

      <section className="card p-8 space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">Markets List</h2>
        {error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : markets.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No markets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-500 text-sm">
                <tr>
                  <th className="py-2">ID</th>
                  <th>Title</th>
                  <th>End Time</th>
                  <th>Yes Pool</th>
                  <th>No Pool</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {markets.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="py-2">{m.id}</td>
                    <td>{m.title}</td>
                    <td>{m.endTime ? new Date(m.endTime).toLocaleString() : "-"}</td>
                    <td>{m.yesPool}</td>
                    <td>{m.noPool}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
