import { NextRequest, NextResponse } from "next/server";
import { validateState } from "@/lib/oauth";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key",
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle errors from OAuth provider
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        "/auth/login?error=" + encodeURIComponent(error || "oauth_error"),
        request.url,
      ),
    );
  }

  // Validate state parameter
  if (!state || !(await validateState(state))) {
    return NextResponse.redirect(
      new URL("/auth/login?error=invalid_state", request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=no_code", request.url),
    );
  }

  // Exchange code for tokens
  try {
    const credentials = Buffer.from(
      `${process.env.OIDC_CLIENT}:${process.env.OIDC_SECRET}`,
    ).toString("base64");

    const tokenResponse = await fetch(process.env.OIDC_TOKEN_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/auth/oidc/callback`,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", tokenResponse.status, errorText);
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      expires_in: number;
      id_token: string;
      refresh_token?: string;
      scope: string; // 'openid offline profile email'
      token_type: string; //'bearer'
    };

    // Get user info from id_token
    const userInfo = parseIdToken(tokens.id_token) as {
      amr: string[];
      at_hash: string;
      aud: string[];
      auth_time: number;
      email: string;
      exp: number;
      firstName: string;
      iat: number;
      iss: string;
      jti: string;
      lastName: string;
      picture?: string;
      rat: number;
      sid: string;
      sub: string;
    };

    // Create session token
    const sessionToken = await new SignJWT({
      user: {
        id: userInfo.sub,
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        picture: userInfo.picture,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      idToken: tokens.id_token,
      expiresAt: Date.now() + (tokens.expires_in || 30 * 24 * 60 * 60) * 1000,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("next-auth.session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Register user with backend
    try {
      const resp = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oidcId: userInfo.sub,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          picture: userInfo.picture,
        }),
      });
      console.log("Registration response:", resp);
    } catch (regError) {
      console.error("Registration error:", regError);
    }
console.log('REDIRECTION HERE')
    // Redirect to dashboard page on success
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=token_exchange_failed", request.url),
    );
  }
}

// Parse JWT id_token (simplified - in production use a proper JWT library)
function parseIdToken(idToken: string): any {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Failed to parse id_token:", error);
    return {};
  }
}
