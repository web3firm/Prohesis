import Credentials from "next-auth/providers/credentials";

export const authOptions: any = {
  providers: [
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
          return { id: "1", name: "Admin" };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
