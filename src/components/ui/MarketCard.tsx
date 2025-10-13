"use client";

import Link from "next/link";
import { format } from "date-fns";


type MarketSummary = {
  id: string;
  title: string;
  endTime: number;
  yesPool: number;
  noPool: number;
};
// ✅ unified props type
interface MarketCardProps {
  market: {
    id: string;
    title: string;
    endTime: number;
    yesPool: number;
    noPool: number;
  };
  href?: string; // optional custom link
}

export function MarketCard({ market, href }: MarketCardProps) {
  const end = new Date(market.endTime);
  const yes = Number(market.yesPool);
  const no = Number(market.noPool);
  const total = yes + no || 1;
  const yPct = (yes / total) * 100;
  const nPct = 100 - yPct;

  return (
    <div className="card p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all">
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {market.title}
        </h3>
        <p className="text-sm text-gray-500">
          Ends {format(end, "MMM d, yyyy")}
        </p>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="bg-blue-500" style={{ width: `${yPct}%` }} />
          <div className="bg-red-400" style={{ width: `${nPct}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-blue-600 font-medium">
            Yes {yPct.toFixed(0)}%
          </span>
          <span className="text-red-500 font-medium">
            No {nPct.toFixed(0)}%
          </span>
        </div>
      </div>

      <Link
        href={href ?? `/user/Markets/${market.id}`}
        className="btn-primary w-full mt-4 text-sm text-center"
      >
        View Market →
      </Link>
    </div>
  );
}
