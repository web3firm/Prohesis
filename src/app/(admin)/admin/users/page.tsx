"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

export default function UsersPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.success) setAdmins(json.list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addAdmin() {
    setMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined, wallet: wallet || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to add admin");
      setEmail("");
      setWallet("");
      await load();
      setMsg("Admin added");
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="text-sm text-gray-600">Admin access control: allow admins by email and/or wallet address.</p>

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Admin email</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Admin wallet (0x…)</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" placeholder="0x…" value={wallet} onChange={(e) => setWallet(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={addAdmin} className="px-4 py-2 rounded-md bg-[#7E3AF2] text-white">Add admin</button>
          {msg && <span className="text-sm text-blue-600">{msg}</span>}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-lg font-semibold mb-3">Admin Users</h2>
        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : admins.length === 0 ? (
          <div className="text-gray-500">No admins yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-500 text-sm">
                <tr>
                  <th className="py-2">ID</th>
                  <th>Email</th>
                  <th>Wallet</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {admins.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2">{a.id}</td>
                    <td>{a.email || "-"}</td>
                    <td>{a.wallet || "-"}</td>
                    <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
