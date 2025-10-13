
import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";

export async function GET(request: Request) {
  try {
    const users = await db.user.findMany({ take: 100 });
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Users fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
