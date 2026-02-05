import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

/**
 * Get the current session from the JWT cookie
 * Returns null if not authenticated or session is expired
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return null;
    }

    // Verify and decode the JWT
    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);

    // Check if session is expired
    if (payload.expiresAt && Date.now() > (payload.expiresAt as number)) {
      return null;
    }

    return {
      user: payload.user as User,
      accessToken: payload.accessToken as string,
      refreshToken: payload.refreshToken as string,
      idToken: payload.idToken as string,
      expiresAt: payload.expiresAt as number,
    };
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * Returns true if session exists and is valid
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Require authentication - throws redirect if not authenticated
 * Use in server components and server actions
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    // This will be caught by Next.js and trigger a redirect
    throw new Error("UNAUTHORIZED");
  }

  return session;
}
