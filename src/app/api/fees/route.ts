import { NextResponse } from "next/server";
import { prisma } from "@/lib/offchain/services/dbClient";
import { createPublicClient, http, getContract } from "viem";
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

    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: {
        type: "ProtocolFeeCollected",
        args: ["marketId", "amount", "collector"],
      },
      fromBlock: BigInt(0),
    });

    for (const log of logs) {
      const { marketId, amount, collector } = log.args;
      await prisma.fees.upsert({
        where: {
          market_id_fee_type: {
            market_id: Number(marketId),
            fee_type: "protocol_fee",
          },
        },
        update: {
          amount: Number(amount) / 1e18,
          collected_to: collector.toLowerCase(),
          created_at: new Date(),
        },
        create: {
          market_id: Number(marketId),
          fee_type: "protocol_fee",
          amount: Number(amount) / 1e18,
          collected_to: collector.toLowerCase(),
          tx_hash: log.transactionHash,
          created_at: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, count: logs.length });
  } catch (error: any) {
    console.error("Fee sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
