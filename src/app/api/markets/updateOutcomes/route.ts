import { NextResponse } from "next/server";
import { createPublicClient, getContract, http } from "viem";
import { sepolia } from "viem/chains";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import { CONTRACT_ADDRESS } from "@/lib/utils/constants";
import db from "@/lib/offchain/services/dbClient";

export async function GET() {
  try {
    const client = createPublicClient({ chain: sepolia, transport: http() });
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: (MarketABI as any).abi,
      client,
    });

  const markets = await db.market.findMany();

    for (const m of markets) {
  const pools = (await contract.read.getPools([BigInt(m.id)])) as unknown as bigint[];
      for (let i = 0; i < pools.length; i++) {
        await (db as any).marketOutcome.upsert({
          where: {
            market_id_outcome_index: {
              market_id: m.id,
              outcome_index: i,
            },
          },
          update: { total_staked: Number(pools[i]) / 1e18 },
            create: {
              market_id: m.id,
              outcome_index: i,
              label: (m as any).outcomes ? (m as any).outcomes[i] : `Outcome #${i + 1}`,
              total_staked: Number(pools[i]) / 1e18,
            },
        });
      }
    }

    return NextResponse.json({ success: true, updated: markets.length });
  } catch (error: any) {
    console.error("Outcome sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
