import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

type JWTPayload = {
  user?: {
    id: string;
  };
  exp?: number;
};

// GET - List clients with pagination and search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idOrg = searchParams.get("idOrg");
    const idEtb = searchParams.get("idEtb");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const nature = searchParams.get("nature");

    if (!idOrg || !idEtb) {
      return NextResponse.json(
        { error: "idOrg and idEtb are required" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      idOrg,
      idEtb,
    };

    if (nature) {
      where.nature = nature;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { tel: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.client.count({ where });

    const clients = await prisma.client.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        address: {
          select: {
            street: true,
            city: true,
            country: true,
          },
        },
      },
    });

    return NextResponse.json({
      clients: clients.map((c) => ({
        ...c,
        createdAt: c.createdAt?.toISOString() || null,
        address: c.address
          ? {
              street: c.address.street,
              city: c.address.city,
              country: c.address.country,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST - Create new client
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      idOrg,
      idEtb,
      firstName,
      lastName,
      companyName,
      email,
      tel,
      nature,
      taxIdNumber,
      personalIdType,
      personalId,
      customsCode,
      note,
      idTax,
      idBankAccount,
      // Address fields
      street,
      street2,
      city,
      state,
      zipCode,
      country,
    } = body;

    if (!idOrg || !idEtb) {
      return NextResponse.json(
        { error: "Organisation et établissement requis" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Validate required fields based on nature
    if (nature === "INDIVIDUAL" && !firstName && !lastName) {
      return NextResponse.json(
        { error: "Le nom et prénom sont requis pour un particulier" },
        { status: 400 }
      );
    }

    if (nature === "COMPANY" && !companyName) {
      return NextResponse.json(
        { error: "La raison sociale est requise pour une entreprise" },
        { status: 400 }
      );
    }

    // Generate unique reference (CLI00001 format)
    const lastClient = await prisma.client.findFirst({
      where: { idOrg, idEtb },
      orderBy: { reference: "desc" },
    });

    const lastRef = lastClient?.reference || "CLI00000";
    const refNum = (parseInt(lastRef.replace("CLI", "")) || 0) + 1;
    const reference = `CLI${String(refNum).padStart(5, "0")}`;

    // Create address if any address field is provided
    let addressId: string | null = null;
    if (street || city || country) {
      const address = await prisma.address.create({
        data: {
          id: `addr-${nanoid()}`,
          idOrg,
          idEtb,
          street: street || null,
          street2: street2 || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          country: country || null,
        },
      });
      addressId = address.id;
    }

    // Create client
    const clientId = `client-${nanoid()}`;
    const client = await prisma.client.create({
      data: {
        id: clientId,
        idOrg,
        idEtb,
        reference,
        firstName: firstName || null,
        lastName: lastName || null,
        companyName: companyName || null,
        email: email || null,
        tel: tel || null,
        nature: nature || "INDIVIDUAL",
        taxIdNumber: taxIdNumber || null,
        personalIdType: personalIdType || null,
        personalId: personalId || null,
        customsCode: customsCode || null,
        note: note || null,
        idTax: idTax || null,
        idBankAccount: idBankAccount || null,
        idAddress: addressId,
      },
      include: {
        address: true,
      },
    });

    return NextResponse.json({ client, success: true });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }
}
