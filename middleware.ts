import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) =>
      req.nextUrl.pathname.startsWith("/admin") ? !!token : true,
  },
});

export const config = { matcher: ["/admin/:path*"] };
