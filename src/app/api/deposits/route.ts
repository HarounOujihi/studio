import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

type JWTPayload = {
  user?: { id: string };
  exp?: number;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idOrg = searchParams.get("idOrg");
    const idEtb = searchParams.get("idEtb");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const type = searchParams.get("type");

    if (!idOrg || !idEtb) {
      return NextResponse.json({ error: "idOrg and idEtb are required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { idOrg, idEtb };
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.deposit.count({ where });
    const deposits = await prisma.deposit.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        address: { select: { street: true, city: true, country: true } },
        _count: { select: { locations: true } },
      },
    });

    return NextResponse.json({
      deposits: deposits.map((d) => ({
        id: d.id,
        idOrg: d.idOrg,
        idEtb: d.idEtb,
        reference: d.reference,
        designation: d.designation,
        type: d.type,
        isDefault: d.isDefault,
        createdAt: d.createdAt?.toISOString() || null,
        address: d.address ? { street: d.address.street, city: d.address.city, country: d.address.country } : null,
        locationCount: d._count.locations,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return NextResponse.json({ error: "Failed to fetch deposits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");
    if (!sessionToken) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;
    if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const body = await request.json();
    const { idOrg, idEtb, designation, type, isDefault, street, street2, city, state, zipCode, country } = body;

    if (!idOrg || !idEtb) return NextResponse.json({ error: "Organisation et établissement requis" }, { status: 400 });
    if (!type) return NextResponse.json({ error: "Le type de dépôt est requis" }, { status: 400 });

    const hasAccess = await prisma.userOrganization.findFirst({ where: { userId, idOrg } });
    if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const lastDeposit = await prisma.deposit.findFirst({ where: { idOrg, idEtb }, orderBy: { reference: "desc" } });
    const lastRef = lastDeposit?.reference || "DEP00000";
    const refNum = (parseInt(lastRef.replace("DEP", "")) || 0) + 1;
    const reference = `DEP${String(refNum).padStart(5, "0")}`;

    let addressId: string | null = null;
    if (street || city || country) {
      const address = await prisma.address.create({
        data: { id: `addr-${nanoid()}`, idOrg, idEtb, street: street || null, street2: street2 || null, city: city || null, state: state || null, zipCode: zipCode || null, country: country || null },
      });
      addressId = address.id;
    }

    if (isDefault) {
      await prisma.deposit.updateMany({ where: { idOrg, idEtb, isDefault: true }, data: { isDefault: false } });
    }

    const depositId = `dep-${nanoid()}`;
    const deposit = await prisma.deposit.create({
      data: { id: depositId, idOrg, idEtb, reference, designation: designation || null, type, isDefault: isDefault || false, idAddress: addressId },
      include: { address: true },
    });

    return NextResponse.json({ deposit, success: true });
  } catch (error) {
    console.error("Error creating deposit:", error);
    return NextResponse.json({ error: "Erreur lors de la création du dépôt" }, { status: 500 });
  }
}
