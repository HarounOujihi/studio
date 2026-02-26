import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { nanoid } from "nanoid";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

// GET - Initiate OIDC logout
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      // No session, redirect to login
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Verify and decode the JWT to get id_token
    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const idToken = payload.idToken as string | undefined;

    // Generate state for security
    const state = nanoid();

    // Build OIDC logout URL
    const logoutUrl = process.env.OIDC_LOGOUT_URL;
    if (!logoutUrl) {
      console.error("OIDC_LOGOUT_URL not configured");
      // Fallback: clear session and redirect to login
      cookieStore.delete("next-auth.session-token");
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const params = new URLSearchParams({
      id_token_hint: idToken || "",
      post_logout_redirect_uri: `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/auth/logout-callback`,
      state,
    });

    // Redirect to OIDC provider's logout endpoint
    return NextResponse.redirect(`${logoutUrl}?${params.toString()}`);
  } catch (error) {
    console.error("Logout error:", error);
    // Fallback: clear session and redirect to login
    const cookieStore = await cookies();
    cookieStore.delete("next-auth.session-token");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

// POST - Clear local session only (for fallback)
export async function POST() {
  try {
    const cookieStore = await cookies();

    // Clear the session cookie
    cookieStore.delete("next-auth.session-token");

    // Clear OAuth state cookie if exists
    cookieStore.delete("oauth_state");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
