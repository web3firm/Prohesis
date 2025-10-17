"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toaster";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  async function handleSync() {
    setLoading(true);
    addToast('Sync started...');
    try {
      const res = await fetch('/api/markets/sync-from-factory', { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      addToast('Sync complete');
    } catch (e: any) {
      addToast(`Sync failed: ${e.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleSync} className={`px-3 py-2 rounded ${loading ? 'opacity-60' : 'bg-blue-600 text-white'}`} disabled={loading}>
      {loading ? 'Syncing...' : 'Sync Now'}
    </button>
  );
}
