"use client";

import useSWR from "swr";
import SyncButton from "@/components/admin/SyncButton";

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
  salesHistory?: { month: string; sales: number }[];
  weeklyRevenue?: number[];
  customerBreakdown?: { label: string; value: number }[];
}

const fetcher = (url: string): Promise<AdminOverview> =>
  fetch(url).then((r) => r.json());

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
    </div>
  );
}

// Removed unused DonutChart and RecentOrders helper components — kept the admin page minimal.

export default function AdminDashboard() {
  const { data, error } = useSWR<AdminOverview>("/api/admin/overview", fetcher);

  if (error) return <div>Error loading analytics.</div>;
  if (!data) return <div>Loading...</div>;

  // derived values (kept minimal for now)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of markets, users and recent activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 border rounded text-sm">Create Market</button>
          <SyncButton />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Total Markets" value={data.totalMarkets} />
        <MetricCard label="Total Volume" value={`$${Number(data.totalVolume).toLocaleString()}`} />
        <MetricCard label="Resolved Markets" value={data.resolvedMarkets} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">Recent Markets</h2>
          <ul className="space-y-3">
            {data.recentMarkets && data.recentMarkets.length > 0 ? (
              data.recentMarkets.map((m) => (
                <li key={m.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-gray-400">Status: {m.status}</div>
                  </div>
                  <div className="text-sm text-gray-600">Pool: ${Number(m.total_pool || 0).toLocaleString()}</div>
                </li>
              ))
            ) : (
              <div className="text-sm text-gray-500">No recent markets.</div>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Quick Actions</h3>
            <div className="mt-3 flex flex-col gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">Create Market</button>
              <button className="px-4 py-2 border rounded">Sync Pools</button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
            <div className="mt-2 text-sm text-gray-500">No recent activity.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
