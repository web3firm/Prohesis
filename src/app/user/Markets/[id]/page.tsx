// File: src/app/user/Markets/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import { getImpliedOddsFromPools, getOutcomes, getPools, CONTRACT_ADDRESS } from "@/lib/onchain/readFunctions";
import { recordBet } from "@/lib/offchain/api/bets";

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const marketId = Number(params.id);

  const { isConnected, address } = useAccount();
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [pools, setPools] = useState<number[]>([]);
  const odds = useMemo(() => getImpliedOddsFromPools(pools), [pools]);

  const [amount, setAmount] = useState<string>("");
  const [selected, setSelected] = useState<number>(0);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    (async () => {
      try {
        const o = await getOutcomes(marketId);
        setOutcomes(o.length ? o : ["Yes", "No"]); // fallback UI
        const p = await getPools(marketId);
        setPools(p);
      } catch (e) {
        setOutcomes(["Yes", "No"]);
        setPools([0, 0]);
      }
    })();
  }, [marketId, isConfirmed]);

  async function handleBet() {
    if (!isConnected) return alert("Connect your wallet first");
    const val = Number(amount);
    if (!val || val <= 0) return alert("Enter a valid amount");

    // 1) On-chain tx
    writeContract({
      abi: MarketABI as any,
      address: CONTRACT_ADDRESS,
      functionName: "placeBet", // assumes function signature (uint256 marketId, uint256 outcomeIndex)
      args: [BigInt(marketId), BigInt(selected)],
      value: parseEther(amount),
    });
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
          alert("✅ Bet recorded!");
        } catch (e: any) {
          alert(`❌ Failed to record bet: ${e.message}`);
        }
      }
    })();
  }, [isConfirmed, hash, address, marketId]);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center tracking-tight">Market #{marketId}</h1>

      {/* Outcomes with odds and pools */}
      <div className="mt-6 grid grid-cols-1 gap-4">
        {outcomes.map((label, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`w-full flex flex-col md:flex-row items-center justify-between p-4 border-2 rounded-xl shadow-sm transition-all ${
              selected === i ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="font-semibold text-lg text-gray-900">{label}</span>
              <span className="text-xs text-gray-500 mt-1">Pool: {pools[i] ? pools[i].toFixed(4) : "0.0000"} ETH</span>
            </div>
            <div className="flex flex-col items-end mt-2 md:mt-0">
              <span className="text-blue-600 font-bold text-xl">{odds[i] ? odds[i].toFixed(1) : "0.0"}%</span>
              <span className="text-xs text-gray-400">Implied Odds</span>
            </div>
          </button>
        ))}
      </div>

      {/* Bet form */}
      <div className="mt-8 bg-white rounded-xl shadow p-6">
        <label className="block text-sm font-medium mb-2">Stake (ETH)</label>
        <input
          type="number"
          min="0"
          step="0.0001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.01"
        />

        <button
          onClick={handleBet}
          disabled={isPending || isConfirming}
          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-lg transition-all shadow"
        >
          {isPending
            ? "Confirm in wallet…"
            : isConfirming
            ? "Waiting for confirmation…"
            : "Place Bet"}
        </button>

        {hash && (
          <p className="mt-3 text-xs text-gray-500 break-all text-center">
            tx: {hash}
          </p>
        )}
      </div>
    </main>
  );
}
