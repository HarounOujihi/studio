import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

type JWTPayload = {
  user?: {
    id: string;
  };
  exp?: number;
};

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const url = new URL(request.url);
    const etbId = url.searchParams.get("etbId");

    if (!etbId) {
      return NextResponse.json(
        { error: "Establishment ID (etbId) is required" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organization: {
          establishments: {
            some: { id: etbId },
          },
        },
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this establishment" },
        { status: 403 }
      );
    }

    // Get establishment to get orgId
    const establishment = await prisma.establishment.findUnique({
      where: { id: etbId },
      select: { idOrg: true },
    });

    if (!establishment) {
      return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    }

    // Fetch deposits
    const deposits = await prisma.deposit.findMany({
      where: {
        idEtb: etbId,
        idOrg: establishment.idOrg,
      },
      orderBy: { designation: "asc" },
    });

    return NextResponse.json({ deposits });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposits" },
      { status: 500 }
    );
  }
}
