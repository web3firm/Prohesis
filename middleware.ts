import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;

  // Enforce HTTPS and apex domain in production
  if (process.env.NODE_ENV === "production") {
    const proto = req.headers.get("x-forwarded-proto");
    const host = req.headers.get("host") || "";
    if (proto && proto !== "https") {
      const url = req.nextUrl.clone();
      url.protocol = "https";
      return NextResponse.redirect(url);
    }
    // Optional: force apex (non-www). Adjust if you prefer www.
    if (host.startsWith("www.")) {
      const url = req.nextUrl.clone();
      url.hostname = host.replace(/^www\./, "");
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (pathname === "/admin/auth/login") {
      if ((token as any)?.isAdmin) {
        const to = req.nextUrl.clone();
        to.pathname = "/admin/dashboard";
        return withSecurityHeaders(NextResponse.redirect(to));
      }
      return withSecurityHeaders(NextResponse.next());
    }
    if ((token as any)?.isAdmin) return withSecurityHeaders(NextResponse.next());
    const url = req.nextUrl.clone();
    url.pathname = "/admin/auth/login";
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  // Top-level user routes only
  if (["/dashboard", "/analytics", "/profile", "/settings"].includes(pathname)) {
    // Soft gate: allow through; client handles wallet connect. To hard-enforce, use getToken and redirect.
    return withSecurityHeaders(NextResponse.next());
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard",
    "/analytics",
    "/profile",
    "/settings",
  ],
};

function withSecurityHeaders(res: NextResponse) {
  try {
    // Conservative defaults; adjust CSP sources as needed for third-party scripts/providers
    const isProd = process.env.NODE_ENV === "production";
    const headers = res.headers;
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), interest-cohort=()",);
    // HSTS only on HTTPS in prod
    if (isProd) headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    // Baseline CSP (relaxed for Next, but still helpful). Tune for your assets/CDNs.
    const csp = [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "media-src 'self' data: blob:",
      "frame-ancestors 'none'",
      // Next often needs inline/eval during hydration; keep these if you use analytics/widgets/CDNs
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:",
    ].join("; ");
    headers.set("Content-Security-Policy", csp);
  } catch {}
  return res;
}
