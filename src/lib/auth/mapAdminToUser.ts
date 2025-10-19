
export async function mapAdminToUserIdWithDb(db: any, { email, wallet }: { email?: string | null; wallet?: string | null }) {
  const e = email?.toLowerCase?.();
  const w = wallet?.toLowerCase?.();
  const admin = await db.admin.findFirst({
    where: { OR: [e ? { email: e } : undefined, w ? { wallet: w } : undefined].filter(Boolean) as any },
    select: { id: true, email: true, wallet: true },
  });
  if (!admin) return null;
  let user = null as any;
  if (admin.email) {
    user = await db.user.findFirst({ where: { email: admin.email }, select: { id: true } });
  }
  if (!user && admin.wallet) {
    user = await db.user.findUnique({ where: { id: admin.wallet }, select: { id: true } });
  }
  const userId = user?.id || admin.wallet || admin.email || String(admin.id);
  return { admin, userId };
}

export async function mapAdminToUserId({ email, wallet }: { email?: string | null; wallet?: string | null }) {
  const mod = await import("../offchain/services/dbClient");
  const realDb = (mod as any).default || mod;
  return mapAdminToUserIdWithDb(realDb, { email, wallet });
}

export default mapAdminToUserId;
