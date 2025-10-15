import { MarketCard } from "@/components/ui/MarketCard";
import db from "@/lib/offchain/services/dbClient";

export default async function UserPage() {
  // Server-side fetch from the database to avoid client-side hydration/fetch issues
  const rawMarkets = await db.market.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, endTime: true, totalPool: true, onchainAddr: true },
  });

  const markets = await Promise.all(
    rawMarkets.map(async (m: any) => {
      // If onchain address exists, try to fetch pools for more accurate splits.
      let yesPool = 0;
      let noPool = 0;
      try {
        if (m.onchainAddr) {
          const { getPoolsForMarket } = await import("@/lib/onchain/readFunctions");
          const pools = await getPoolsForMarket(m.onchainAddr as `0x${string}`);
          yesPool = pools?.[0] ?? 0;
          noPool = pools?.[1] ?? 0;
        } else if (typeof m.totalPool === "number") {
          // If only totalPool is known, naively split half/half for display
          yesPool = noPool = m.totalPool / 2;
        }
      } catch {
        yesPool = noPool = 0;
      }

      return {
        id: String(m.id),
        title: m.title ?? "Untitled",
        endTime: m.endTime ? new Date(m.endTime).getTime() : 0,
        yesPool,
        noPool,
      };
    })
  );

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center tracking-tight">Prediction Markets</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {markets.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">No markets found.</div>
        ) : (
          markets.map((market) => <MarketCard key={market.id} market={market} />)
        )}
      </div>
    </main>
  );
}
