import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import db from "@/lib/offchain/services/dbClient";
import { jsonError } from '@/lib/api/errorResponse';

export async function GET() {
  try {
  const client = createPublicClient({ chain: sepolia, transport: http() });
  void client; // client used only for fetching logs below

    // If you need to sync fees, specify a contract or range; no-op by default for multi-contract setup.
    const logs: any[] = [];

    for (const log of logs) {
      const args: any = (log as any).args ?? {};
      const marketId = args.marketId ?? args[0];
      const amount = args.amount ?? args[1];
      const collector = args.collector ?? args[2];
      try {
        await db.fee.upsert({
          where: {
            id: Number(marketId) || 0,
          },
          update: {
            amount: Number(amount) / 1e18,
            collectedTo: (collector ?? "").toLowerCase(),
          },
          create: {
            amount: Number(amount) / 1e18,
            collectedTo: (collector ?? "").toLowerCase(),
            txHash: log.transactionHash as string,
          },
        });
      } catch (e) {
        console.warn("fee upsert failed", e);
      }
    }

    return NextResponse.json({ success: true, count: logs.length });
  } catch (error: any) {
    console.error("Fee sync error:", error);
    return jsonError(error?.message ?? 'Internal server error', 500);
  }
}
