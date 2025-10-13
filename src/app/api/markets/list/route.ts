import { NextResponse } from "next/server";
import prisma from "@/lib/offchain/services/dbClient";

// Patch: Return structure expected by MarketCard (id, title, endTime, yesPool, noPool)
export async function GET() {
  try {
    const markets = await prisma.markets.findMany({
      where: { status: "open" },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        title: true,
        endTime: true,
        // Add pool fields if present in schema, else fallback below
        yesPool: true,
        noPool: true,
      },
    });
    // Fallback: If yesPool/noPool not present, set to 0
    const mapped = markets.map((m: any) => ({
      id: String(m.id),
      title: m.title ?? "Untitled",
      endTime: m.endTime ? new Date(m.endTime).getTime() : 0,
      yesPool: typeof m.yesPool === "number" ? m.yesPool : 0,
      noPool: typeof m.noPool === "number" ? m.noPool : 0,
    }));
    return NextResponse.json(mapped, { status: 200 });
  } catch (error: any) {
    console.error("Markets list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
