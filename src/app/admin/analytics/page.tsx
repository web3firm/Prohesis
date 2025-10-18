"use client";

export const dynamic = "force-dynamic";

import useSWR from "swr";
import { ChartCard } from "@/components/shared/ChartCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AnalyticsPage() {
  const { data, error } = useSWR("/api/admin/insights", fetcher);

  if (error) return <div className="p-6 text-red-600">Failed to load analytics</div>;
  if (!data) return <div className="p-6 text-gray-600">Loading analytics…</div>;

  const a = data.analytics || {};

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Stat label="Markets" value={a.totalMarkets ?? 0} />
  <Stat label="Users" value={a.totalUsers ?? 0} />
  <Stat label="Bets" value={a.totalBets ?? 0} />
  <Stat label="Volume" value={(a.totalVolume ?? 0).toFixed(2)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard
          title="Top Markets by Pool"
          labels={(a.topMarkets || []).map((m: any) => m.title)}
          data={(a.topMarkets || []).map((m: any) => m.totalPool)}
          color="#DB2777"
        />
        <ChartCard
          title="Recent Users (count)"
          labels={(data.stats?.recentUsers || []).map((u: any) => u.displayName || u.email || u.id)}
          data={(data.stats?.recentUsers || []).map(() => 1)}
          color="#F472B6"
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
      <p className="text-2xl font-semibold text-[#DB2777]">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
