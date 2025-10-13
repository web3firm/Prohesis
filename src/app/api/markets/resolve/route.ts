import { NextResponse } from "next/server";
import { resolveMarket } from "@/lib/onchain/writeFunctions";
import { z } from "zod";

const resolveSchema = z.object({
  marketId: z.number().int().positive(),
  winningOutcome: z.number().int().nonnegative(),
  adminAddress: z.string().min(1),
  userId: z.union([z.number().int().nonnegative(), z.undefined()]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = resolveSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input", details: parseResult.error.issues }, { status: 400 });
    }
    const { marketId, winningOutcome, adminAddress, userId } = parseResult.data;

    const result = await resolveMarket({
      marketId,
      winningOutcome,
      adminAddress,
      userId: userId ?? 0,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Resolve market error:", error);
    return NextResponse.json({ error: error.message ?? "Unknown error" }, { status: 500 });
  }
}
