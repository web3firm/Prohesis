import { getToken } from "next-auth/jwt";

// Determine if current request has an admin session via JWT claim (set in callbacks)
export async function isAdminRequest(req: Request): Promise<boolean> {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    return !!(token as any)?.isAdmin;
  } catch {
    return false;
  }
}
