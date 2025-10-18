import db from "@/lib/offchain/services/dbClient";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

export const dynamic = "force-dynamic";

async function checkDb() {
  try {
    await db.$queryRaw`SELECT 1`;
    const latestMarket = await (db as any).market?.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } }).catch(() => null);
    return { ok: true, latestMarket };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

async function checkRpc() {
  try {
    const client = createPublicClient({ chain: sepolia, transport: http() });
    const block = await client.getBlockNumber();
    return { ok: true, block: Number(block) };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export default async function StatusPage() {
  const [dbStatus, rpcStatus] = await Promise.all([checkDb(), checkRpc()]);
  const factory = process.env.NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS || "Not set";

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">System Status</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border ${dbStatus.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <h2 className="font-semibold mb-1">Database</h2>
          {dbStatus.ok ? (
            <p className="text-green-800">Connected {dbStatus.latestMarket ? `(latest market #${dbStatus.latestMarket.id})` : ''}</p>
          ) : (
            <p className="text-red-800">Error: {dbStatus.error}</p>
          )}
        </div>
        <div className={`p-4 rounded-xl border ${rpcStatus.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <h2 className="font-semibold mb-1">RPC</h2>
          {rpcStatus.ok ? (
            <p className="text-green-800">OK (block {rpcStatus.block})</p>
          ) : (
            <p className="text-red-800">Error: {rpcStatus.error}</p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl border bg-white">
        <h2 className="font-semibold mb-2">Configuration</h2>
        <div className="text-sm text-gray-700">
          <div>Factory address: <code>{factory}</code></div>
          <div>Time: {new Date().toLocaleString()}</div>
        </div>
      </div>
    </main>
  );
}
