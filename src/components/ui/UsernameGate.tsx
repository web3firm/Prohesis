"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useEnsName, useEnsAvatar } from "wagmi";
import { usePathname } from "next/navigation";
import { useToast } from "@/components/ui/Toaster";

export default function UsernameGate() {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address: address as any, chainId: 1 } as any);
  const { data: ensAvatar } = useEnsAvatar({ name: ensName as any, chainId: 1 } as any);
  const pathname = usePathname();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [username, setUsername] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);

  const shouldGate = useMemo(() => {
    if (!isConnected || !address) return false;
    // Don't gate on admin or api routes
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/api")) return false;
    return true;
  }, [isConnected, address, pathname]);

  useEffect(() => {
    if (!shouldGate) return;
    (async () => {
      try {
        setChecking(true);
        // If already completed once for this wallet on this device, do not prompt again
        if (typeof window !== 'undefined' && address && window.localStorage.getItem(`usernameClaimed:${address}`) === '1') {
          setOpen(false);
          return;
        }
        // Try to fetch profile; if not exists or no username, open modal
        const res = await fetch(`/api/profile?wallet=${address}`);
        const data = await res.json();
        const uname = data?.profile?.username || data?.profile?.displayName || null;
        if (!uname) {
          // Auto-assign immediately for fastest UX
          const res2 = await fetch('/api/usernames', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet: address, ensName, ensAvatar }),
          });
          if (res2.ok) {
            try { if (typeof window !== 'undefined' && address) window.localStorage.setItem(`usernameClaimed:${address}`, '1'); } catch {}
            setOpen(false);
            return;
          }
          // If auto-assign fails, fall back to asking user once
          let prefill = "";
          const sanitizedEns = (ensName || "").toString().toLowerCase().replace(/[^a-z0-9_]/g, "");
          if (sanitizedEns.length >= 3) prefill = sanitizedEns.slice(0, 30);
          else if (address) prefill = address.slice(2, 8).toLowerCase();
          setUsername(prefill);
          setOpen(true);
        }
      } catch {
        setOpen(true);
      } finally {
        setChecking(false);
      }
    })();
  }, [shouldGate, address, ensName, ensAvatar]);

  const checkAvailability = async (val: string) => {
    if (!val) return setAvailable(null);
    const res = await fetch(`/api/usernames?username=${encodeURIComponent(val)}`);
    const data = await res.json();
    setAvailable(Boolean(data?.available));
  };

  const onClaim = async () => {
    if (!address) return;
    const res = await fetch("/api/usernames", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        username
          ? { wallet: address, username, ensName, ensAvatar }
          : { wallet: address, ensName, ensAvatar }
      ),
    });
    const data = await res.json();
    if (!res.ok) {
      addToast(data?.error || "Failed to claim username", "error");
      await checkAvailability(username);
      return;
    }
    addToast("Username saved!", "success");
    setOpen(false);
    try { if (typeof window !== 'undefined' && address) window.localStorage.setItem(`usernameClaimed:${address}`, '1'); } catch {}
  };

  if (!shouldGate || checking || !open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-semibold mb-2">Pick your username</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This will be your public profile at <strong>u/[username]</strong>. You can change it later.</p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. satoshi"
            value={username}
            onChange={(e) => {
              const v = e.target.value.replace(/[^a-z0-9_]/gi, "").slice(0, 30);
              setUsername(v);
              setAvailable(null);
            }}
            onBlur={() => checkAvailability(username)}
          />
          <button onClick={onClaim} className="rounded-lg bg-blue-600 text-white px-4 py-2">Save</button>
          <button
            type="button"
            className="rounded-lg border px-4 py-2"
            onClick={onClaim}
            title="Skip for now"
          >
            Skip
          </button>
        </div>
        {available === true && (
          <div className="text-xs text-green-600 mt-2">Username available</div>
        )}
        {available === false && (
          <div className="text-xs text-red-600 mt-2">That username is taken</div>
        )}
      </div>
    </div>
  );
}
