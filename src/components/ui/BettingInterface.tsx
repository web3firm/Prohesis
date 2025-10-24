"use client";

import { useState, useEffect } from "react";
import { useToast } from "./Toaster";

interface BettingInterfaceProps {
  outcomes: string[];
  pools: number[];
  odds: number[];
  onBet: (outcomeIndex: number, amount: string) => Promise<void>;
  isPending: boolean;
  isConfirming: boolean;
  isConnected: boolean;
  marketEnded: boolean;
  preselectedOutcome?: number;
}

export default function BettingInterface({
  outcomes,
  pools,
  odds,
  onBet,
  isPending,
  isConfirming,
  isConnected,
  marketEnded,
  preselectedOutcome,
}: BettingInterfaceProps) {
  const [amount, setAmount] = useState<string>("");
  const [selected, setSelected] = useState<number>(preselectedOutcome ?? 0);
  const { addToast } = useToast();

  // Preselect outcome from prop
  useEffect(() => {
    if (preselectedOutcome !== undefined) {
      setSelected(preselectedOutcome);
    }
  }, [preselectedOutcome]);

  const handleBet = async () => {
    if (!isConnected) {
      addToast("Connect your wallet first", "error");
      return;
    }
    const val = Number(amount);
    if (!val || val <= 0) {
      addToast("Enter a valid amount", "error");
      return;
    }
    if (val < 0.0001) {
      addToast("Minimum bet is 0.0001 ETH", "error");
      return;
    }

    await onBet(selected, amount);
  };

  const potentialReturn = () => {
    const stake = Number(amount) || 0;
    if (stake <= 0 || !odds[selected]) return "0.00";
    // Simple calculation: stake * (100 / odds) - this is an approximation
    const multiplier = 100 / Math.max(odds[selected], 1);
    return (stake * multiplier).toFixed(4);
  };

  return (
    <div className="space-y-6">
      {/* Outcome Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {outcomes.map((label, i) => {
          const active = selected === i;
          const color =
            i === 0
              ? "from-blue-600 to-blue-500"
              : "from-rose-500 to-rose-400";
          const bgActive = i === 0 ? "bg-blue-50 border-blue-300" : "bg-rose-50 border-rose-300";
          const pool = pools[i] ?? 0;

          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              disabled={marketEnded}
              className={`w-full text-left p-5 border-2 rounded-xl shadow-sm transition-all ${
                active
                  ? `${bgActive} ring-2 ring-offset-2 ${i === 0 ? "ring-blue-500" : "ring-rose-500"}`
                  : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
              } ${
                marketEnded ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Outcome
                  </div>
                  <div className="font-bold text-xl text-gray-900 mt-1">
                    {label}
                  </div>
                  <div className="text-xs text-gray-600 mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      💰 Pool: <span className="font-medium">{pool.toFixed(4)} ETH</span>
                    </span>
                  </div>
                </div>
                <div
                  className={`rounded-xl text-white px-4 py-3 bg-gradient-to-r ${color} shadow-md`}
                >
                  <div className="text-2xl font-bold">{odds[i]?.toFixed(1) ?? "0.0"}%</div>
                  <div className="text-[10px] opacity-90 uppercase tracking-wide">
                    Probability
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bet Input */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-gray-700">
            Your Stake
          </label>
          {amount && Number(amount) > 0 && (
            <div className="text-xs text-gray-500">
              Est. return: <span className="font-bold text-gray-900">{potentialReturn()} ETH</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              step="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="0.01"
              disabled={marketEnded}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
              ETH
            </div>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 mb-4">
          {([0.001, 0.01, 0.05, 0.1] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              disabled={marketEnded}
              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {v} ETH
            </button>
          ))}
        </div>

        {/* Bet Button */}
        <button
          onClick={handleBet}
          disabled={marketEnded || isPending || isConfirming || !amount || Number(amount) <= 0}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
        >
          {!isConnected
            ? "Connect Wallet to Bet"
            : isPending
            ? "⏳ Confirm in wallet…"
            : isConfirming
            ? "⌛ Waiting for confirmation…"
            : marketEnded
            ? "Market Ended"
            : `Place Bet on ${outcomes[selected]}`}
        </button>

        {/* Info */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>
            By placing a bet, you agree to the{" "}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
