"use client";
export const dynamic = "force-dynamic";

import useSWR from "swr";
import { useState } from "react";
import { 
  Search, Users, Store, DollarSign, Activity, ArrowUp, ArrowDown,
  TrendingUp, ChevronRight
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TabType = 'overview' | 'users' | 'markets' | 'bets';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Fetch comprehensive dashboard data
  const { data: dashboardData, error: dashError } = useSWR("/api/admin/dashboard", fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
  });
  
  // Also fetch markets list for backwards compatibility
  const { data: marketsList } = useSWR("/api/markets/list", fetcher);

  if (dashError) return <div className="p-6 text-red-600">Error loading dashboard data.</div>;
  if (!dashboardData) return <div className="p-6 text-gray-600">Loading dashboard...</div>;

  const stats = dashboardData.stats || {};
  const total = stats.total || {};
  const today = stats.today || {};
  const growth = stats.growth || {};
  const recent = stats.recent || {};

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: TrendingUp },
    { id: 'users' as TabType, label: 'Recent Users', icon: Users },
    { id: 'markets' as TabType, label: 'Recent Markets', icon: Store },
    { id: 'bets' as TabType, label: 'Recent Bets', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#EDE4FF]">
      <div className="max-w-[1600px] mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor your platform&apos;s performance and activity</p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Header with Search */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7E3AF2]"
                placeholder="Search..."
              />
            </div>
          </div>

          <div className="p-6">{/* Metrics row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <MetricCard 
                label="Total Users" 
                value={total.users || 0} 
                icon={Users}
                trend={Number(growth.users) > 0 ? 'up' : 'down'}
                trendValue={`${growth.users}% this week`}
              />
              <MetricCard 
                label="Total Markets" 
                value={total.markets || 0} 
                icon={Store}
                trend={Number(growth.markets) > 0 ? 'up' : 'down'}
                trendValue={`${growth.markets}% this week`}
              />
              <MetricCard 
                label="Total Volume" 
                value={`${Number(total.volume || 0).toFixed(2)} ETH`} 
                icon={DollarSign}
              />
              <MetricCard 
                label="Total Bets" 
                value={total.bets || 0} 
                icon={Activity}
              />
              <MetricCard 
                label="Today&apos;s Volume" 
                value={`${Number(today.volume || 0).toFixed(2)} ETH`} 
                icon={TrendingUp}
              />
            </div>

            {/* Today&apos;s Activity */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 font-medium">New Users Today</div>
                    <div className="text-2xl font-bold text-blue-900 mt-1">{today.users || 0}</div>
                  </div>
                  <Users size={24} className="text-blue-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 font-medium">New Markets Today</div>
                    <div className="text-2xl font-bold text-green-900 mt-1">{today.markets || 0}</div>
                  </div>
                  <Store size={24} className="text-green-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-600 font-medium">Bets Today</div>
                    <div className="text-2xl font-bold text-purple-900 mt-1">{today.bets || 0}</div>
                  </div>
                  <Activity size={24} className="text-purple-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-600 font-medium">Volume Today</div>
                    <div className="text-2xl font-bold text-orange-900 mt-1">{Number(today.volume || 0).toFixed(2)} ETH</div>
                  </div>
                  <DollarSign size={24} className="text-orange-600" />
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                        activeTab === tab.id
                          ? 'border-[#7E3AF2] text-[#7E3AF2]'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Quick Stats */}
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div>
                        <div className="text-xs text-blue-600 font-medium">Avg Bet Size</div>
                        <div className="text-xl font-bold text-blue-900">
                          {total.bets > 0 ? (total.volume / total.bets).toFixed(3) : '0.000'} ETH
                        </div>
                      </div>
                      <DollarSign size={28} className="text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                      <div>
                        <div className="text-xs text-green-600 font-medium">Markets/User</div>
                        <div className="text-xl font-bold text-green-900">
                          {total.users > 0 ? (total.markets / total.users).toFixed(1) : '0.0'}
                        </div>
                      </div>
                      <Store size={28} className="text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <div>
                        <div className="text-xs text-purple-600 font-medium">Bets/Market</div>
                        <div className="text-xl font-bold text-purple-900">
                          {total.markets > 0 ? (total.bets / total.markets).toFixed(0) : '0'}
                        </div>
                      </div>
                      <Activity size={28} className="text-purple-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                      <div>
                        <div className="text-xs text-orange-600 font-medium">Platform Fee (1%)</div>
                        <div className="text-xl font-bold text-orange-900">
                          {(total.volume * 0.01).toFixed(3)} ETH
                        </div>
                      </div>
                      <TrendingUp size={28} className="text-orange-600" />
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SummaryCard
                        title="Top Market"
                        value={(marketsList?.[0]?.title || 'No markets yet').slice(0, 30) + '...'}
                        subtitle={`${Number((marketsList?.[0]?.yesPool || 0) + (marketsList?.[0]?.noPool || 0)).toFixed(2)} ETH pool`}
                      />
                      <SummaryCard
                        title="Active Users (24h)"
                        value={today.users || 0}
                        subtitle={`${total.users || 0} total users`}
                      />
                      <SummaryCard
                        title="Pending Resolutions"
                        value={stats.markets?.pending || 0}
                        subtitle="Markets awaiting resolution"
                      />
                      <SummaryCard
                        title="Total Revenue"
                        value={`${(total.volume * 0.01).toFixed(3)} ETH`}
                        subtitle="Platform fees collected"
                      />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'users' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                    <button 
                      onClick={() => window.location.href = '/admin/users'}
                      className="text-sm text-[#7E3AF2] hover:underline inline-flex items-center gap-1"
                    >
                      View All <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Wallet</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(recent.users || []).map((user: any) => (
                          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4 font-medium text-gray-900">
                              {user.username || 'Anonymous'}
                            </td>
                            <td className="py-4 px-4 text-gray-600">{user.email || '-'}</td>
                            <td className="py-4 px-4 font-mono text-xs text-gray-500">
                              {user.wallet ? `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}` : '-'}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'markets' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Markets</h3>
                    <button 
                      onClick={() => window.location.href = '/admin/markets'}
                      className="text-sm text-[#7E3AF2] hover:underline inline-flex items-center gap-1"
                    >
                      View All <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(recent.markets || []).map((m: any) => (
                      <div key={m.id} className="border border-gray-200 rounded-xl p-4 hover:border-[#7E3AF2] hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{m.title}</h4>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                            m.status === 'open' ? 'bg-green-100 text-green-700' : 
                            m.status === 'resolved' ? 'bg-gray-100 text-gray-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-xs text-gray-500">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm font-bold text-[#7E3AF2]">
                            {Number(m.yesPool + m.noPool || 0).toFixed(2)} ETH
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'bets' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Bets</h3>
                  </div>
                  <div className="space-y-3">
                    {(recent.bets || []).map((bet: any) => (
                      <div key={bet.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7E3AF2] to-[#A78BFA] flex items-center justify-center text-white font-bold">
                            {(bet.user?.username || bet.walletAddress)?.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">
                              {bet.user?.username || `${bet.walletAddress?.slice(0, 6)}...${bet.walletAddress?.slice(-4)}`}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {bet.market?.title || `Market #${bet.marketId}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {Number(bet.amount).toFixed(3)} ETH
                          </div>
                          <div className={`text-xs font-medium ${
                            bet.outcomeIndex === 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {bet.outcomeIndex === 0 ? 'YES' : 'NO'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend, trendValue }: { 
  label: string; 
  value: string | number;
  icon?: any;
  trend?: 'up' | 'down';
  trendValue?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500">{label}</div>
        {Icon && <Icon size={20} className="text-gray-400" />}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
      <div className="text-xs text-gray-600 font-medium mb-1">{title}</div>
      <div className="text-xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}
