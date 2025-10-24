"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";

type MarketSummary = {
  id: string;
  title: string;
  endTime: number;
  yesPool: number;
  noPool: number;
  status?: "open" | "resolved" | "cancelled";
  syncedOnchain?: boolean;
  _source?: 'db' | 'factory' | string;
};

interface MarketCardProps {
  market: MarketSummary;
  href?: string;
}

export function MarketCard({ market, href }: MarketCardProps) {
  const end = new Date(market.endTime);
  const yes = Number(market.yesPool || 0);
  const no = Number(market.noPool || 0);
  const total = yes + no || 1;
  const yPct = (yes / total) * 100;
  const nPct = 100 - yPct;
  const timeUntilEnd = formatDistanceToNow(end, { addSuffix: true });
  
  const status = market.status ?? (Date.now() > end.getTime() ? "resolved" : "open");
  
  // Hide ended markets
  if (status !== "open") return null;

  return (
    <Link href={href ?? `/markets/${market.id}`}>
      <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 ease-in-out hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Animated gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                {market.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Ends {timeUntilEnd}</span>
              </div>
            </div>

            {/* Live Badge */}
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* Pool Distribution */}
          <div className="space-y-2.5 mb-5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-blue-600 dark:text-blue-400">Yes {yPct.toFixed(0)}%</span>
              <span className="text-gray-400 dark:text-gray-500 text-[10px] font-normal">
                {total.toFixed(4)} ETH
              </span>
              <span className="text-rose-600 dark:text-rose-400">No {nPct.toFixed(0)}%</span>
            </div>
            <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 transition-all duration-500 ease-out"
                style={{ width: `${yPct}%` }}
              />
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 transition-all duration-500 ease-out"
                style={{ width: `${nPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
              <span>{yes.toFixed(4)} ETH</span>
              <span>{no.toFixed(4)} ETH</span>
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-[1.02]">
            View & Bet →
          </button>
        </div>
      </div>
    </Link>
  );
}
