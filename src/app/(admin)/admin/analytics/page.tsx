"use client";

export const dynamic = "force-dynamic";

import useSWR from "swr";
import { useState } from "react";
import { 
  TrendingUp, Users, Store, DollarSign, Activity,
  BarChart3, Calendar, Download, RefreshCw
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { data, error, mutate, isLoading } = useSWR(
    `/api/admin/analytics/advanced?period=${period}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (error) return <div className="p-6 text-red-600">Failed to load analytics</div>;
  if (!data || isLoading) return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );

  const { timeSeries = [], topPerformers = {}, categories = {}, funnel = {} } = data;

  async function syncNow() {
    try {
      await fetch('/api/markets/sync-from-factory', { method: 'POST' });
      await mutate();
    } catch {}
  }

  const totalVolume = timeSeries.reduce((sum: number, d: any) => sum + Number(d.volume || 0), 0);
  const totalUsers = timeSeries.reduce((sum: number, d: any) => sum + Number(d.users || 0), 0);
  const totalMarkets = timeSeries.reduce((sum: number, d: any) => sum + Number(d.markets || 0), 0);
  const totalBets = timeSeries.reduce((sum: number, d: any) => sum + Number(d.bets || 0), 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDE4FF' }}>
      <div className="w-full py-8 px-6">
        <main className="rounded-3xl bg-[#F9F8FE] shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500">Comprehensive platform insights and metrics</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={syncNow}
                  className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl hover:bg-gray-50"
                >
                  <RefreshCw size={16} />
                  Sync
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#7E3AF2] text-white rounded-xl hover:bg-[#692ed9]">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>

            {/* Period selector */}
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '1y'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    period === p
                      ? 'bg-[#7E3AF2] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : p === '90d' ? 'Last 90 days' : 'Last year'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Main Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Volume"
                value={`${totalVolume.toFixed(2)} ETH`}
                icon={DollarSign}
                color="blue"
              />
              <MetricCard
                title="New Users"
                value={totalUsers}
                icon={Users}
                color="green"
              />
              <MetricCard
                title="New Markets"
                value={totalMarkets}
                icon={Store}
                color="purple"
              />
              <MetricCard
                title="Total Bets"
                value={totalBets}
                icon={Activity}
                color="orange"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Time Series Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Volume Over Time</h2>
                  <BarChart3 size={20} className="text-gray-400" />
                </div>
                <div className="h-64 flex items-end gap-2">
                  {timeSeries.slice(-10).map((d: any, i: number) => {
                    const maxVol = Math.max(...timeSeries.map((x: any) => x.volume || 0));
                    const height = maxVol > 0 ? (d.volume / maxVol) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-xs text-gray-500">{d.volume.toFixed(1)}</div>
                        <div
                          className="w-full bg-gradient-to-t from-[#7E3AF2] to-[#A78BFA] rounded-t"
                          style={{ height: `${height}%` }}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(d.date).getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Conversion Funnel</h2>
                  <TrendingUp size={20} className="text-gray-400" />
                </div>
                <div className="space-y-3">
                  <FunnelStep label="Visitors" value={funnel.visitors || 0} percentage={100} color="blue" />
                  <FunnelStep
                    label="Signups"
                    value={funnel.signups || 0}
                    percentage={funnel.visitors ? (funnel.signups / funnel.visitors) * 100 : 0}
                    color="green"
                  />
                  <FunnelStep
                    label="Bettors"
                    value={funnel.bettors || 0}
                    percentage={funnel.signups ? (funnel.bettors / funnel.signups) * 100 : 0}
                    color="purple"
                  />
                  <FunnelStep
                    label="Creators"
                    value={funnel.creators || 0}
                    percentage={funnel.bettors ? (funnel.creators / funnel.bettors) * 100 : 0}
                    color="orange"
                  />
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Top Markets */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Markets by Volume</h2>
                <div className="space-y-3">
                  {(topPerformers.marketsByVolume || []).slice(0, 5).map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EDE4FF] flex items-center justify-center text-sm font-semibold text-[#7E3AF2]">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{m.title}</div>
                          <div className="text-xs text-gray-500">{m._count?.bets || 0} bets</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#7E3AF2]">{m.totalVolume} ETH</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Users */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Users by Volume</h2>
                <div className="space-y-3">
                  {(topPerformers.usersByVolume || []).slice(0, 5).map((u: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EDE4FF] flex items-center justify-center text-sm font-semibold text-[#7E3AF2]">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {u.username || `${u.wallet?.slice(0, 6)}...${u.wallet?.slice(-4)}`}
                          </div>
                          <div className="text-xs text-gray-500">{u._count?.bets || 0} bets</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#7E3AF2]">{Number(u.volume || 0).toFixed(2)} ETH</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                {Object.entries(categories).map(([cat, count]: [string, any]) => (
                  <div key={cat} className="bg-gradient-to-br from-[#EDE4FF] to-[#F3F0FF] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-[#7E3AF2]">{count}</div>
                    <div className="text-sm text-gray-600 capitalize mt-1">{cat}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
    green: 'from-green-50 to-green-100 border-green-200 text-green-600',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium opacity-80">{title}</div>
        <Icon size={20} className="opacity-60" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function FunnelStep({ label, value, percentage, color }: { 
  label: string; 
  value: number; 
  percentage: number; 
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
    </div>
  );
}
