import { NextResponse } from "next/server";
import { prisma } from "@/lib/offchain/services/dbClient";
import { createPublicClient, getContract, http } from "viem";
import { sepolia } from "viem/chains";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import { CONTRACT_ADDRESS } from "@/lib/utils/constants";

export async function GET() {
  try {
    const client = createPublicClient({ chain: sepolia, transport: http() });
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: MarketABI,
      client,
    });

    const markets = await prisma.markets.findMany();

    for (const m of markets) {
      const pools = await contract.read.getPools([BigInt(m.onchain_market_id)]);
      for (let i = 0; i < pools.length; i++) {
        await prisma.marketOutcomes.upsert({
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
            label: m.outcomes[i],
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
