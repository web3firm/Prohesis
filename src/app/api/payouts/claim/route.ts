import { NextResponse } from "next/server";
import { verifyClaimTx } from "@/lib/onchain/writeFunctions";
import { recordPayout } from "@/lib/offchain/api/payouts";
import { z } from "zod";
import { jsonError } from '@/lib/api/errorResponse';

// Expect client to call contract.claimWinnings(...) and then POST txHash + marketOnchainAddr
const claimSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  onchainAddr: z.string().min(1),
  userId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = claimSchema.safeParse(body);
    if (!parseResult.success) { 
      return jsonError('Invalid input', 400, parseResult.error.issues);
    }

  const { txHash, onchainAddr, userId } = parseResult.data;
  void userId; // sometimes we use wallet as user id; keep value to avoid linter complaining

    const decoded = await verifyClaimTx(txHash as `0x${string}`);

    // Record the payout off-chain
    await recordPayout({ onchainAddr, userWallet: decoded.user, amount: decoded.amountEth, txHash });

    return NextResponse.json({ success: true, decoded }, { status: 200 });
  } catch (error: any) {
    console.error("Claim payout error:", error);
    return jsonError(error?.message ?? 'Unknown error', 500);
  }
}
