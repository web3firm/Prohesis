import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/offchain/services/analyticsService";
import { jsonError } from '@/lib/api/errorResponse';

export async function GET() {
  try {
    const data = await getAnalytics();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Analytics route error:", error);
    return jsonError(error?.message ?? 'Internal server error', 500);
  }
}
