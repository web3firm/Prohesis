import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit } from "@/lib/api/rateLimit";

const limiter = rateLimit({ windowMs: 60_000, max: 60 });

export async function GET(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const verdict = limiter(`auth:is-admin:${ip}`);
    if (!verdict.allowed) {
      return NextResponse.json({ ok: false, isAdmin: false, error: "rate_limited" }, { status: 429 });
    }

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    const isAdmin = Boolean((token as any)?.isAdmin);
    return NextResponse.json({ ok: true, isAdmin });
  } catch (e: any) {
    return NextResponse.json({ ok: false, isAdmin: false, error: e?.message || "unknown_error" }, { status: 500 });
  }
}
