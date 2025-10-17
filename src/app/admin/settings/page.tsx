"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    factoryAddress: "",
    feePercent: 1.0,
    serverSigned: false,
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (json.success) {
          setSettings((prev: any) => ({ ...prev, ...(json.settings || {}) }));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: settings }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");
      setMessage("Saved");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function manualSync() {
    setMessage(null);
    try {
      const res = await fetch("/api/markets/sync-from-factory", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      setMessage("Sync started");
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  if (loading) return <div className="p-6 text-gray-600">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {message && <div className="text-sm text-blue-600">{message}</div>}

      <div className="bg-white rounded-xl border p-4 space-y-4">
        <div>
          <label className="text-sm text-gray-600">Factory Address</label>
          <input
            className="mt-1 w-full border rounded-md px-3 py-2"
            value={settings.factoryAddress || ""}
            onChange={(e) => setSettings({ ...settings, factoryAddress: e.target.value })}
            placeholder="0x..."
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Fee Percent</label>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full border rounded-md px-3 py-2"
            value={settings.feePercent ?? 0}
            onChange={(e) => setSettings({ ...settings, feePercent: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="serverSigned"
            type="checkbox"
            checked={!!settings.serverSigned}
            onChange={(e) => setSettings({ ...settings, serverSigned: e.target.checked })}
          />
          <label htmlFor="serverSigned" className="text-sm text-gray-700">Enable server‑signed actions</label>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save} className="px-4 py-2 rounded-md bg-[#7E3AF2] text-white" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
          <button onClick={manualSync} className="px-4 py-2 rounded-md border">Manual Factory Sync</button>
        </div>
      </div>
    </div>
  );
}
