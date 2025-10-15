import { NextResponse } from "next/server";
import { createMarket } from "@/lib/onchain/writeFunctions";
import { z } from "zod";

const createMarketSchema = z.object({
  question: z.string().min(1),
  outcomes: z.array(z.string().min(1)).min(2),
  endTime: z.number().int().positive(),
  creatorAddress: z.string().min(1),
  userId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = createMarketSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input", details: parseResult.error.issues }, { status: 400 });
    }
    const { question, outcomes, endTime, creatorAddress, userId } = parseResult.data;

    // ensure server has signing key for server-signed creation
    if (!process.env.PRIVATE_KEY) return NextResponse.json({ error: "Server PRIVATE_KEY not configured" }, { status: 500 });

    const result = await createMarket({
      question,
      outcomes,
      endTime,
      creatorAddress,
      userId,
    });

    if (!result.success) throw new Error(result.error);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Create market error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
