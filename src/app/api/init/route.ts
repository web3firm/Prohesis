import { NextResponse } from "next/server";
import { startEventListener } from "@/lib/onchain/eventSync";

let started = false;

export async function GET() {
  try {
    if (!started) {
      await startEventListener();
      started = true;
    }
    return NextResponse.json({ status: "Event listener active" });
  } catch (e: any) {
    console.error("Init event listener error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
