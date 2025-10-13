"use client";

import { cn } from "@/lib/utils/index";

export type MarketFilter = "trending" | "new" | "endingSoon";

export default function FiltersBar({
  active,
  setActive,
  className,
}: {
  active: MarketFilter;
  setActive: (f: MarketFilter) => void;
  className?: string;
}) {
  const base =
    "h-10 rounded-full px-4 flex items-center gap-2 border bg-white shadow-sm hover:shadow transition";
  const activeCls = "bg-blue-600 text-white border-blue-600 shadow-md";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        onClick={() => setActive("trending")}
        className={cn(base, active === "trending" && activeCls)}
      >
        <span>🔥</span> <span>Trending</span>
      </button>
      <button onClick={() => setActive("new")} className={cn(base, active === "new" && activeCls)}>
        <span>📰</span> <span>New</span>
      </button>
      <button
        onClick={() => setActive("endingSoon")}
        className={cn(base, active === "endingSoon" && activeCls)}
      >
        <span>⏳</span> <span>Ending&nbsp;Soon</span>
      </button>
    </div>
  );
}
