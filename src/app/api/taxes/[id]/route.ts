import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.OIDC_SECRET || "your-secret-key");
type JWTPayload = { user?: { id: string }; exp?: number };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tax = await prisma.tax.findUnique({ where: { id } });
    if (!tax) return NextResponse.json({ error: "Taxe non trouvée" }, { status: 404 });
    return NextResponse.json({ tax: { ...tax, createdAt: tax.createdAt?.toISOString() || null } });
  } catch { return NextResponse.json({ error: "Failed to fetch tax" }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");
    if (!sessionToken) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;
    if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { designation, value, taxType } = body;

    const existing = await prisma.tax.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Taxe non trouvée" }, { status: 404 });

    const hasAccess = await prisma.userOrganization.findFirst({ where: { userId, idOrg: existing.idOrg } });
    if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const tax = await prisma.tax.update({
      where: { id },
      data: { designation, value, taxType },
    });
    return NextResponse.json({ tax, success: true });
  } catch { return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");
    if (!sessionToken) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;
    if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.tax.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Taxe non trouvée" }, { status: 404 });

    const hasAccess = await prisma.userOrganization.findFirst({ where: { userId, idOrg: existing.idOrg } });
    if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    await prisma.tax.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 }); }
}
