import { nanoid } from "nanoid";
import { cookies } from "next/headers";

// Generate a state parameter for CSRF protection
export function generateState(): string {
  return nanoid(32);
}

// Store state in a cookie (server-side)
export async function storeState(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });
}

// Retrieve and validate state from cookie (server-side)
export async function validateState(state: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state");

  if (!storedState || storedState.value !== state) {
    return false;
  }

  // Remove the cookie after validation
  cookieStore.delete("oauth_state");
  return true;
}
