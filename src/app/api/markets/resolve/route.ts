import { NextResponse } from "next/server";
import { resolveMarket } from "@/lib/onchain/writeFunctions";
import { z } from "zod";

const resolveSchema = z.object({
  marketId: z.number().int().positive(),
  winningOutcome: z.number().int().nonnegative(),
  // server will resolve by marketId or marketAddress; no adminAddress/userId required here
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = resolveSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input", details: parseResult.error.issues }, { status: 400 });
    }
    const { marketId, winningOutcome } = parseResult.data;

    // server-signed resolve requires PRIVATE_KEY configured
    if (!process.env.PRIVATE_KEY) return NextResponse.json({ error: "Server PRIVATE_KEY not configured" }, { status: 500 });

    const result = await resolveMarket({
      marketId,
      winningOutcome,
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
