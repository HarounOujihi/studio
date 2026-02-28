import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const JWT_SECRET = new TextEncoder().encode(process.env.OIDC_SECRET || "your-secret-key");
type JWTPayload = { user?: { id: string }; exp?: number };

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idOrg = searchParams.get("idOrg");
    const idEtb = searchParams.get("idEtb");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    if (!idOrg || !idEtb) return NextResponse.json({ error: "idOrg and idEtb are required" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { idOrg, idEtb };
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.unit.count({ where });
    const units = await prisma.unit.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } });

    return NextResponse.json({
      units: units.map((u) => ({ ...u, createdAt: u.createdAt?.toISOString() || null })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
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
    const { idOrg, idEtb, designation } = body;

    if (!idOrg || !idEtb) return NextResponse.json({ error: "Organisation et établissement requis" }, { status: 400 });

    const hasAccess = await prisma.userOrganization.findFirst({ where: { userId, idOrg } });
    if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const lastUnit = await prisma.unit.findFirst({ where: { idOrg, idEtb }, orderBy: { reference: "desc" } });
    const lastRef = lastUnit?.reference || "UNT00000";
    const refNum = (parseInt(lastRef.replace("UNT", "")) || 0) + 1;
    const reference = `UNT${String(refNum).padStart(5, "0")}`;

    const unitId = `unt-${nanoid()}`;
    const unit = await prisma.unit.create({ data: { id: unitId, idOrg, idEtb, reference, designation: designation || null } });

    return NextResponse.json({ unit, success: true });
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json({ error: "Erreur lors de la création de l'unité" }, { status: 500 });
  }
}
