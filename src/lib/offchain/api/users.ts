import db from "../services/dbClient";

export async function leaderboard(take = 20) {
  return db.user.findMany({
    orderBy: { totalStaked: "desc" },
    take,
    select: { wallet: true, totalStaked: true, createdAt: true, id: true },
  });
}
