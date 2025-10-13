"use client";

import { useEffect, useState } from "react";
import { getAnalytics } from "@/lib/offchain/services/analyticsService";
import {ChartCard} from "@/components/shared/ChartCard";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-gray-600">Loading analytics…</div>;
  if (!data) return <div className="p-8 text-gray-600">No analytics data.</div>;

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">
        Platform Analytics
      </h1>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Markets" value={data.totalMarkets} />
        <Stat label="Users" value={data.totalUsers} />
        <Stat label="Bets" value={data.totalBets} />
        <Stat label="Volume" value={`${Number(data.totalVolume).toFixed(2)} ETH`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <ChartCard
          title="Top 5 Markets"
          labels={data.topMarkets.map((m: any) => m.title)}
          data={data.topMarkets.map((m: any) => m.total_pool)}
          color="#2563eb"
        />
        <ChartCard
          title="Top Users (by winnings)"
          labels={data.topUsers.map((u: any) => u.Users.username)}
          data={data.topUsers.map((u: any) => u.total_winnings)}
          color="#10b981"
        />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
      <p className="text-2xl font-semibold text-blue-600">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
