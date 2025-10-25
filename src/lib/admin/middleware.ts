import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/offchain/services/dbClient";

export interface AdminContext {
  isAdmin: boolean;
  adminId?: number;
  email?: string;
  wallet?: string;
}

/**
 * Enhanced admin authentication check
 * Returns admin context if authenticated, null otherwise
 */
export async function getAdminContext(req?: NextRequest): Promise<AdminContext | null> {
  try {
    const session = await auth();
    
    if (!session) {
      return null;
    }

    const isAdmin = (session as any)?.isAdmin;
    
    if (!isAdmin) {
      return null;
    }

    // Get admin details from database
    const email = (session.user as any)?.email;
    const wallet = (session.user as any)?.wallet;

    let adminRecord = null;
    if (email) {
      adminRecord = await db.admin.findFirst({
        where: { email: email.toLowerCase() }
      });
    } else if (wallet) {
      adminRecord = await db.admin.findFirst({
        where: { wallet: wallet.toLowerCase() }
      });
    }

    return {
      isAdmin: true,
      adminId: adminRecord?.id,
      email: adminRecord?.email || email,
      wallet: adminRecord?.wallet || wallet,
    };
  } catch (error) {
    console.error("Admin auth error:", error);
    return null;
  }
}

/**
 * Require admin authentication - throws if not admin
 */
export async function requireAdmin(req?: NextRequest): Promise<AdminContext> {
  const context = await getAdminContext(req);
  
  if (!context || !context.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }
  
  return context;
}

/**
 * Legacy compatibility - returns boolean
 */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const context = await getAdminContext();
  return context?.isAdmin ?? false;
}
