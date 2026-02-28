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
    const idDepo = searchParams.get("idDepo");

    if (!idOrg || !idEtb) return NextResponse.json({ error: "idOrg and idEtb are required" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { idOrg, idEtb };
    if (idDepo) where.idDepo = idDepo;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.location.count({ where });
    const locations = await prisma.location.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" },
      include: { deposit: { select: { reference: true, designation: true } } },
    });

    return NextResponse.json({
      locations: locations.map((l) => ({ ...l, createdAt: l.createdAt?.toISOString() || null })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
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
    const { idOrg, idEtb, idDepo, designation, volume } = body;

    if (!idOrg || !idEtb) return NextResponse.json({ error: "Organisation et établissement requis" }, { status: 400 });
    if (!idDepo) return NextResponse.json({ error: "Le dépôt est requis" }, { status: 400 });

    const hasAccess = await prisma.userOrganization.findFirst({ where: { userId, idOrg } });
    if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const deposit = await prisma.deposit.findFirst({ where: { id: idDepo, idOrg, idEtb } });
    if (!deposit) return NextResponse.json({ error: "Dépôt non trouvé" }, { status: 404 });

    const lastLocation = await prisma.location.findFirst({ where: { idOrg, idEtb }, orderBy: { reference: "desc" } });
    const lastRef = lastLocation?.reference || "LOC00000";
    const refNum = (parseInt(lastRef.replace("LOC", "")) || 0) + 1;
    const reference = `LOC${String(refNum).padStart(5, "0")}`;

    const locationId = `loc-${nanoid()}`;
    const location = await prisma.location.create({
      data: { id: locationId, idOrg, idEtb, idDepo, reference, designation: designation || null, volume: volume || null },
      include: { deposit: true },
    });

    return NextResponse.json({ location, success: true });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json({ error: "Erreur lors de la création de l'emplacement" }, { status: 500 });
  }
}
