import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.OIDC_SECRET || "your-secret-key");
type JWTPayload = { user?: { id: string }; exp?: number };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) return NextResponse.json({ error: "Unité non trouvée" }, { status: 404 });
    return NextResponse.json({ unit: { ...unit, createdAt: unit.createdAt?.toISOString() || null } });
  } catch { return NextResponse.json({ error: "Failed to fetch unit" }, { status: 500 }); }
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
    const { designation } = body;

    const existing = await prisma.unit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Unité non trouvée" }, { status: 404 });

    const hasAccess = await prisma.userOrganization.findFirst({ where: { userId, idOrg: existing.idOrg } });
    if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const unit = await prisma.unit.update({ where: { id }, data: { designation } });
    return NextResponse.json({ unit, success: true });
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
    const existing = await prisma.unit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Unité non trouvée" }, { status: 404 });

    const hasAccess = await prisma.userOrganization.findFirst({ where: { userId, idOrg: existing.idOrg } });
    if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    await prisma.unit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 }); }
}
