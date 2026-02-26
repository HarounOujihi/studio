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

// GET - List all locations for user's organizations
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    // Get user's organizations
    const userOrganizations = await prisma.userOrganization.findMany({
      where: { userId },
      select: { idOrg: true },
    });

    const orgIds = userOrganizations.map((uo) => uo.idOrg);

    if (orgIds.length === 0) {
      return NextResponse.json({ locations: [] });
    }

    // Fetch all locations for user's organizations
    const locations = await prisma.location.findMany({
      where: {
        idOrg: { in: orgIds },
      },
      include: {
        deposit: {
          select: {
            id: true,
            designation: true,
            reference: true,
          },
        },
        establishment: {
          select: {
            id: true,
            designation: true,
            reference: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            reference: true,
          },
        },
      },
      orderBy: {
        reference: "asc",
      },
    });

    // Transform to match expected format
    const formattedLocations = locations.map((loc) => ({
      id: loc.id,
      reference: loc.reference,
      name: loc.designation,
      volume: loc.volume,
      deposit: loc.deposit
        ? {
            id: loc.deposit.id,
            name: loc.deposit.designation,
            reference: loc.deposit.reference,
          }
        : null,
      establishment: loc.establishment
        ? {
            id: loc.establishment.id,
            name: loc.establishment.designation,
            reference: loc.establishment.reference,
          }
        : null,
      organization: loc.organization
        ? {
            id: loc.organization.id,
            name: loc.organization.name,
            reference: loc.organization.reference,
          }
        : null,
    }));

    return NextResponse.json({ locations: formattedLocations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des emplacements" },
      { status: 500 }
    );
  }
}
