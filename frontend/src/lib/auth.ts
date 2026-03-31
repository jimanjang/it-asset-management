import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isSuperAdmin } from "./google-workspace";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      
      try {
        const isAdmin = await isSuperAdmin(user.email);
        if (!isAdmin) {
          console.warn(`Access Denied: ${user.email} is not a Super Admin.`);
          return false; // Triggers redirection to error page
        }
        return true;
      } catch (error) {
        console.error("Sign-in admin check failed:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in, we check admin status
        token.isAdmin = await isSuperAdmin(user.email!);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Redirect errors back to sign-in page
  },
};
