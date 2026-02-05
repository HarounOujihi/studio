import { NextResponse } from "next/server";
import { generateState, storeState } from "@/lib/oauth";

export async function GET() {
  const state = generateState();

  // Store state in cookie for later validation
  await storeState(state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.OIDC_CLIENT!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/auth/oidc/callback`,
    scope: process.env.OIDC_SCOPES?.split(',').join(' ') || "openid profile email",
    state,
  });

  const authUrl = `${process.env.OIDC_AUTH_URL}?${params.toString()}`;

  return NextResponse.json({
    authUrl,
    state,
  });
}
