import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/offchain/services/analyticsService";
import { getAdminStats } from "@/lib/offchain/services/adminStatsService";

export async function GET() {
  try {
    const [analytics, stats] = await Promise.all([
      getAnalytics(),
      getAdminStats(),
    ]);

    return NextResponse.json({ success: true, analytics, stats });
  } catch (error: any) {
    console.error("Admin insights error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
