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
        address: {
          select: {
            id: true,
            street: true,
            street2: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            lat: true,
            lng: true,
          },
          take: 1,
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

    // Check if establishment has an existing address
    const existingAddress = await prisma.address.findFirst({
      where: { idEtb: establishment.id },
    });

    // Handle address update/create
    if (body.address) {
      const addr = body.address;
      if (existingAddress) {
        // Update existing address
        await prisma.address.update({
          where: { id: existingAddress.id },
          data: {
            ...(addr.street !== undefined && { street: addr.street }),
            ...(addr.street2 !== undefined && { street2: addr.street2 }),
            ...(addr.city !== undefined && { city: addr.city }),
            ...(addr.state !== undefined && { state: addr.state }),
            ...(addr.zipCode !== undefined && { zipCode: addr.zipCode }),
            ...(addr.country !== undefined && { country: addr.country }),
            ...(addr.lat !== undefined && { lat: String(addr.lat) }),
            ...(addr.lng !== undefined && { lng: String(addr.lng) }),
          },
        });
      } else if (addr.street || addr.city || addr.state || addr.country) {
        // Create new address
        await prisma.address.create({
          data: {
            id: `addr-${Date.now()}`,
            idOrg: establishment.idOrg,
            idEtb: establishment.id,
            street: addr.street || null,
            street2: addr.street2 || null,
            city: addr.city || null,
            state: addr.state || null,
            zipCode: addr.zipCode || null,
            country: addr.country || null,
            lat: addr.lat ? String(addr.lat) : null,
            lng: addr.lng ? String(addr.lng) : null,
          },
        });
      }
    }

    // Update establishment
    const updated = await prisma.establishment.update({
      where: { id: establishment.id },
      data: {
        ...(body.designation !== undefined && { designation: body.designation }),
        ...(body.slogan !== undefined && { slogan: body.slogan || null }),
        ...(body.logo !== undefined && { logo: body.logo || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.website !== undefined && { website: body.website || null }),
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
        address: {
          select: {
            id: true,
            street: true,
            street2: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            lat: true,
            lng: true,
          },
          take: 1,
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
