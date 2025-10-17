export const dynamic = 'force-dynamic'

// MarketCard import not used in this server page; client component handles list rendering
import MarketListClient from '@/components/Markets/MarketListClient';
import db from "@/lib/offchain/services/dbClient";

export default async function UserPage() {
  // Server-side fetch from the database to avoid client-side hydration/fetch issues
  let rawMarkets: any[] = []
  try {
    rawMarkets = await db.market.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, endTime: true, totalPool: true, onchainAddr: true },
    })
  } catch (err: any) {
    // Log full error so it's visible in Vercel logs (helps debugging DB connection issues)
    console.error('Error fetching markets for /user page:', err && err.stack ? err.stack : err)
    // Render a friendly message in the UI and avoid throwing so the page can respond
    return (
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-center tracking-tight">Prediction Markets</h1>
        <div className="col-span-full text-center text-red-600 py-12">
          We were unable to load markets right now. The server encountered an error connecting to the database. Please try again later.
        </div>
      </main>
    )
  }

  // Avoid making on-chain RPC calls during server rendering — use the cached
  // `totalPool` field from the database to keep page loads fast. Pools can be
  // synced in the background via `api/markets/syncPools` when needed.
  type MarketSummary = { id: string; title: string; endTime: number; yesPool: number; noPool: number };
  const markets: MarketSummary[] = rawMarkets.map((m: any) => {
    const total = typeof m.totalPool === "number" ? m.totalPool : 0;
    const yesPool = total / 2;
    const noPool = total / 2;
    return {
      id: String(m.id),
      title: m.title ?? "Untitled",
      endTime: m.endTime ? new Date(m.endTime).getTime() : 0,
      yesPool,
      noPool,
    };
  });

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center tracking-tight">Prediction Markets</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {markets.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">No markets found.</div>
        ) : (
          // Server-rendered initial grid; client component will hydrate and refresh
          <MarketListClient initialData={markets} />
        )}
      </div>
    </main>
  );
}
