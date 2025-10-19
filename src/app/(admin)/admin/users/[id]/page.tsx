import { redirect } from "next/navigation";
import getServerSession from "next-auth";
import { authOptions } from "@/lib/auth/options";
import db from "@/lib/offchain/services/dbClient";

function calcStats(user: any) {
  const totalWinnings = (user.payouts || []).reduce(
    (sum: number, p: { amount?: number | string }) => sum + Number(p.amount || 0),
    0
  );
  const totalStaked = (user.bets || []).reduce(
    (sum: number, b: { amount?: number | string }) => sum + Number(b.amount || 0),
    0
  );
  const winRate = (user.payouts?.length || 0) && (user.bets?.length || 0)
    ? ((user.payouts.length / user.bets.length) * 100).toFixed(2)
    : "0";
  return { totalWinnings, totalStaked, winRate };
}

export default async function AdminUserProfilePage(context: any) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).isAdmin) {
    redirect("/admin/auth/login");
  }
  // Normalize params (could be a Promise in Next 15 types)
  const rawParams = context?.params;
  const params = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams;
  const id = decodeURIComponent(params.id);
  // Allow lookup by wallet id or DB id or displayName
  let user = await db.user.findUnique({
    where: { id },
    include: { bets: { include: { market: true } }, payouts: true },
  });
  if (!user) {
    user = await db.user.findFirst({
      where: { OR: [{ id }, { displayName: id }, { email: id }] },
      include: { bets: { include: { market: true } }, payouts: true },
    });
  }
  if (!user) {
    return (
      <div className="p-6">User not found</div>
    );
  }
  const stats = calcStats(user);

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
          {(user.displayName?.[0] || user.email?.[0] || user.id?.slice?.(2,3) || 'U').toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{user.displayName || user.email || user.id}</h1>
          {user.email && <div className="text-gray-600 text-sm">{user.email}</div>}
          {user.id && user.id.startsWith?.('0x') && <div className="text-gray-600 text-sm">Wallet: {user.id}</div>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total staked</div>
          <div className="text-2xl font-semibold">{stats.totalStaked}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total winnings</div>
          <div className="text-2xl font-semibold">{stats.totalWinnings}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Win rate</div>
          <div className="text-2xl font-semibold">{stats.winRate}%</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-lg font-semibold mb-3">Recent bets</h2>
        {user.bets?.length ? (
          <ul className="space-y-2">
            {user.bets.slice(0, 10).map((b: any) => (
              <li key={b.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                <span>#{b.marketId} · {b.market?.title || 'Market'}</span>
                <span className="tabular-nums">{b.amount}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500 text-sm">No bets yet</div>
        )}
      </div>
    </div>
  );
}
