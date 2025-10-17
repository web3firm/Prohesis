import { NextResponse } from "next/server";
import { listFactoryMarkets } from "@/lib/onchain/readFunctions";
import { PrismaClient } from "@prisma/client";
import { getMarketContract } from "@/lib/onchain/readFunctions";
import { jsonError } from "@/lib/api/errorResponse";
import getServerSession from "next-auth";
import { authOptions } from "@/lib/auth/options";

const prisma = new PrismaClient();

async function fetchMarketDetails(addr: `0x${string}`) {
  const contract = getMarketContract(addr);
  const title = (await contract.read.title([] as any)) as string;
  const endTime = Number((await contract.read.endTime([] as any)) as bigint);
  const pools = (await contract.read.getPoolTotals([] as any)) as [bigint, bigint];
  const totalPool = Number(pools[0] + pools[1]) / 1e18;
  return { title, endTime, totalPool };
}

export async function POST(req: Request) {
  try {
    // Allow either a valid SYNC_TOKEN header or an authenticated admin session
    const token = req.headers.get("x-sync-token");
    if (process.env.SYNC_TOKEN && token === process.env.SYNC_TOKEN) {
      // allowed
    } else {
      const session = await getServerSession(authOptions as any);
      if (!session) return jsonError("Unauthorized", 401);
    }

    const addrs = await listFactoryMarkets();
    for (const addr of addrs) {
      try {
        const { title, endTime, totalPool } = await fetchMarketDetails(addr as `0x${string}`);
        await prisma.market.upsert({
          where: { onchainAddr: addr },
          update: { title, endTime: new Date(endTime * 1000), totalPool },
          create: { title, endTime: new Date(endTime * 1000), onchainAddr: addr, totalPool },
        });
      } catch (e: any) {
        console.warn("Failed to sync market", addr, e?.message ?? e);
      }
    }

    await prisma.$disconnect();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error("/api/markets/sync-from-factory error:", error);
    try { await prisma.$disconnect(); } catch {};
    return jsonError(error?.message ?? "Internal server error", 500);
  }
}
