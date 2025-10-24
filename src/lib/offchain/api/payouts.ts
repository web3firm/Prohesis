import db from "../services/dbClient";

export async function recordPayout(input: {
  onchainAddr: string;
  userWallet: string;
  amount: number;
  txHash?: string; // accepted but not persisted in current schema
}) {
  // Standardize: use the wallet address itself as the off-chain User.id
  const walletId = input.userWallet.toLowerCase();
  const user = await db.user.upsert({
    where: { id: walletId },
    update: {},
    create: { id: walletId, displayName: walletId },
  });

  const market = await db.market.findUnique({ where: { onchainAddr: input.onchainAddr } });
  if (!market) throw new Error("Market not found");

  return db.payout.create({
    data: {
      amount: input.amount,
      userId: user.id,
      marketId: market.id,
    },
  });
}
