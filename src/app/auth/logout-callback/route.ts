import { NextResponse } from "next/server";

// Logout callback - called by OIDC provider after logout
// This clears the local session and redirects to login
export async function GET() {
  const response = NextResponse.redirect(new URL("/auth/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));

  // Clear the session cookie
  response.cookies.set("next-auth.session-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // Also clear __Secure-next-auth.session-token for production
  response.cookies.set("__Secure-next-auth.session-token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
