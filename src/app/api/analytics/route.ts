import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/offchain/services/analyticsService";

export async function GET() {
  try {
    const data = await getAnalytics();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Analytics route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
