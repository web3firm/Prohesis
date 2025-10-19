"use client";
export const dynamic = "force-dynamic";

import useSWR from "swr";
import { Search, Bell, Layers, ChevronRight, MoreVertical, TrendingUp } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
  weeklyRevenue?: number[];
}

// Sidebar is provided by `src/app/(admin)/layout.tsx` — do not duplicate here.

function HeaderBar() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7E3AF2]"
          placeholder="Search"
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="grid place-items-center size-10 rounded-xl bg-gray-50 ring-1 ring-gray-200 hover:bg-gray-100">
          <Bell size={20} className="text-gray-600" />
        </button>
      </div>
    </header>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  // The backend exposes /api/admin/stats — fetch that and normalize to AdminOverview
  const { data: raw, error } = useSWR<any>("/api/admin/stats", fetcher);
  // Also fetch a lightweight markets list for right-side table & quick computations
  const { data: marketsList } = useSWR<any[]>("/api/markets/list", fetcher);
  const data: AdminOverview | undefined = raw
    ? {
        totalMarkets: raw.marketCount ?? 0,
        totalVolume: raw.totalFees ?? 0,
        totalBets: raw.betCount ?? 0,
        resolvedMarkets: 0,
        recentMarkets: (raw.recentMarkets ?? []).map((m: any) => ({ id: String(m.id), title: m.title, status: 'open', total_pool: 0 })),
        weeklyRevenue: raw.weeklyRevenue ?? [],
      }
    : undefined;


  if (error) return <div>Error loading analytics.</div>;
  if (!data) return <div>Loading...</div>;

  // Derived quick insights (stack numbers)
  const lowLiquidityCount = (marketsList || []).filter((m: any) => (m.yesPool + m.noPool) < 0.1).length;
  const closingSoonCount = (marketsList || []).filter((m: any) => m.endTime && m.endTime > Date.now() && (m.endTime - Date.now()) < 7 * 24 * 60 * 60 * 1000).length;

  return (
    <div className="min-h-screen bg-[#EDE4FF]">
      <div className="max-w-[1400px] mx-auto gap-6 py-6 px-4">
        <main className="rounded-3xl bg-[#F9F8FE] shadow-lg overflow-hidden">
          <HeaderBar />
          <div className="p-6">
            {/* Title + actions */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recent activity</h1>
                <p className="text-sm text-gray-500">Overview of markets, bets and quick insights.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-[#7E3AF2] text-white rounded-xl shadow-sm hover:bg-[#692ed9]">
                  Create Market
                </button>
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <MetricCard label="Total Markets" value={data.totalMarkets} />
              <MetricCard label="Total Volume" value={`$${Number(data.totalVolume).toLocaleString()}`} />
              <MetricCard label="Total Bets" value={data.totalBets} />
              <MetricCard label="Resolved Markets" value={data.resolvedMarkets} />
              <MetricCard label="Weekly Revenue" value={`$${data.weeklyRevenue?.[0] ?? 0}`} />
            </div>

            {/* Chart + categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">Sales</h2>
                  <button className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">View all <ChevronRight size={14} /></button>
                </div>
                <div className="h-48 grid place-items-center text-gray-400 text-sm border border-dashed border-gray-300 rounded-xl">
                  Chart Area
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-gray-500">
                  {['Confirmed','Packed','Refunded','Shipped'].map((t) => (
                    <div key={t} className="flex items-center gap-1 justify-center bg-gray-50 rounded-md py-1">
                      <TrendingUp size={12} className="text-[#7E3AF2]" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">Top Categories</h2>
                  <button className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">View all <ChevronRight size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square grid place-items-center rounded-xl bg-[#EDE4FF] text-[#7E3AF2]">
                      <Layers size={24} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: recent markets list + right column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">Recent Markets</h2>
                  <button className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">View all <ChevronRight size={14} /></button>
                </div>
                <ul className="space-y-3">
                  {data.recentMarkets && data.recentMarkets.length > 0 ? (
                    data.recentMarkets.map((m) => (
                      <li key={m.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div>
                          <div className="font-medium text-gray-800">{m.title}</div>
                          <div className="text-xs text-gray-400">Status: {m.status}</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Pool: ${Number(m.total_pool || 0).toLocaleString()}
                        </div>
                      </li>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No recent markets.</div>
                  )}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Stack numbers</h3>
                    <MoreVertical size={16} className="text-gray-400" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Low liquidity</div>
                      <div className="text-lg font-semibold">{lowLiquidityCount}</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Closing soon</div>
                      <div className="text-lg font-semibold">{closingSoonCount}</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Open markets</div>
                      <div className="text-lg font-semibold">{data.totalMarkets}</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Resolved</div>
                      <div className="text-lg font-semibold">{data.resolvedMarkets}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Markets list</h3>
                    <button className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">View all <ChevronRight size={14} /></button>
                  </div>
                  <div className="text-xs text-gray-500">{(marketsList || []).slice(0,6).length} items</div>
                  <ul className="mt-2 space-y-2">
                    {(marketsList || []).slice(0,6).map((m: any) => (
                      <li key={m.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-1">
                        <div className="truncate max-w-[60%]">{m.title}</div>
                        <div className="text-gray-500">{(m.yesPool + m.noPool).toFixed(2)} ETH</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
