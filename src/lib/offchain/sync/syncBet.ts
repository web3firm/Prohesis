import db from "@/lib/offchain/services/dbClient";

interface VerifiedBet {
  txHash: string;
  marketId: number;
  wallet: `0x${string}`;
  outcomeIndex: number;
  amountEth: number;
  blockNumber: number;
}

export async function syncBetToDB(bet: VerifiedBet) {
  const exists = await db.bet.findUnique({
    where: { txHash: bet.txHash },
  });

  if (exists) return exists;

  // Try to associate an off-chain user by wallet address (use lowercase normalized form)
  const wallet = bet.wallet.toLowerCase();
  const user = await db.user.findUnique({ where: { id: wallet } }).catch(() => null);

  return db.bet.create({
    data: {
      marketId: bet.marketId,
      walletChainId: 11155111,
      walletAddress: bet.wallet,
      userId: user ? user.id : null,
      outcomeIndex: bet.outcomeIndex,
      amount: bet.amountEth,
      txHash: bet.txHash,
      blockNumber: bet.blockNumber,
    },
  });
}
