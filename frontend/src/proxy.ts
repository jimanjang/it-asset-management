import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  // Protect all routes except auth-related ones and static assets
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|logo.png|auth/signin).*)",
  ],
};
