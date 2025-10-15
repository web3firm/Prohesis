import { NextResponse } from "next/server";
import { createPublicClient, http, getContract } from "viem";
import { sepolia } from "viem/chains";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import db from "@/lib/offchain/services/dbClient";
import { CONTRACT_ADDRESS } from "@/lib/utils/constants";

export async function GET() {
  try {
    const client = createPublicClient({ chain: sepolia, transport: http() });
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: (MarketABI as any).abi,
      client,
    });

    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      fromBlock: BigInt(0),
    });

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
