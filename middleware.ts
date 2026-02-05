import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

import { getDashboardRoute } from "@/utils/routes";

export default withAuth(function middleware(req) {
  const user = req.nextauth.token?.user;

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Role-based access control for staff routes (staff and admin can access)
  if (
    req.nextUrl.pathname.startsWith("/staff") &&
    !["staff", "admin"].includes(user.role)
  ) {
    return NextResponse.redirect(
      new URL(getDashboardRoute(user.role), req.url),
    );
  }

  // Role-based access control for volunteer routes
  if (
    req.nextUrl.pathname.startsWith("/volunteer") &&
    user.role !== "volunteer"
  ) {
    return NextResponse.redirect(
      new URL(getDashboardRoute(user.role), req.url),
    );
  }

});

export const config = {
  matcher: ["/staff/:path*", "/volunteer/:path*"],
};
