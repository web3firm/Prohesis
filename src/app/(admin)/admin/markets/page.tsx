"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  Search,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users
} from "lucide-react";

type MarketTabType = 'create' | 'pending' | 'resolved' | 'all';

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MarketTabType>("all");
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Create market form state
  const [question, setQuestion] = useState("");
  const [outcomesText, setOutcomesText] = useState("Yes,No");
  const [endTime, setEndTime] = useState<string>("");
  const [creatorAddress, setCreatorAddress] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

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

  useEffect(() => {
    loadMarkets();
  }, []);

  async function syncNow() {
    try {
      await fetch('/api/markets/sync-from-factory', { method: 'POST' });
    } catch {}
    await loadMarkets();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateMsg(null);
    if (!question.trim()) return setCreateMsg("Please enter a market question");
    if (!endTime) return setCreateMsg("Please choose an end time");
    const endMs = new Date(endTime).getTime();
    if (isNaN(endMs) || endMs <= Date.now()) return setCreateMsg("End time must be in the future");
    const outcomes = outcomesText.split(",").map((s) => s.trim()).filter(Boolean);
    if (outcomes.length < 2) return setCreateMsg("Please provide at least two outcomes (comma separated)");

    setCreating(true);
    try {
      const payload = {
        question,
        outcomes,
        endTime: endMs,
        creatorAddress: creatorAddress || "0x0000000000000000000000000000000000000000",
        userId: "admin",
      };
      const res = await fetch("/api/markets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || `Create failed (${res.status})`);
      }
      setCreateMsg("✅ Market created on-chain. Syncing...");
      await fetch("/api/markets/sync-from-factory", { method: "POST" }).catch(() => {});
      const listRes = await fetch("/api/markets/list");
      const list = await listRes.json();
      setMarkets(Array.isArray(list) ? list : []);
      setCreateMsg("✅ Market created and synced.");
      setQuestion("");
      setOutcomesText("Yes,No");
      setEndTime("");
      setCreatorAddress("");
    } catch (err: any) {
      setCreateMsg(`❌ ${err?.message || String(err)}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleResolve(marketId: number) {
    setResolveError(null);
    setResolvingId(marketId);
    try {
      const outcomeStr = window.prompt("Enter winning outcome index (e.g., 0 for Yes, 1 for No):", "0");
      if (outcomeStr === null) return;
      const winningOutcome = Number(outcomeStr);
      if (!Number.isInteger(winningOutcome) || winningOutcome < 0) throw new Error("Invalid outcome index");

      const res = await fetch('/api/markets/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, winningOutcome }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || 'Resolve failed');

      const listRes = await fetch('/api/markets/list');
      const list = await listRes.json();
      setMarkets(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setResolveError(e?.message || String(e));
    } finally {
      setResolvingId(null);
    }
  }

  const tabs = [
    { id: 'all', label: 'All Markets', icon: TrendingUp },
    { id: 'create', label: 'Create Market', icon: Plus },
    { id: 'pending', label: 'Pending Resolution', icon: Clock },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle },
  ];

  // Calculate market stats
  const enrichedMarkets = markets.map((m) => ({
    ...m,
    _status:
      (m.status === "resolved" || m.winningOutcome !== undefined)
        ? "resolved"
        : (m.endTime && Date.now() > Number(m.endTime))
          ? "pending"
          : "active",
  }));

  const filteredMarkets = enrichedMarkets
    .filter((m) => {
      if (activeTab === 'create') return false;
      if (activeTab === 'pending') return m._status === 'pending';
      if (activeTab === 'resolved') return m._status === 'resolved';
      return true; // all
    })
    .filter((m) => 
      searchTerm === '' || 
      m.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const stats = {
    total: enrichedMarkets.length,
    active: enrichedMarkets.filter(m => m._status === 'active').length,
    pending: enrichedMarkets.filter(m => m._status === 'pending').length,
    resolved: enrichedMarkets.filter(m => m._status === 'resolved').length,
    totalVolume: enrichedMarkets.reduce((sum, m) => sum + Number(m.yesPool || 0) + Number(m.noPool || 0), 0),
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDE4FF' }}>
      <div className="w-full py-8 px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Markets Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create, monitor, and resolve prediction markets</p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Header with Search and Sync */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
            <div className="relative w-full max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E3AF2] focus:border-transparent"
              />
            </div>
            <button 
              onClick={syncNow}
              className="flex items-center gap-2 px-4 py-2 bg-[#7E3AF2] text-white rounded-lg hover:bg-[#6C2BD9] transition text-sm font-medium"
            >
              <RefreshCw size={16} />
              Sync Now
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-500 font-medium">Total Markets</div>
                <TrendingUp size={16} className="text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-green-700 font-medium">Active</div>
              </div>
              <div className="text-2xl font-bold text-green-900">{stats.active}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-yellow-700 font-medium">Pending</div>
                <Clock size={16} className="text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-600 font-medium">Resolved</div>
                <CheckCircle size={16} className="text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.resolved}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-purple-700 font-medium">Total Volume</div>
                <DollarSign size={16} className="text-purple-600" />
              </div>
              <div className="text-xl font-bold text-purple-900">{stats.totalVolume.toFixed(2)} ETH</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 px-6 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as MarketTabType)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#7E3AF2] text-[#7E3AF2] font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm">{tab.label}</span>
                  {tab.id === 'pending' && stats.pending > 0 && (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {stats.pending}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'create' && (
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Market</h2>
                  <p className="text-sm text-gray-600">Deploy a new prediction market on-chain via the factory contract</p>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Market Question</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7E3AF2] focus:border-transparent"
                      placeholder="Will ETH reach $5,000 by December 2025?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Outcomes (comma separated)</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7E3AF2] focus:border-transparent"
                        placeholder="Yes,No"
                        value={outcomesText}
                        onChange={(e) => setOutcomesText(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7E3AF2] focus:border-transparent"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Creator Address (optional)</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7E3AF2] focus:border-transparent"
                      placeholder="0x..."
                      value={creatorAddress}
                      onChange={(e) => setCreatorAddress(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-3 bg-[#7E3AF2] text-white rounded-lg hover:bg-[#6C2BD9] transition font-medium disabled:opacity-60"
                      disabled={creating}
                    >
                      <Plus size={18} />
                      {creating ? "Creating Market..." : "Create Market"}
                    </button>
                    {createMsg && (
                      <span className={`text-sm font-medium ${createMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                        {createMsg}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeTab !== 'create' && (
              <div>
                {error ? (
                  <div className="text-center py-12">
                    <div className="text-red-500 font-medium">{error}</div>
                  </div>
                ) : filteredMarkets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500">No markets found{searchTerm ? ' matching your search' : ''}.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMarkets.map((m) => (
                      <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#7E3AF2] hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{m.title}</h3>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              m._status === 'active' ? 'bg-green-100 text-green-700' : 
                              m._status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {m._status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Market ID</span>
                            <span className="font-mono font-medium text-gray-900">#{m.id}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Total Pool</span>
                            <span className="font-bold text-[#7E3AF2]">
                              {(Number(m.yesPool || 0) + Number(m.noPool || 0)).toFixed(4)} ETH
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">End Time</span>
                            <span className="font-medium text-gray-700">
                              {m.endTime ? new Date(m.endTime).toLocaleDateString() : '-'}
                            </span>
                          </div>
                        </div>
                        {activeTab === 'pending' && (
                          <button
                            className="w-full px-4 py-2 bg-[#7E3AF2] text-white rounded-lg hover:bg-[#6C2BD9] transition text-sm font-medium disabled:opacity-60"
                            onClick={() => handleResolve(Number(m.id))}
                            disabled={resolvingId === Number(m.id)}
                          >
                            {resolvingId === Number(m.id) ? 'Resolving...' : 'Resolve Market'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {resolveError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {resolveError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
