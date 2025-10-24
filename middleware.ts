import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit } from "./src/lib/api/rateLimit";

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;
  const authLimiter = rateLimit({ windowMs: 60_000, max: 20 });

  // 🌐 Enforce HTTPS & non-www in production
  if (process.env.NODE_ENV === "production") {
    const proto = req.headers.get("x-forwarded-proto");
    const host = req.headers.get("host") || "";
    if (proto && proto !== "https") {
      const url = req.nextUrl.clone();
      url.protocol = "https";
      const res = NextResponse.redirect(url);
      try { console.log(`middleware redirect: ${pathname} -> ${url.pathname} (https)`); } catch {}
      res.headers.set("x-debug-redirect-source", pathname);
      res.headers.set("x-debug-redirect-target", url.pathname);
      return withSecurityHeaders(res);
    }
    if (host.startsWith("www.")) {
      const url = req.nextUrl.clone();
      url.hostname = host.replace(/^www\./, "");
      const res = NextResponse.redirect(url);
      try { console.log(`middleware redirect: ${pathname} -> ${url.pathname} (apex)`); } catch {}
      res.headers.set("x-debug-redirect-source", pathname);
      res.headers.set("x-debug-redirect-target", url.pathname);
      return withSecurityHeaders(res);
    }
  }

  // 🛡️ Rate limit sensitive auth endpoints
  if (pathname.startsWith("/api/auth/")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const verdict = authLimiter(`auth:api:${ip}`);
    if (!verdict.allowed) {
      const resp = new NextResponse("Too Many Requests", { status: 429 });
      try { console.log(`middleware rate-limit: ${pathname} from ${ip}`); } catch {}
      resp.headers.set("x-debug-rate-limited", "1");
      resp.headers.set("x-debug-redirect-source", pathname);
      resp.headers.set("x-debug-redirect-target", "rate_limited");
      return withSecurityHeaders(resp);
    }
    return NextResponse.next();
  }

  // Resolve current auth token once for subsequent checks
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // � Admin-only routes
  if (pathname.startsWith("/admin")) {
    // Redirect bare /admin to /admin/dashboard
    if (pathname === "/admin") {
      const to = req.nextUrl.clone();
      to.pathname = "/admin/dashboard";
      const res = NextResponse.redirect(to);
      res.headers.set("x-debug-redirect-source", pathname);
      res.headers.set("x-debug-redirect-target", to.pathname);
      return withSecurityHeaders(res);
    }

    const isAdmin = Boolean((token as any)?.isAdmin);

    // Already logged-in admin trying to visit login
    if (pathname === "/admin/auth/login" && isAdmin) {
      const to = req.nextUrl.clone();
      to.pathname = "/admin/dashboard";
      const res = NextResponse.redirect(to);
      res.headers.set("x-debug-redirect-source", pathname);
      res.headers.set("x-debug-redirect-target", to.pathname);
      return withSecurityHeaders(res);
    }

    // Not admin and not the login page → send home
    if (!isAdmin && pathname !== "/admin/auth/login") {
      const to = req.nextUrl.clone();
      to.pathname = "/";
      const res = NextResponse.redirect(to);
      res.headers.set("x-debug-redirect-source", pathname);
      res.headers.set("x-debug-redirect-target", to.pathname);
      return withSecurityHeaders(res);
    }

    return withSecurityHeaders(NextResponse.next());
  }

  // Default pass-through
  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/auth/:path*",
  ],
};

// ----------------------------------------------------------
// Security Headers
// ----------------------------------------------------------
function withSecurityHeaders(res: NextResponse) {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const headers = res.headers;
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), interest-cohort=()"
    );
    if (isProd)
      headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

    const csp = [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "media-src 'self' data: blob:",
      "frame-ancestors 'none'",
      "frame-src 'self' https://*.web3auth.io https://*.tor.us https://web3auth.io",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https: https://*.web3auth.io https://*.tor.us",
    ].join("; ");
    headers.set("Content-Security-Policy", csp);
  } catch {}
  return res;
}
