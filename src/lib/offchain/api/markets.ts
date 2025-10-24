import db from "../services/dbClient";

export async function listMarkets(opts?: {
  take?: number;
  skip?: number;
  trending?: boolean;
  endingSoon?: boolean;
}) {
  const { take = 20, skip = 0, trending = false, endingSoon = false } = opts || {};

  const orderBy = endingSoon
    ? { endTime: "asc" as const }
    : trending
    ? { totalPool: "desc" as const }
    : { createdAt: "desc" as const };

  return db.market.findMany({
    orderBy,
    skip,
    take,
  });
}

export async function createMarket(input: {
  title: string;
  creator?: string; // maps to creatorId
  onchainAddr: string;
  endTime: Date;
}) {
  return db.market.create({
    data: {
      title: input.title,
      creatorId: input.creator,
      onchainAddr: input.onchainAddr,
      endTime: input.endTime,
    },
  });
}

export async function getMarketByAddress(onchainAddr: string) {
  return db.market.findUnique({ where: { onchainAddr } });
}

export async function bumpVolume(onchainAddr: string, amount: number) {
  return db.market.update({
    where: { onchainAddr },
    data: { totalPool: { increment: amount } },
  });
}

export async function resolveMarket(onchainAddr: string, winning: number) {
  return db.market.update({
    where: { onchainAddr },
    data: { status: "resolved", winningOutcome: winning },
  });
}
