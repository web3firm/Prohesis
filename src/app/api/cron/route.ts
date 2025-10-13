import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Trigger each endpoint in sequence
    await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/markets/updateOutcomes`),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/markets/syncPools`),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/leaderboard`),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/fees`),
    ]);

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
