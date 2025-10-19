"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AdminUserProfilePage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/profile?userId=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const json = await res.json();
        if (!ignore) setProfile(json);
      } catch (e: any) {
        if (!ignore) setError(e.message || "Failed to load profile");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (id) load();
    return () => { ignore = true };
  }, [id]);

  if (!id) return <div className="p-6">Invalid user id</div>;
  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!profile) return <div className="p-6">No profile found</div>;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
          {(profile.displayName?.[0] || profile.email?.[0] || profile.id?.slice?.(2,3) || 'U').toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{profile.displayName || profile.email || profile.id}</h1>
          {profile.email && <div className="text-gray-600 text-sm">{profile.email}</div>}
          {profile.id && profile.id.startsWith?.('0x') && <div className="text-gray-600 text-sm">Wallet: {profile.id}</div>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total staked</div>
          <div className="text-2xl font-semibold">{profile?.stats?.totalStaked ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total winnings</div>
          <div className="text-2xl font-semibold">{profile?.stats?.totalWinnings ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Win rate</div>
          <div className="text-2xl font-semibold">{profile?.stats?.winRate ?? 0}%</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-lg font-semibold mb-3">Recent bets</h2>
        {profile.bets?.length ? (
          <ul className="space-y-2">
            {profile.bets.slice(0, 10).map((b: any) => (
              <li key={b.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                <span>#{b.marketId} · {b.market?.title || 'Market'}</span>
                <span className="tabular-nums">{b.amount}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500 text-sm">No bets yet</div>
        )}
      </div>
    </div>
  );
}
