import { NextResponse } from "next/server";
import { resolveMarket } from "@/lib/onchain/writeFunctions";
import { z } from "zod";
import { jsonError } from '@/lib/api/errorResponse';

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
      return jsonError('Invalid input', 400, parseResult.error.issues);
    }
    const { marketId, winningOutcome } = parseResult.data;

    // server-signed resolve requires PRIVATE_KEY configured
  if (!process.env.PRIVATE_KEY) return jsonError('Server PRIVATE_KEY not configured', 500);

    const result = await resolveMarket({
      marketId,
      winningOutcome,
    });

    if (!result.success) {
      return jsonError(result.error ?? 'Resolve failed', 500);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Resolve market error:", error);
    return jsonError(error?.message ?? 'Unknown error', 500);
  }
}
