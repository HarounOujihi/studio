import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

type OrganizationRole = "SUPER_ADMIN" | "MANAGER" | "USER";

type JWTPayload = {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  };
  exp?: number;
};

export async function GET() {
  try {
    // Get and verify session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unauthorized - no session" },
        { status: 401 }
      );
    }

    // Verify JWT and get user ID
    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session - no user id" },
        { status: 401 }
      );
    }

    // Fetch user organizations with establishments
    const userOrganizations = await prisma.userOrganization.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            establishments: {
              select: {
                id: true,
                designation: true,
              },
            },
          },
        },
      },
    });

    // Transform to expected format
    const organizations = userOrganizations.map((uo) => ({
      id: uo.organization.id,
      name: uo.organization.name,
      logo: uo.organization.logo,
      role: uo.role as OrganizationRole,
      establishments: uo.organization.establishments.map((etb) => ({
        id: etb.id,
        name: etb.designation,
      })),
    }));

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations", organizations: [] },
      { status: 500 }
    );
  }
}
