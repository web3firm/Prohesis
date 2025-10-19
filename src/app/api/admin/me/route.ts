import { NextResponse } from "next/server";
import getServerSession from "next-auth";
import { authOptions } from "@/lib/auth/options";
import db from "@/lib/offchain/services/dbClient";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const email = (session as any).user?.email?.toLowerCase?.();
  const wallet = (session as any).user?.wallet?.toLowerCase?.();
  const admin = await db.admin.findFirst({
    where: {
      OR: [email ? { email } : undefined, wallet ? { wallet } : undefined].filter(Boolean) as any,
    },
    select: { id: true, email: true, wallet: true },
  });
  if (!admin) return NextResponse.json({ success: false, error: "Not an admin" }, { status: 403 });
  // Try to find corresponding User for profile page
  let user = null as any;
  if (admin.email) {
    user = await db.user.findFirst({ where: { email: admin.email }, select: { id: true } });
  }
  if (!user && admin.wallet) {
    user = await db.user.findUnique({ where: { id: admin.wallet }, select: { id: true } });
  }
  const userId = user?.id || admin.wallet || admin.email || String(admin.id);
  return NextResponse.json({ success: true, id: userId, admin });
}
