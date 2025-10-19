import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { z } from "zod";
import { jsonError } from "@/lib/api/errorResponse";

const putSchema = z.object({
  wallet: z.string().min(1),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i, "Only letters, numbers, underscores").optional(),
  ensName: z.string().optional(),
  ensAvatar: z.string().url().optional(),
});

function randomUsername(): string {
  const n = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return String(n);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    if (!username) return jsonError("username required", 400);
    const exists = await db.user.findFirst({ where: { username: username.toLowerCase() } });
    return NextResponse.json({ available: !exists });
  } catch (e: any) {
    return jsonError(e?.message ?? "Internal server error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.issues);
    const { wallet, username, ensName, ensAvatar } = parsed.data as any;
    let uname: string | null = (username ? String(username) : null)?.toLowerCase() ?? null;

    // If user already has a username and no new username provided, return as-is
    const current = await db.user.findUnique({ where: { id: wallet } });
    if (!uname && current?.username) {
      return NextResponse.json({ ok: true, user: current });
    }

    // If no username provided, choose ENS name or wallet slice or random 6-digit
    let attempts = 0;
    if (!uname) {
      const sanitizedEns = (ensName || "").toString().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (sanitizedEns.length >= 3) {
        uname = sanitizedEns.slice(0, 30);
      } else if (wallet && typeof wallet === 'string' && wallet.length >= 8) {
        uname = wallet.slice(2, 8).toLowerCase();
      } else {
        uname = randomUsername();
      }
    }
    // Ensure uniqueness; retry a few times if taken
    // We check existence and also handle unique constraint on upsert below
    while (attempts < 5) {
      const taken = await db.user.findFirst({ where: { username: uname } });
      if (!taken) break;
      uname = randomUsername();
      attempts++;
    }

    try {
      const user = await db.user.upsert({
        where: { id: wallet },
        update: { username: uname, displayName: uname, avatarUrl: ensAvatar ?? undefined },
        create: { id: wallet, username: uname, displayName: uname, avatarUrl: ensAvatar ?? undefined },
      });
      return NextResponse.json({ ok: true, user });
    } catch (e: any) {
      if (e?.code === "P2002") {
        // One more attempt on collision
        const user = await db.user.upsert({
          where: { id: wallet },
          update: (() => { const u = randomUsername(); return { username: u, displayName: u }; })(),
          create: (() => { const u = randomUsername(); return { id: wallet, username: u, displayName: u }; })(),
        });
        return NextResponse.json({ ok: true, user });
      }
      throw e;
    }
  } catch (e: any) {
    if (e?.code === "P2002") return jsonError("Username already taken", 409);
    return jsonError(e?.message ?? "Internal server error", 500);
  }
}
