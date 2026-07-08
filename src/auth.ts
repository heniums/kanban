import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials, getUserById } from "@/lib/data/auth";

const PROTECTED_PREFIXES = ["/boards"];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await verifyCredentials(
          String(credentials.email),
          String(credentials.password),
        );
        return user ?? null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = PROTECTED_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        const u = user as unknown as Record<string, unknown>;
        (token as unknown as Record<string, unknown>).avatarUrl = u.avatarUrl;
      }
      if (trigger === "update" && session) {
        const s = session as Record<string, unknown>;
        if ("name" in s) token.name = s.name as string;
        if ("avatarUrl" in s) {
          (token as unknown as Record<string, unknown>).avatarUrl = s.avatarUrl;
        }
      }
      if (token.sub) {
        const dbUser = await getUserById(token.sub);
        if (dbUser) {
          (token as unknown as Record<string, unknown>).avatarUrl = dbUser.avatarUrl;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name ?? "";
        session.user.email = token.email ?? "";
        (session.user as unknown as Record<string, unknown>).avatarUrl = (
          token as unknown as Record<string, unknown>
        ).avatarUrl;
      }
      return session;
    },
  },
});
