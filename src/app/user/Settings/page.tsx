"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useTheme } from "next-themes";

export default function UserSettingsPage() {
  const { address } = useAccount();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [marketAlerts, setMarketAlerts] = useState(true);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!address) return;
      setLoading(true);
      const res = await fetch(`/api/profile?wallet=${address}`);
      const data = await res.json();
  setEmail(data?.profile?.email || "");
  setEmailUpdates(Boolean(data?.profile?.emailUpdates));
  setMarketAlerts(Boolean(data?.profile?.marketAlerts ?? true));
      setLoading(false);
    })();
  }, [address]);

  async function save() {
    if (!address) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, email, emailUpdates, marketAlerts }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMsg("Saved");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-4 bg-white border rounded-xl p-4">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="flex items-center gap-2">
            <input id="emailUpdates" type="checkbox" checked={emailUpdates} onChange={(e) => setEmailUpdates(e.target.checked)} />
            <label htmlFor="emailUpdates" className="text-sm">Receive market updates by email</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="marketAlerts" type="checkbox" checked={marketAlerts} onChange={(e) => setMarketAlerts(e.target.checked)} />
            <label htmlFor="marketAlerts" className="text-sm">Betting updates and alerts</label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button className="px-4 py-2 rounded-md bg-blue-600 text-white" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</button>
            <button className="px-4 py-2 rounded-md border" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "Switch to light" : "Switch to dark"}</button>
            {msg && <span className="text-sm text-blue-600">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
