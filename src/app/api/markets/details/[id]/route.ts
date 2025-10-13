import { NextResponse } from "next/server";
import prisma from "@/lib/offchain/services/dbClient";
import { z } from "zod";

interface Params { params: { id: string } }

const idSchema = z.object({ id: z.string().regex(/^\d+$/) });

export async function GET(_: Request, { params }: Params) {
  try {
    const parseResult = idSchema.safeParse(params);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid id", details: parseResult.error.issues }, { status: 400 });
    }
    const id = Number(parseResult.data.id);
    const market = await prisma.markets.findUnique({
      where: { id },
      include: {
        MarketPools: true,
        MarketOutcomes: true,
      },
    });

    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
    return NextResponse.json(market);
  } catch (e: any) {
    console.error("Market details error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
