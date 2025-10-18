"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminMarketsPage() {

  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "pending" | "resolved">("active");
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Create market form state
  const [question, setQuestion] = useState("");
  const [outcomesText, setOutcomesText] = useState("Yes,No");
  const [endTime, setEndTime] = useState<string>(""); // datetime-local
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
      // sync DB from factory
      await fetch("/api/markets/sync-from-factory", { method: "POST" }).catch(() => {});
      // reload list
      const listRes = await fetch("/api/markets/list");
      const list = await listRes.json();
      setMarkets(Array.isArray(list) ? list : []);
      setCreateMsg("✅ Market created and synced.");
      // reset form
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
      if (outcomeStr === null) return; // cancelled
      const winningOutcome = Number(outcomeStr);
      if (!Number.isInteger(winningOutcome) || winningOutcome < 0) throw new Error("Invalid outcome index");

      const res = await fetch('/api/markets/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, winningOutcome }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || 'Resolve failed');

      // After resolve, refresh list
      const listRes = await fetch('/api/markets/list');
      const list = await listRes.json();
      setMarkets(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setResolveError(e?.message || String(e));
    } finally {
      setResolvingId(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto mt-12 space-y-10">
      {/* Create market */}
      <section className="card p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin: Create Market</h1>
        <p className="text-gray-500 mb-6">Create a new prediction market on-chain via the factory.</p>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Will ETH reach $5,000 by December 2025?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outcomes (comma separated)</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Yes,No"
              value={outcomesText}
              onChange={(e) => setOutcomesText(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Creator address (optional)</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="0x..."
              value={creatorAddress}
              onChange={(e) => setCreatorAddress(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ backgroundColor: "#1D4ED8" }}
              disabled={creating}
            >
              {creating ? "Creating…" : "Create market"}
            </button>
            {createMsg && <span className="text-sm text-gray-600">{createMsg}</span>}
          </div>
        </form>
      </section>

      <section className="card p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin: Markets</h1>
        <p className="text-gray-500">All on-chain markets (from DB)</p>
      </section>

      <section className="card p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Markets</h2>
          <div className="inline-flex bg-white rounded-lg border p-1">
            {(["active","pending","resolved"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${tab===t?"bg-blue-600 text-white":"text-gray-700 hover:bg-gray-50"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <button onClick={syncNow} className="ml-2 px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#1D4ED8' }}>Sync now</button>
        </div>

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
                  <th>Status</th>
                  <th>End Time</th>
                  <th>Yes Pool</th>
                  <th>No Pool</th>
                  {tab === 'pending' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {markets
                  .map((m) => ({
                    ...m,
                    _status:
                      (m.status === "resolved" || m.winningOutcome !== undefined)
                        ? "resolved"
                        : (m.endTime && Date.now() > Number(m.endTime))
                          ? "pending"
                          : "active",
                  }))
                  .filter((m) => m._status === tab)
                  .map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="py-2">{m.id}</td>
                      <td>{m.title}</td>
                      <td>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          m._status === "active"
                            ? "bg-green-100 text-green-700"
                            : m._status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-200 text-gray-700"
                        }`}>
                          {m._status}
                        </span>
                      </td>
                      <td>{m.endTime ? new Date(m.endTime).toLocaleString() : "-"}</td>
                      <td>{m.yesPool}</td>
                      <td>{m.noPool}</td>
                      {tab === 'pending' && (
                        <td>
                          <button
                            className="px-3 py-1 rounded-md text-white disabled:opacity-60"
                            style={{ backgroundColor: "#1D4ED8" }}
                            onClick={() => handleResolve(Number(m.id))}
                            disabled={resolvingId === Number(m.id)}
                          >
                            {resolvingId === Number(m.id) ? 'Resolving…' : 'Resolve'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
            {resolveError && <div className="text-red-600 text-sm mt-3">{resolveError}</div>}
          </div>
        )}
      </section>
    </div>
  );
}
