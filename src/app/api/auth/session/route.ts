import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    // Verify and decode the JWT
    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);

    return NextResponse.json({
      session: {
        user: payload.user as {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          picture: string;
        },
        expires: new Date(payload.exp as number).toISOString(),
        accessToken: payload.accessToken as string,
        refreshToken: payload.refreshToken as string,
        idToken: payload.idToken as string,
      },
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json({ session: null }, { status: 200 });
  }
}
