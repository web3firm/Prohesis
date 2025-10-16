"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toaster";

type Profile = {
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
};

export default function ProfilePage() {
  const { address } = useAccount();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({});

  useEffect(() => {
    if (!address) return;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/profile?wallet=${address}`);
      const data = await res.json();
      setProfile({
        displayName: data?.profile?.displayName ?? "",
        email: data?.profile?.email ?? "",
        avatarUrl: data?.profile?.avatarUrl ?? "",
        bannerUrl: data?.profile?.bannerUrl ?? "",
        bio: data?.profile?.bio ?? "",
      });
      setLoading(false);
    })();
  }, [address]);

  const onSave = async () => {
    if (!address) return;
    setSaving(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: address, ...profile }),
    });
    setSaving(false);
    addToast("Profile saved!", "success");
  };

  return (
    <div className="min-h-[80vh] w-full px-6 py-10 bg-gradient-to-b from-white via-blue-50 to-blue-100">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Profile</h1>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl border shadow-sm p-6 space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-600">
                Display Name
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profile.displayName ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder="e.g. Satoshi"
                />
              </label>
              <label className="text-sm text-gray-600">
                Email (for updates)
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profile.email ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                />
              </label>
              <label className="text-sm text-gray-600">
                Avatar URL
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profile.avatarUrl ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
                  placeholder="https://…"
                />
              </label>
              <label className="text-sm text-gray-600">
                Banner URL
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profile.bannerUrl ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, bannerUrl: e.target.value }))}
                  placeholder="https://…"
                />
              </label>
            </div>
            <label className="text-sm text-gray-600 block">
              Bio
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={profile.bio ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Short intro..."
              />
            </label>
            <div className="pt-2">
              <button
                onClick={onSave}
                disabled={saving}
                className="rounded-xl bg-blue-600 text-white px-5 py-2 shadow hover:shadow-md transition disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
