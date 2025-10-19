import db from "@/lib/offchain/services/dbClient";

export const dynamic = "force-dynamic";

async function getLatestLeaderboard() {
  const latest = await (db as any).leaderboard?.findFirst({ orderBy: { snapshot_date: "desc" }, select: { snapshot_date: true } }) ?? null;

  if (!latest?.snapshot_date) return { date: null, rows: [] as any[] };

  const rows = latest?.snapshot_date
    ? await (db as any).leaderboard.findMany({ where: { snapshot_date: latest.snapshot_date }, orderBy: [{ position: "asc" }], take: 100 })
    : [];

  return { date: latest.snapshot_date, rows };
}

export default async function LeaderboardPage() {
  const { date, rows } = await getLatestLeaderboard();

  return (
    <main className="max-w-4xl mx-auto p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Leaderboard</h1>
        <p className="text-gray-500">
          {date ? `Snapshot: ${new Date(date).toLocaleString()}` : "No snapshots yet"}
        </p>
      </header>

      <div className="rounded-2xl border-2 border-gray-100 bg-white overflow-x-auto shadow">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">User ID</th>
              <th className="text-left px-4 py-2">Total Winnings</th>
              <th className="text-left px-4 py-2">Total Staked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, idx: number) => (
              <tr key={`${r.snapshot_date}-${r.user_id}`} className={`border-t ${idx < 3 ? "bg-blue-50/40" : ""}`}>
                <td className="px-4 py-2 font-bold text-lg text-blue-700">{r.position}</td>
                <td className="px-4 py-2 font-mono">{r.user_id}</td>
                <td className="px-4 py-2 text-green-700 font-semibold">{Number(r.total_winnings).toLocaleString()}</td>
                <td className="px-4 py-2 text-blue-700">{Number(r.total_staked).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No leaderboard data available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
