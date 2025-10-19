import Credentials from "next-auth/providers/credentials";
import db from "@/lib/offchain/services/dbClient";
import { recoverAddress, hashMessage } from "viem";

export const authOptions: any = {
  providers: [
    // Wallet credentials provider: verify EOA ownership via signature
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

          // Basic freshness check: message must include a recent timestamp
          const tsMatch = /ts=(\d{10,})/.exec(message);
          if (!tsMatch) return null;
          const ts = Number(tsMatch[1]);
          if (Math.abs(Date.now() - ts) > 5 * 60 * 1000) return null; // 5 minutes

          const recovered = await recoverAddress({
            hash: hashMessage(message as any),
            signature: signature as `0x${string}`,
          });
          if (recovered.toLowerCase() !== wallet) return null;

          // Must be an admin wallet
          const admin = await db.admin.findFirst({ where: { wallet } });
          if (!admin) return null;

          return { id: wallet, name: "WalletAdmin", wallet } as any;
        } catch {
          return null;
        }
      },
    }),

    // Email credentials provider: check email in Admin table and a shared secret
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
        return { id: email, name: "EmailAdmin", email } as any;
      },
    }),

    // Fallback credentials for super-admin via env (optional)
    Credentials({
      name: "AdminLogin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.username === process.env.ADMIN_USER &&
          credentials?.password === process.env.ADMIN_PASS
        ) {
          return { id: "env-admin", name: "Admin", email: process.env.ADMIN_USER } as any;
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/admin/login" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        if ((user as any).wallet) token.wallet = (user as any).wallet;
        if ((user as any).email) token.email = (user as any).email;
        // Env-based admin login gets admin claim directly
        if ((user as any).id === "env-admin") {
          token.isAdmin = true;
        }
      }
      // set admin claim if email or wallet is in Admin table
      const email = (token.email || "").toLowerCase();
      const wallet = (token.wallet || "").toLowerCase();
      if (token.isAdmin !== true) {
        const admin = await db.admin.findFirst({
          where: {
            OR: [email ? { email } : undefined, wallet ? { wallet } : undefined].filter(Boolean) as any,
          },
          select: { id: true },
        });
        token.isAdmin = !!admin;
      }
      return token;
    },
    async session({ session, token }: any) {
      (session as any).user = (session as any).user || {};
      (session as any).user.wallet = token.wallet;
      (session as any).user.email = token.email;
      (session as any).isAdmin = token.isAdmin;
      return session;
    },
  },
};
