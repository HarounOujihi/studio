import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
