// File: src/app/user/Markets/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from '@/components/ui/Toaster';
import { useParams } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import { getImpliedOddsFromPools, getOutcomes, getPools, CONTRACT_ADDRESS, resolveMarketAddress } from "@/lib/onchain/readFunctions";
import { recordBet } from "@/lib/offchain/api/bets";
import DBGuard from '@/components/ui/DBGuard';

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const marketId = Number(params.id);

  const { isConnected, address } = useAccount();
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [pools, setPools] = useState<number[]>([]);
  const [fetchError, setFetchError] = useState<any>(null);
  const [isEligibleToClaim, setIsEligibleToClaim] = useState<boolean | null>(null);
  const { addToast } = useToast();
  const odds = useMemo(() => getImpliedOddsFromPools(pools), [pools]);
  const [endTime, setEndTime] = useState<number | null>(null);
  const marketEnded = endTime ? Date.now() >= endTime : false;

  const [amount, setAmount] = useState<string>("");
  const [selected, setSelected] = useState<number>(0);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Separate write hook for claim transactions so we can track them independently
  const { data: claimHash, writeContract: writeClaimContract, isPending: isClaimPending } = useWriteContract();
  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({ hash: claimHash });

  useEffect(() => {
    (async () => {
      try {
        setFetchError(null);
        const o = await getOutcomes(marketId);
        setOutcomes(o.length ? o : ["Yes", "No"]); // fallback UI
        const p = await getPools(marketId);
        setPools(p);
        // Fetch end time to disable betting after expiry
        try {
          const res = await fetch(`/api/markets/details/${marketId}`);
          if (res.ok) {
            const json = await res.json();
            if (json?.endTime) setEndTime(Number(json.endTime));
          }
        } catch {}
        // Check claim eligibility
        try {
          const res = await fetch('/api/payouts/validate?marketId=' + marketId + '&user=' + (address ?? ''));
          const data = await res.json();
          setIsEligibleToClaim(Boolean(data?.eligible));
        } catch {
          setIsEligibleToClaim(null);
        }
      } catch (e: any) {
        setFetchError(e);
        setOutcomes(["Yes", "No"]);
        setPools([0, 0]);
      }
    })();
  }, [marketId, isConfirmed, address]);

  // Periodically refresh eligibility (and refresh after claim confirmations)
  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch('/api/payouts/validate?marketId=' + marketId + '&user=' + (address ?? ''));
        const data = await res.json();
        if (mounted) setIsEligibleToClaim(Boolean(data?.eligible));
      } catch {
        if (mounted) setIsEligibleToClaim(null);
      }
    }
    // initial
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [marketId, address, isClaimConfirmed]);

  async function handleBet() {
  if (!isConnected) return addToast("Connect your wallet first", 'error');
    const val = Number(amount);
  if (!val || val <= 0) return addToast("Enter a valid amount", "error");

    // 1) On-chain tx
    writeContract({
      abi: MarketABI as any,
      address: CONTRACT_ADDRESS,
      functionName: "placeBet", // assumes function signature (uint256 marketId, uint256 outcomeIndex)
      args: [BigInt(marketId), BigInt(selected)],
      value: parseEther(amount),
    });
  }

  async function handleClaim() {
  if (!isConnected) return addToast("Connect your wallet first", 'error');

    try {
      const addr = await resolveMarketAddress(marketId);
  if (!addr) return addToast("Market on-chain address not found", 'error');

  // Double-check eligibility before sending tx
  if (isEligibleToClaim === false) return addToast('You are not eligible to claim for this market', 'error');

      // Call claimWinnings from the user's wallet
      writeClaimContract({
        abi: MarketABI as any,
        address: addr as `0x${string}`,
        functionName: "claimWinnings",
        args: [] as any,
      });
    } catch (e: any) {
      addToast(`Failed to initiate claim: ${e?.message ?? String(e)}`, 'error');
    }
  }

  // 2) After on-chain confirms, record off-chain
  useEffect(() => {
    (async () => {
          if (isConfirmed && hash && address) {
        try {
          await recordBet({ txHash: hash, userId: address }); // using wallet as user id in your schema
          // Reload pools to reflect new stake
          const p = await getPools(marketId);
          setPools(p);
          setAmount("");
          addToast("✅ Bet recorded!", 'success');
        } catch (e: any) {
          addToast(`❌ Failed to record bet: ${e.message}`, 'error');
        }
      }

      // Handle claim confirmation: after user's wallet claimWinnings tx confirms, POST to server to verify & record
      if (isClaimConfirmed && claimHash && address) {
        try {
          // Resolve on-chain address for this market
          const addr = await resolveMarketAddress(marketId);
          if (!addr) throw new Error("Market on-chain address not found");

          const res = await fetch("/api/payouts/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ txHash: claimHash, onchainAddr: addr, userId: address }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Unknown server error");

          // Refresh pools & UI
          const p = await getPools(marketId);
          setPools(p);
          addToast("✅ Claim recorded!", 'success');
        } catch (e: any) {
          addToast(`❌ Failed to record claim: ${e?.message ?? String(e)}`, 'error');
        }
      }
    })();
  }, [isConfirmed, hash, address, marketId, isClaimConfirmed, claimHash, addToast]);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <DBGuard error={fetchError} onRetry={async () => {
        setFetchError(null);
        try {
          const o = await getOutcomes(marketId);
          setOutcomes(o.length ? o : ["Yes", "No"]);
          const p = await getPools(marketId);
          setPools(p);
        } catch (e: any) {
          setFetchError(e);
        }
      }} />
      <div className="flex items-center justify-center gap-3">
        <h1 className="text-3xl font-bold mb-4 text-center tracking-tight">Market #{marketId}</h1>
        {isEligibleToClaim === true && (
          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-md">Eligible to claim</span>
        )}
        {isEligibleToClaim === false && (
          <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-md">No winnings</span>
        )}
      </div>

      {/* Outcomes with odds and pools */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {outcomes.map((label, i) => {
          const active = selected === i;
          const color = i === 0 ? 'from-green-600 to-green-500' : 'from-red-500 to-red-400';
          const bgActive = i === 0 ? 'bg-green-50' : 'bg-red-50';
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              disabled={marketEnded}
              className={`w-full text-left p-5 border-2 rounded-2xl shadow-sm transition-all ${active ? `border-transparent ${bgActive}` : 'border-gray-200 bg-white hover:bg-gray-50'} ${marketEnded ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500">Outcome</div>
                  <div className="font-semibold text-xl text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500 mt-1">Pool: {pools[i] ? pools[i].toFixed(4) : '0.0000'} ETH</div>
                </div>
                <div className={`rounded-xl text-white px-3 py-2 bg-gradient-to-r ${color}`}>
                  <div className="text-lg font-bold">{odds[i] ? odds[i].toFixed(1) : '0.0'}%</div>
                  <div className="text-[10px] opacity-90">Implied</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bet form */}
      <div className="mt-8 bg-white rounded-xl shadow p-6">
        <label className="block text-sm font-medium mb-2">Stake (ETH)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.0001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.01"
            disabled={marketEnded}
          />
          {([0.01, 0.05, 0.1] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              disabled={marketEnded}
              className="px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50"
            >
              {v} ETH
            </button>
          ))}
        </div>

        <button
          onClick={handleBet}
          disabled={marketEnded || isPending || isConfirming}
          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-lg transition-all shadow disabled:opacity-60"
        >
          {isPending
            ? "Confirm in wallet…"
            : isConfirming
            ? "Waiting for confirmation…"
            : "Place Bet"}
        </button>

        <button
          onClick={handleClaim}
          disabled={isClaimPending || isClaimConfirming || isEligibleToClaim === false}
          className={`mt-3 w-full border border-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 ${isEligibleToClaim === false ? 'bg-gray-50 text-gray-400' : 'bg-white text-gray-700'}`}
        >
          {isClaimPending
            ? "Confirm claim in wallet…"
            : isClaimConfirming
            ? "Waiting for claim confirmation…"
            : isEligibleToClaim === false
            ? "No winnings"
            : "Claim Winnings"}
        </button>

        {hash && (
          <p className="mt-3 text-xs text-gray-500 break-all text-center">
            tx: {hash}
          </p>
        )}

        {/* Toasts are rendered by global ToasterProvider */}
      </div>
    </main>
  );
}
