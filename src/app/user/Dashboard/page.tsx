import Link from "next/link";
import { prisma } from "@/lib/offchain/services/dbClient"
;

export const dynamic = "force-dynamic";

async function getData() {
  const [recentTx, recentMarkets] = await Promise.all([
    prisma.transactions.findMany({
      orderBy: { created_at: "desc" },
      take: 20,
    }),
    prisma.markets.findMany({
      orderBy: { created_at: "desc" },
      take: 6,
    }),
  ]);

  return { recentTx, recentMarkets };
}

export default async function DashboardPage() {
  const { recentTx, recentMarkets } = await getData();

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
        <Link
          href="/user/Markets"
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 font-semibold shadow"
        >
          Browse Markets
        </Link>
      </header>

      {/* Recent Markets */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Newest Markets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentMarkets.map((m: any) => (
            <Link
              key={m.id}
              href={`/user/Markets/${m.id}`}
              className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow hover:shadow-lg hover:border-blue-400 transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{m.title}</h3>
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${m.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {m.status}
                </span>
              </div>
              <p className="text-gray-600 mt-1 line-clamp-2">{m.question}</p>
              <div className="text-xs text-gray-500 mt-2">
                Outcomes: {Array.isArray(m.outcomes) ? m.outcomes.join(" / ") : "—"}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="rounded-2xl border-2 border-gray-100 bg-white overflow-x-auto shadow">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Time</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Tx Hash</th>
                <th className="text-left px-4 py-2">Wallet</th>
                <th className="text-left px-4 py-2">Block</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((t: any) => (
                <tr key={t.tx_hash} className="border-t hover:bg-blue-50/30 transition">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 capitalize whitespace-nowrap">{t.tx_type}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${t.status === "success" ? "bg-green-100 text-green-700" : t.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono">
                    {t.tx_hash?.slice(0, 8)}…{t.tx_hash?.slice(-6)}
                  </td>
                  <td className="px-4 py-2 font-mono">
                    {t.wallet_address?.slice(0, 6)}…{t.wallet_address?.slice(-4)}
                  </td>
                  <td className="px-4 py-2">{t.block_number ?? "—"}</td>
                </tr>
              ))}
              {recentTx.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No activity yet. Place a bet or create a market to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
