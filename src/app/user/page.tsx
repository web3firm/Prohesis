"use client";

import { useEffect, useMemo, useState } from "react";
import FiltersBar, { MarketFilter } from "@/components/ui/FiltersBar";
import { MarketCard } from "@/components/ui/MarketCard";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { createPublicClient, getContract, http, type Abi } from "viem";
import { sepolia } from "viem/chains";
import FactoryJSON from "@/lib/onchain/abis/MarketFactory.json";
import MarketJSON from "@/lib/onchain/abis/ProhesisPredictionMarket.json";

// ✅ Properly typed ABIs
const FactoryABI = FactoryJSON.abi as unknown as Abi;
const MarketABI = MarketJSON.abi as unknown as Abi;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const FACTORY = process.env.NEXT_PUBLIC_FACTORY_CONTRACT as `0x${string}`;

// ✅ Market summary type
type Summary = {
  address: `0x${string}`;
  question: string;
  endTime: number;
  totalYes: number;
  totalNo: number;
};

// ✅ Fetch all market addresses from Factory
async function fetchAllMarkets(): Promise<`0x${string}`[]> {
  const factory = getContract({
    address: FACTORY,
    abi: FactoryABI,
    client: publicClient,
  });

  const markets = (await factory.read.getAllMarkets({})) as `0x${string}`[];
  return markets ?? [];
}

// ✅ Read a single market summary
async function readSummary(addr: `0x${string}`): Promise<Summary | null> {
  try {
    const c = getContract({
      address: addr,
      abi: MarketABI,
      client: publicClient,
    });

    const [question, endTime, totalYes, totalNo] = await Promise.all([
      c.read.question({}),
      c.read.endTime({}),
      c.read.totalYes({}),
      c.read.totalNo({}),
    ]);

    return {
      address: addr,
      question: String(question),
      endTime: Number(endTime) * 1000,
      totalYes: Number(totalYes) / 1e18,
      totalNo: Number(totalNo) / 1e18,
    };
  } catch {
    return null;
  }
}

// ✅ Sorting helper
function sortByFilter(items: Summary[], filter: MarketFilter) {
  const copy = [...items];
  if (filter === "trending") {
    copy.sort((a, b) => b.totalYes + b.totalNo - (a.totalYes + a.totalNo));
  } else if (filter === "endingSoon") {
    copy.sort((a, b) => a.endTime - b.endTime);
  } else {
    copy.sort((a, b) => b.endTime - a.endTime);
  }
  return copy;
}

// ✅ Main component
export default function UserPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MarketFilter>("trending");
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<Summary[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const addrs = await fetchAllMarkets();
      const batch = await Promise.all(addrs.map((a) => readSummary(a)));
      const list = (batch.filter(Boolean) as Summary[]).filter((m) => m.endTime > 0);
      setMarkets(list);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const list = sortByFilter(markets, filter);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((m) => m.question.toLowerCase().includes(q));
  }, [markets, filter, search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/60 to-blue-100/80">
      {/* Filters */}
      <div className="sticky top-16 z-30 bg-gradient-to-b from-white/90 via-white/80 to-transparent backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <FiltersBar active={filter} setActive={setFilter} />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-20">No markets found.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <MarketCard
                key={m.address}
                market={{
                  id: m.address,
                  title: m.question,
                  endTime: m.endTime,
                  yesPool: m.totalYes,
                  noPool: m.totalNo,
                }}
                href={`/user/Markets/${m.address}`} // ✅ allowed if MarketCardProps includes href?: string
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
