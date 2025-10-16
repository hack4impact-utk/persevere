import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(function middleware(req) {
  const user = req.nextauth.token?.user;

  if (!user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Simplified role-based access control
  if (req.nextUrl.pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    req.nextUrl.pathname.startsWith("/staff") &&
    !["staff", "admin"].includes(user.role)
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    req.nextUrl.pathname.startsWith("/volunteer") &&
    user.role !== "volunteer"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Email verification check for volunteers
  if (user.role === "volunteer" && !user.isEmailVerified) {
    return NextResponse.redirect(new URL("/verify-email", req.url));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/volunteer/:path*"],
};
