import { NextResponse } from "next/server";
import getServerSession from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { mapAdminToUserId } from "@/lib/auth/mapAdminToUser";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const email = (session as any).user?.email;
  const wallet = (session as any).user?.wallet;
  const mapped = await mapAdminToUserId({ email, wallet });
  if (!mapped) return NextResponse.json({ success: false, error: "Not an admin" }, { status: 403 });
  return NextResponse.json({ success: true, id: mapped.userId, admin: mapped.admin });
}
