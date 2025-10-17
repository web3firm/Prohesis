
import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { jsonError } from '@/lib/api/errorResponse';

export async function GET() {
  try {
    const users = await db.user.findMany({ take: 100 });
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Users fetch error:", error);
    return jsonError(error?.message ?? 'Internal server error', 500);
  }
}
