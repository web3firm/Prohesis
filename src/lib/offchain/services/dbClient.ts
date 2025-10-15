import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Export a loose 'prisma' alias typed as any so legacy plural usages still work.
export const prisma: any = db as any;

// Provide plural aliases used across the codebase (runtime only)
prisma.markets = db.market;
prisma.bets = db.bet;
prisma.payouts = db.payout;
prisma.users = db.user;
prisma.marketPools = (db as any).marketPool ?? undefined;
prisma.marketOutcomes = (db as any).marketOutcome ?? undefined;
prisma.fees = (db as any).fee ?? undefined;
prisma.leaderboards = (db as any).leaderboard ?? undefined;
prisma.transactions = (db as any).transaction ?? undefined;

// Default export intentionally returns the loose 'prisma' (any) so older files that
// use plural properties (e.g. `prisma.users`) will type-check. Prefer importing
// the named `db` export for typed PrismaClient usage.
export default prisma;
