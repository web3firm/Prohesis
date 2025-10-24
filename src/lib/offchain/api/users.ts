import db from "../services/dbClient";

// Minimal leaderboard using existing schema fields
// For richer stats, compute aggregates from Bet table in a dedicated query.
export async function leaderboard(take = 20) {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, displayName: true, createdAt: true },
  });
}
