"use client";
import { useState, useMemo, Suspense } from "react";
import useSWR from "swr";
import { MarketCard } from "@/components/ui/MarketCard";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useSearchParams } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type SortType = "trending" | "new" | "ending";

function MarketsContent() {
  const [activeTab, setActiveTab] = useState<SortType>("trending");
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('search') || '';
  const searchFilter = searchParams?.get('filter') || 'all';
  
  const { data, isLoading, error } = useSWR<any[]>(`/api/markets/list`, fetcher, {
    refreshInterval: 10000, // Reduced to 10s for more real-time updates
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  
  const markets = useMemo(() => {
    if (!data) return [];
    
    let filtered = data;

    // Apply search filter from navbar
    if (searchFilter === 'active') {
      filtered = filtered.filter(m => {
        const status = m.status ?? (Date.now() > Number(m.endTime) ? "resolved" : "open");
        return status === "open";
      });
    } else if (searchFilter === 'ended') {
      filtered = filtered.filter(m => {
        const status = m.status ?? (Date.now() > Number(m.endTime) ? "resolved" : "open");
        return status === "resolved";
      });
    } else {
      // Default: filter out ended markets on home page (unless searching)
      if (!searchQuery) {
        filtered = filtered.filter(m => {
          const status = m.status ?? (Date.now() > Number(m.endTime) ? "resolved" : "open");
          return status === "open";
        });
      }
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.title?.toLowerCase().includes(query) || 
        m.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort based on active tab
    if (activeTab === "new") {
      return filtered.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (activeTab === "ending") {
      return filtered.sort((a, b) => Number(a.endTime) - Number(b.endTime));
    }
    
    // Default: trending (by total pool)
    return filtered.sort((a, b) => {
      const aTotal = (Number(a.yesPool) || 0) + (Number(a.noPool) || 0);
      const bTotal = (Number(b.yesPool) || 0) + (Number(b.noPool) || 0);
      return bTotal - aTotal;
    });
  }, [data, activeTab, searchQuery, searchFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Search results for &ldquo;{searchQuery}&rdquo;
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found {markets.length} {searchFilter !== 'all' ? searchFilter : ''} market{markets.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-lg border border-gray-200 dark:border-gray-700">
            {([
              { key: "trending", label: "🔥 Trending", icon: "🔥" },
              { key: "new", label: "✨ New", icon: "✨" },
              { key: "ending", label: "⏰ Ending Soon", icon: "⏰" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white shadow-md transform scale-105"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <div className="text-center mb-6 text-sm text-gray-500 dark:text-gray-400">
            {markets.length} {markets.length === 1 ? "market" : "markets"}
          </div>
        )}

        {/* Markets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading && (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          )}
          
          {!isLoading && error && (
            <div className="col-span-full text-center py-20">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="text-6xl">⚠️</div>
                <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Failed to load markets</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {!isLoading && !error && markets.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="text-6xl">📊</div>
                <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">No active markets</p>
              </div>
            </div>
          )}
          
          {!isLoading && !error && markets.map((market) => (
            <MarketCard key={market.id} market={market} href={`/markets/${market.id}`} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function MarketsHome() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </main>
      </div>
    }>
      <MarketsContent />
    </Suspense>
  );
}
