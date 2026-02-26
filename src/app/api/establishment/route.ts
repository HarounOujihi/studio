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

// Helper to get etbId from request (query param or header)
function getEtbId(request: Request): string | null {
  // Try query param first
  const url = new URL(request.url);
  const etbId = url.searchParams.get("etbId");
  if (etbId) return etbId;

  // Try header
  return request.headers.get("x-etb-id") || null;
}

// GET establishment by id
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

    // Get etbId from query param or header
    const etbId = getEtbId(request);

    if (!etbId) {
      return NextResponse.json(
        { error: "Establishment ID (etbId) is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this establishment
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

    const establishment = await prisma.establishment.findUnique({
      where: { id: etbId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            reference: true,
          },
        },
        currency: {
          select: {
            id: true,
            designation: true,
            symbol: true,
            reference: true,
          },
        },
        workingHours: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!establishment) {
      return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    }

    return NextResponse.json({ establishment });
  } catch (error) {
    console.error("Error fetching establishment:", error);
    return NextResponse.json(
      { error: "Failed to fetch establishment" },
      { status: 500 }
    );
  }
}

// PATCH update establishment
export async function PATCH(request: Request) {
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

    // Get etbId from query param or header
    const etbId = getEtbId(request);

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

    const establishment = await prisma.establishment.findUnique({
      where: { id: etbId },
    });

    if (!establishment) {
      return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    }

    const body = await request.json();

    // Update establishment with direct address fields
    const updated = await prisma.establishment.update({
      where: { id: establishment.id },
      data: {
        ...(body.designation !== undefined && { designation: body.designation }),
        ...(body.slogan !== undefined && { slogan: body.slogan || null }),
        ...(body.logo !== undefined && { logo: body.logo || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.website !== undefined && { website: body.website || null }),
        // Direct address fields
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.city !== undefined && { city: body.city || null }),
        ...(body.zipCode !== undefined && { zipCode: body.zipCode || null }),
        ...(body.country !== undefined && { country: body.country || null }),
        ...(body.latitude !== undefined && { latitude: body.latitude || null }),
        ...(body.longitude !== undefined && { longitude: body.longitude || null }),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            reference: true,
          },
        },
        currency: {
          select: {
            id: true,
            designation: true,
            symbol: true,
            reference: true,
          },
        },
        workingHours: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    return NextResponse.json({ establishment: updated });
  } catch (error) {
    console.error("Error updating establishment:", error);
    return NextResponse.json(
      { error: "Failed to update establishment" },
      { status: 500 }
    );
  }
}
