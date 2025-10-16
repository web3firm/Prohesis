import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPayout } from "@/lib/offchain/api/payouts";

const bodySchema = z.object({ onchainAddr: z.string().min(1), userWallet: z.string().min(1), amount: z.number().positive(), txHash: z.string().min(1) });

export async function POST(req: Request) {
  // Guard: never allow this route in production and require explicit ENABLE_DEV_API flag
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEV_API !== 'true') {
    return NextResponse.json({ error: 'Dev API disabled' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });

    const { onchainAddr, userWallet, amount, txHash } = parsed.data;
    const payout = await recordPayout({ onchainAddr, userWallet, amount, txHash });
    return NextResponse.json({ success: true, payout });
  } catch (e: any) {
    console.error('Dev record payout error', e);
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
