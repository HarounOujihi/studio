import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.OIDC_SECRET || "your-secret-key");
type JWTPayload = { user?: { id: string }; exp?: number };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: { address: true },
    });
    if (!deposit) return NextResponse.json({ error: "Dépôt non trouvé" }, { status: 404 });
    return NextResponse.json({ deposit: { ...deposit, createdAt: deposit.createdAt?.toISOString() || null } });
  } catch { return NextResponse.json({ error: "Failed to fetch deposit" }, { status: 500 }); }
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
    const { designation, type, isDefault, street, street2, city, state, zipCode, country } = body;

    const existing = await prisma.deposit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Dépôt non trouvé" }, { status: 404 });

    const hasAccess = await prisma.userOrganization.findFirst({ where: { userId, idOrg: existing.idOrg } });
    if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    let addressId = existing.idAddress;
    if (street || city || country) {
      if (existing.idAddress) {
        await prisma.address.update({ where: { id: existing.idAddress }, data: { street: street || null, street2: street2 || null, city: city || null, state: state || null, zipCode: zipCode || null, country: country || null } });
      } else {
        const addr = await prisma.address.create({ data: { id: `addr-${crypto.randomUUID().slice(0,8)}`, idOrg: existing.idOrg, idEtb: existing.idEtb, street: street || null, street2: street2 || null, city: city || null, state: state || null, zipCode: zipCode || null, country: country || null } });
        addressId = addr.id;
      }
    }

    if (isDefault) {
      await prisma.deposit.updateMany({ where: { idOrg: existing.idOrg, idEtb: existing.idEtb, isDefault: true }, data: { isDefault: false } });
    }

    const deposit = await prisma.deposit.update({
      where: { id },
      data: { designation, type, isDefault: isDefault || false, idAddress: addressId },
      include: { address: true },
    });
    return NextResponse.json({ deposit, success: true });
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
    const existing = await prisma.deposit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Dépôt non trouvé" }, { status: 404 });

    const hasAccess = await prisma.userOrganization.findFirst({ where: { userId, idOrg: existing.idOrg } });
    if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    if (existing.idAddress) await prisma.address.delete({ where: { id: existing.idAddress } });
    await prisma.deposit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 }); }
}
