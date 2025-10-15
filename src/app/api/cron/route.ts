import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Resolve base URL (env or localhost) so cron works in dev and prod
    const base = (process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
    const endpoints = [
      `${base}/api/markets/updateOutcomes`,
      `${base}/api/markets/syncPools`,
      `${base}/api/leaderboard`,
      `${base}/api/fees`,
    ];

    await Promise.all(endpoints.map((u) => fetch(u)));

    return NextResponse.json({
      success: true,
      message: "Weekly cron executed successfully",
      time: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron run error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
