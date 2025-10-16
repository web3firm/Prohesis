"use client";

import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle, Clock, Exclamation } from "./Icons";

type MarketSummary = {
  id: string;
  title: string;
  endTime: number;
  yesPool: number;
  noPool: number;
  status?: "open" | "resolved" | "cancelled";
  syncedOnchain?: boolean;
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

  const status = market.status ?? (Date.now() > end.getTime() ? "resolved" : "open");

  return (
    <div className="card p-4 md:p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm md:text-base">
            {market.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">Ends {format(end, "MMM d, yyyy")}</p>
        </div>

        <div className="flex flex-col items-end text-right">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}
            title={`Market status: ${status}`}
          >
            {status === "open" ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Resolved
              </span>
            )}
          </span>

          <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
            {market.syncedOnchain ? (
              <span className="inline-flex items-center text-green-600" title="Synced with on-chain state">
                <CheckCircle className="w-4 h-4" /> on-chain
              </span>
            ) : (
              <span className="inline-flex items-center text-yellow-600" title="Not yet synced with on-chain state">
                <Exclamation className="w-4 h-4" /> sync
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="bg-blue-500" style={{ width: `${yPct}%` }} />
          <div className="bg-red-400" style={{ width: `${nPct}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-blue-600 font-medium">Yes {yPct.toFixed(0)}%</span>
          <span className="text-red-500 font-medium">No {nPct.toFixed(0)}%</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={href ?? `/user/Markets/${market.id}`}
          className="btn-primary flex-1 text-sm text-center"
        >
          View Market →
        </Link>

        {status === "resolved" ? (
          <button className="btn-secondary disabled:opacity-50" disabled>
            Claim
          </button>
        ) : (
          <button className="btn-outline" onClick={() => window.location.href = (href ?? `/user/Markets/${market.id}`)}>
            Claim
          </button>
        )}
      </div>
    </div>
  );
}
