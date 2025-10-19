import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If already authenticated admin and visiting the login page, send to dashboard
  if (req.nextUrl.pathname === "/admin/auth/login") {
    if ((token as any)?.isAdmin) {
      const to = req.nextUrl.clone();
      to.pathname = "/admin";
      return NextResponse.redirect(to);
    }
    // unauthenticated users can see the login page
    return NextResponse.next();
  }

  // For all other /admin/** routes, require admin
  if ((token as any)?.isAdmin) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/auth/login";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };
