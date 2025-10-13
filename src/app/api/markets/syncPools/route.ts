import { NextResponse } from "next/server";
import prisma from "@/lib/offchain/services/dbClient"; // ✅ default export
import { createPublicClient, getContract, http, type Abi } from "viem";
import { sepolia } from "viem/chains";
import MarketJSON from "@/lib/onchain/abis/ProhesisPredictionMarket.json"; // ✅ JSON
// If you already created /src/lib/onchain/abis/index.ts with exports, you can instead:
// import { MarketABI } from "@/lib/onchain/abis";

const MarketABI = MarketJSON.abi as unknown as Abi; // ✅ typed ABI
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKET_CONTRACT as `0x${string}`; // ✅ from env

export async function GET() {
  try {
    if (!CONTRACT_ADDRESS) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_MARKET_CONTRACT not set" },
        { status: 500 }
      );
    }

    const client = createPublicClient({ chain: sepolia, transport: http() });
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: MarketABI,
      client,
    });

    // ⬇️ Pick the correct Prisma model name for your schema.
    // If your Prisma model is `model Market { ... }`, the client is `prisma.market`.
    // If you named it `model Markets { ... }`, then keep `prisma.markets`.
    const markets = await prisma.market.findMany(); // ← change to prisma.markets if your model is plural

    for (const m of markets) {
      // If your schema stores on-chain id differently, adjust here.
      // Example: assuming you have `onchainMarketId: Int` on Market:
      // const pools = await contract.read.getPools([BigInt(m.onchainMarketId)]);
      //
      // If you only store per-market contract address, use a per-market contract instead.

      // Placeholder if you indeed have an onchain numeric id:
      // @ts-expect-error update the field name to your actual column (e.g., m.onchainMarketId)
      const pools = await contract.read.getPools([BigInt(m.onchain_market_id)]);
      const total = pools.reduce((sum: bigint, x: bigint) => sum + x, 0n);

      // If you have a MarketPools model named `marketPools`, keep this.
      // If not, remove this block or adapt to your schema.
      await prisma.marketPools.upsert({
        where: { market_id: m.id },
        update: {
          total_pool: Number(total) / 1e18,
          last_updated: new Date(),
        },
        create: {
          market_id: m.id,
          total_pool: Number(total) / 1e18,
          last_updated: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, count: markets.length });
  } catch (e: any) {
    console.error("Pool sync error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
