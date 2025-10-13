"use client";

import { motion } from "framer-motion";
import useSWR from "swr";

// ✅ Define the expected structure of your API data
interface Market {
  id: string;
  title: string;
  status: string;
  total_pool: number;
}

interface AdminOverview {
  totalMarkets: number;
  totalVolume: number;
  totalBets: number;
  resolvedMarkets: number;
  recentMarkets: Market[];
}

// ✅ Type your fetcher
const fetcher = (url: string): Promise<AdminOverview> =>
  fetch(url).then((r) => r.json());

export default function AdminDashboard() {
  // ✅ Pass the type to useSWR
  const { data, error } = useSWR<AdminOverview>("/api/admin/overview", fetcher);

  if (error) return <div>Error loading analytics.</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { label: "Total Markets", value: data.totalMarkets },
          { label: "Total Volume", value: `${data.totalVolume} USDC` },
          { label: "Active Bets", value: data.totalBets },
          { label: "Resolved", value: data.resolvedMarkets },
        ].map((card) => (
          <div
            key={card.label}
            className="card p-6 text-center hover:scale-[1.01] transition"
          >
            <div className="text-white/60 text-sm mb-1">{card.label}</div>
            <div className="text-2xl font-semibold">{card.value}</div>
          </div>
        ))}
      </motion.div>

      {/* Recent Markets Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-xl font-semibold mb-3">Recent Markets</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-white/70">
              <tr>
                <th className="pb-2">ID</th>
                <th className="pb-2">Title</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Pool</th>
              </tr>
            </thead>
            <tbody>
              {data.recentMarkets.map((m: Market) => (
                <tr
                  key={m.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="py-2">{m.id}</td>
                  <td className="py-2">{m.title}</td>
                  <td className="py-2">{m.status}</td>
                  <td className="py-2 text-right">
                    {m.total_pool.toFixed(2)} USDC
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
