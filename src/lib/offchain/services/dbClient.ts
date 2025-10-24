import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma instances during hot reload in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * ✅ Typed Prisma client with singleton pattern
 * - Prevents multiple connections during dev (hot reload)
 * - Adds datasource URL for flexibility in staging/prod
 * - Compatible with Neon/Supabase/Hostinger/VPS PostgreSQL
 */
export const db =
  globalThis.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Keep a single persistent client during dev
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

/**
 * ✅ Safe proxy for legacy plural aliases
 * e.g., prisma.users.findMany() still works,
 * without mutating PrismaClient.
 */
export const prisma = new Proxy(db, {
  get(target, prop) {
    switch (prop) {
      case "users":
        return target.user;
      case "markets":
        return target.market;
      case "bets":
        return target.bet;
      case "payouts":
        return target.payout;
      case "leaderboards":
        return (target as any).leaderboard;
      case "transactions":
        return (target as any).transaction;
      case "fees":
        return (target as any).fee;
      case "marketPools":
        return (target as any).marketPool;
      case "marketOutcomes":
        return (target as any).marketOutcome;
      default:
        return (target as any)[prop];
    }
  },
});

// Default export for backward compatibility
export default prisma;
