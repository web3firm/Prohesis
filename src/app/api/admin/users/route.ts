import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { isAdminRequest } from "@/lib/auth/admin";

export async function GET() {
  try {
    const list = await db.admin.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, list });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email?.toLowerCase?.();
    const wallet = body.wallet?.toLowerCase?.();
    if (!email && !wallet) {
      return NextResponse.json({ success: false, error: "email or wallet required" }, { status: 400 });
    }
    const created = await db.admin.create({ data: { email, wallet } as any });
    return NextResponse.json({ success: true, admin: created });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? "Failed" }, { status: 500 });
  }
}
