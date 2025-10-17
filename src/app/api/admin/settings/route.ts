import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { isAdminRequest } from "@/lib/auth/admin";

export async function GET() {
  try {
    const rows = await db.setting.findMany();
    const settings = Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
    return NextResponse.json({ success: true, settings });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    // Expect shape { updates: { [key]: value } }
    const updates = body?.updates ?? {};
    const keys = Object.keys(updates);
    if (keys.length === 0) return NextResponse.json({ success: true });

    await Promise.all(
      keys.map((key) =>
        db.setting.upsert({
          where: { key },
          update: { value: updates[key] },
          create: { key, value: updates[key] },
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? "Failed" }, { status: 500 });
  }
}
