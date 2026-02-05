import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

// Define protected and public routes
const protectedRoutes = ["/dashboard", "/articles", "/categories", "/orders", "/customers", "/organizations", "/establishments", "/users", "/settings"];
const publicRoutes = ["/auth/login", "/auth/error", "/api/auth"];

async function verifySession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Check if session is expired
    if (payload.expiresAt && Date.now() > (payload.expiresAt as number)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Get session token from cookie
  const sessionToken = request.cookies.get("next-auth.session-token")?.value;

  // Check if user is authenticated
  const isAuthenticated = sessionToken && await verifySession(sessionToken);

  // Redirect unauthenticated users to login page
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (isAuthenticated && isPublicRoute && nextUrl.pathname === "/auth/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Routes middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
