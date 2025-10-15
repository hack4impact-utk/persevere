import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(function middleware(req) {
  const user = req.nextauth.token?.user;
  
  if (!user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Role-based access control
  if (req.nextUrl.pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (req.nextUrl.pathname.startsWith("/staff") && !["staff", "admin"].includes(user.role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Email verification check for volunteers
  if (user.role !== "admin" && user.role !== "staff" && !user.isEmailVerified) {
    return NextResponse.redirect(new URL("/verify-email", req.url));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/staff/:path*", "/volunteer/:path*"]
};
