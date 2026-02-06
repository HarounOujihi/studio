import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { slugify, generateUniqueId, generateOrganizationReference, generateEstablishmentReference } from "@/lib/utils/slugify";
import { nanoid } from "nanoid";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

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

interface CreateOrganizationBody {
  shopName: string;
  slogan?: string;
  logo?: string;
  idCurrency: string;
}

export async function POST(request: Request) {
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

    const body = (await request.json()) as CreateOrganizationBody;

    // Validate required fields
    if (!body.shopName || body.shopName.trim() === "") {
      return NextResponse.json(
        { error: "shopName is required" },
        { status: 400 }
      );
    }

    if (!body.idCurrency || body.idCurrency.trim() === "") {
      return NextResponse.json(
        { error: "idCurrency is required" },
        { status: 400 }
      );
    }

    const shopName = body.shopName.trim();
    const slogan = body.slogan?.trim() || null;
    const logo = body.logo?.trim() || null;

    // Get all existing organization IDs to ensure uniqueness
    const existingOrgs = await prisma.organization.findMany({
      select: { id: true, reference: true },
    });

    const existingOrgIds = existingOrgs.map((o) => o.id);
    const existingOrgRefs = existingOrgs.map((o) => o.reference);

    // Generate unique org ID with "org-" prefix and reference
    const shopSlug = slugify(shopName);
    const orgId = generateUniqueId(shopName, existingOrgIds, "org");
    const orgRef = generateUniqueId(shopName, existingOrgRefs);

    // Get all existing establishment IDs to ensure uniqueness
    const existingEtabs = await prisma.establishment.findMany({
      select: { id: true, reference: true },
    });

    const existingEtbIds = existingEtabs.map((e) => e.id);
    const existingEtbRefs = existingEtabs.map((e) => e.reference);

    // Generate unique establishment ID and reference with new format
    const etbId = generateUniqueId(shopName, existingEtbIds, "etb");
    const etbRef = generateUniqueId(shopName, existingEtbRefs);

    // Generate deposit and unit IDs using nanoid
    const depoId = `depo-${nanoid(10)}`;
    const unitId = `unit-${nanoid(10)}`;

    // Generate formatted references for org and etb
    const orgFormattedRef = generateOrganizationReference(shopName);
    const etbFormattedRef = generateEstablishmentReference(shopName);

    console.log("Creating organization with data:", {
      userId,
      shopName,
      slogan,
      logo,
      idCurrency: body.idCurrency,
      orgId,
      etbId,
    });

    // Create organization, establishment, deposit, unit, and user organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          id: orgId,
          reference: orgFormattedRef,
          name: shopName,
          active: true,
          phones: [],
          emails: [],
        },
      });

      // Create establishment
      const establishment = await tx.establishment.create({
        data: {
          id: etbId,
          idOrg: orgId,
          reference: etbFormattedRef,
          designation: shopName,
          slogan,
          logo,
          idCurrency: body.idCurrency,
          domain: "BUSINESS",
          isDefault: true,
        },
      });

      // Create default deposit
      const deposit = await tx.deposit.create({
        data: {
          id: depoId,
          idOrg: orgId,
          idEtb: etbId,
          reference: "DEP00001",
          designation: "Default Deposit",
          type: "STORE",
          isDefault: true,
        },
      });

      // Create default unit
      const unit = await tx.unit.create({
        data: {
          id: unitId,
          idOrg: orgId,
          idEtb: etbId,
          reference: "U",
          designation: "Unité",
        },
      });

      // Create user organization with SUPER_ADMIN role
      const userOrganization = await tx.userOrganization.create({
        data: {
          userId,
          idOrg: orgId,
          role: "SUPER_ADMIN",
        },
      });

      return { organization, establishment, deposit, unit, userOrganization };
    });

    console.log("Organization, establishment, deposit, and unit created:", {
      orgId: result.organization.id,
      orgName: result.organization.name,
      etbId: result.establishment.id,
      etbName: result.establishment.designation,
      depoId: result.deposit.id,
      unitId: result.unit.id,
    });

    return NextResponse.json({
      success: true,
      message: "Organization created successfully",
      data: {
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          reference: result.organization.reference,
        },
        establishment: {
          id: result.establishment.id,
          name: result.establishment.designation,
          reference: result.establishment.reference,
        },
      },
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      {
        error: "Failed to create organization",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
