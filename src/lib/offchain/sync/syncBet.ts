import prisma from "@/lib/offchain/services/dbClient";

interface VerifiedBet {
  txHash: string;
  marketId: number;
  wallet: `0x${string}`;
  outcomeIndex: number;
  amountEth: number;
  blockNumber: number;
}

export async function syncBetToDB(bet: VerifiedBet) {
  const exists = await prisma.bet.findUnique({
    where: { txHash: bet.txHash }, // ✅ works once @unique exists
  });

  if (exists) return exists;

  return prisma.bet.create({
    data: {
      marketId: bet.marketId,
      walletChainId: 11155111,
      walletAddress: bet.wallet,
      outcomeIndex: bet.outcomeIndex,
      amount: bet.amountEth,
      txHash: bet.txHash,
      blockNumber: bet.blockNumber,
    },
  });
}
