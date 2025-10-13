import db from "../services/dbClient";

export async function recordPayout(input: {
  onchainAddr: string;
  userWallet: string;
  amount: number;
  txHash: string;
}) {
  const user = await db.user.upsert({
    where: { wallet: input.userWallet.toLowerCase() },
    update: {},
    create: { wallet: input.userWallet.toLowerCase() },
  });

  const market = await db.market.findUnique({ where: { onchainAddr: input.onchainAddr } });
  if (!market) throw new Error("Market not found");

  return db.payout.create({
    data: {
      amount: input.amount,
      txHash: input.txHash,
      userId: user.id,
      marketId: market.id,
    },
  });
}
