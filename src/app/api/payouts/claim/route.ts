import { NextResponse } from "next/server";
import { claimPayout } from "@/lib/onchain/writeFunctions";
import { z } from "zod";

const claimSchema = z.object({
  marketId: z.number().int().positive(),
  userId: z.union([z.number().int().nonnegative(), z.undefined()]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = claimSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input", details: parseResult.error.issues }, { status: 400 });
    }
    const { marketId, userId } = parseResult.data;

    const result = await claimPayout({
      marketId,
      userId: userId ?? 0,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Claim payout error:", error);
    return NextResponse.json({ error: error.message ?? "Unknown error" }, { status: 500 });
  }
}
