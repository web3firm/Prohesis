/**
 * Prohesis · NextAuth v5 Enterprise Configuration (Typed + Hardened)
 * ---------------------------------------------------------------
 * - Supports wallet, email, and environment admin login
 * - Redirects admins ONLY to /admin/dashboard
 * - Strong type safety for NextAuth v5
 */

import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig, User, Session } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { Account } from "next-auth";

import db from "@/lib/offchain/services/dbClient";
import { recoverAddress, hashMessage } from "viem";

// -----------------------------------------------------------
// Constants
// -----------------------------------------------------------
const ADMIN_DASHBOARD = "/admin/dashboard";
const LOGIN_PAGE = "/admin/auth/login";

// -----------------------------------------------------------
// Utility: detect admin user (DB + env)
// -----------------------------------------------------------
async function isAdminUser(email?: string, wallet?: string): Promise<boolean> {
  const normalizedEmail = email?.toLowerCase() ?? "";
  const normalizedWallet = wallet?.toLowerCase() ?? "";

  const admin = await db.admin.findFirst({
    where: {
      OR: [
        normalizedEmail ? { email: normalizedEmail } : undefined,
        normalizedWallet ? { wallet: normalizedWallet } : undefined,
      ].filter(Boolean) as any,
    },
    select: { id: true },
  });

  return !!admin;
}

// -----------------------------------------------------------
// Typing helpers for callbacks
// -----------------------------------------------------------
type JwtArgs = {
  token: JWT;
  user?: User | AdapterUser | null;
};

type SessionArgs = {
  session: Session;
  token: JWT;
};

type RedirectArgs = {
  url: string;
  baseUrl: string;
  token?: JWT | null;
  account?: Account | null;
  user?: User | AdapterUser | null;
};

// -----------------------------------------------------------
// NextAuth v5 configuration
// -----------------------------------------------------------
export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: LOGIN_PAGE,
    error: LOGIN_PAGE,
  },

  providers: [
    /**
     * 1️⃣ Wallet-based Admin Login
     */
    Credentials({
      id: "wallet-credentials",
      name: "Wallet",
      credentials: {
        wallet: { label: "Wallet", type: "text" },
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        try {
          const wallet = String(credentials?.wallet || "").toLowerCase();
          const message = String(credentials?.message || "");
          const signature = String(credentials?.signature || "");
          if (!wallet || !message || !signature) return null;

          // 5-minute freshness validation
          const tsMatch = /ts=(\d{10,})/.exec(message);
          if (!tsMatch) return null;
          const ts = Number(tsMatch[1]);
          if (Math.abs(Date.now() - ts) > 5 * 60 * 1000) return null;

          // Signature verification
          const recovered = await recoverAddress({
            hash: hashMessage(message),
            signature: signature as `0x${string}`,
          });
          if (recovered.toLowerCase() !== wallet) return null;

          // Must exist in admin table
          const admin = await db.admin.findFirst({ where: { wallet } });
          if (!admin) return null;

          return { id: wallet, name: "WalletAdmin", wallet } as User;
        } catch {
          return null;
        }
      },
    }),

    /**
     * 2️⃣ Email-based Admin Login
     */
    Credentials({
      id: "email-credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const admin = await db.admin.findFirst({ where: { email } });
        const secret = process.env.ADMIN_INVITE_SECRET || process.env.ADMIN_PASS;
        if (!admin || !secret || password !== secret) return null;

        return { id: email, name: "EmailAdmin", email } as User;
      },
    }),

    /**
     * 3️⃣ Environment Super-Admin (Bootstrap/Dev)
     */
    Credentials({
  id: "env-credentials",
  name: "EnvAdmin",
  credentials: {
    username: { label: "Username", type: "text" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (
      credentials?.username === process.env.ADMIN_USER &&
      credentials?.password === process.env.ADMIN_PASS
    ) {
      // ⬇️ Add this extra property so the session immediately carries admin status
      return {
        id: "env-admin",
        name: "EnvAdmin",
        email: process.env.ADMIN_USER,
        isAdmin: true,
      } as User;
      }
     return null;
     },
   }),

  ],

  // -----------------------------------------------------------
  // Session / JWT configuration
  // -----------------------------------------------------------
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
    updateAge: 60 * 10,   // refresh every 10 min
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },

  // -----------------------------------------------------------
  // Callbacks
  // -----------------------------------------------------------
  callbacks: {
    /**
     * 🔹 JWT — enrich with role & identifiers
     */
    async jwt({ token, user }: JwtArgs) {
      if (user) {
        const u = user as any;
        token.wallet = u.wallet ?? token.wallet;
        token.email = u.email ?? token.email;
        if (u.id === "env-admin") token.isAdmin = true;
      }

      if (token.isAdmin !== true) {
        const isAdmin = await isAdminUser(token.email as string, token.wallet as string);
        token.isAdmin = isAdmin;
      }

      return token;
    },

    /**
     * 🔹 Session — expose isAdmin and identifiers to client
     */
    async session({ session, token }: SessionArgs) {
      session.user = session.user || ({} as Session["user"]);
      (session.user as any).wallet = token.wallet;
      (session.user as any).email = token.email;
      (session.user as any).isAdmin = token.isAdmin;
      (session as any).isAdmin = token.isAdmin;
      return session;
    },

    /**
     * 🔹 Redirect — ensure proper post-login routing
     */
    async redirect({ url, baseUrl, token, account, user }: RedirectArgs) {
      const safeBase = baseUrl.replace(/\/$/, "");
      const adminDashboard = `${safeBase}${ADMIN_DASHBOARD}`;

      console.log("[AUTH REDIRECT] Called with:", { url, token: (token as any)?.isAdmin, account: account?.provider, user: user?.name });

      // Always force admin dashboard for any credentials or admin token
      const isAdmin =
        (token as any)?.isAdmin ||
        user?.name?.toLowerCase().includes("admin") ||
        account?.provider?.includes("credentials");

      if (isAdmin) {
        console.log("[AUTH REDIRECT] Redirecting admin to:", adminDashboard);
        return adminDashboard;
      }

      // Relative URLs within app
      if (url?.startsWith("/")) return `${safeBase}${url}`;

      try {
        const parsed = new URL(url);
        if (parsed.origin === safeBase) return url;
      } catch {}

      // Default for non-admins
      console.log("[AUTH REDIRECT] Default redirect to home");
      return `${safeBase}/`;
    },

  },
};
