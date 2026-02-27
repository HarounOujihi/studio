import { NextRequest, NextResponse } from "next/server";
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

// GET - Get single provider by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        address: true,
        tax: true,
        bankAccount: {
          include: {
            bank: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "Fournisseur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      provider: {
        ...provider,
        createdAt: provider.createdAt?.toISOString() || null,
        updatedAt: provider.updatedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error fetching provider:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider" },
      { status: 500 }
    );
  }
}

// PUT - Update provider
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // Check if provider exists and user has access
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json({ error: "Fournisseur non trouvé" }, { status: 404 });
    }

    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: existingProvider.idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const {
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

    // Handle address update
    let addressId = existingProvider.idAddress;

    if (street || city || country) {
      if (existingProvider.idAddress) {
        // Update existing address
        await prisma.address.update({
          where: { id: existingProvider.idAddress },
          data: {
            street: street || null,
            street2: street2 || null,
            city: city || null,
            state: state || null,
            zipCode: zipCode || null,
            country: country || null,
          },
        });
      } else {
        // Create new address
        const address = await prisma.address.create({
          data: {
            id: `addr-${crypto.randomUUID().slice(0, 8)}`,
            idOrg: existingProvider.idOrg,
            idEtb: existingProvider.idEtb,
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
    }

    // Update provider
    const provider = await prisma.provider.update({
      where: { id },
      data: {
        firstName: firstName ?? existingProvider.firstName,
        lastName: lastName ?? existingProvider.lastName,
        companyName: companyName ?? existingProvider.companyName,
        email: email ?? existingProvider.email,
        tel: tel ?? existingProvider.tel,
        nature: nature ?? existingProvider.nature,
        taxIdNumber: taxIdNumber ?? existingProvider.taxIdNumber,
        personalIdType: personalIdType ?? existingProvider.personalIdType,
        personalId: personalId ?? existingProvider.personalId,
        customsCode: customsCode ?? existingProvider.customsCode,
        note: note ?? existingProvider.note,
        idTax: idTax ?? existingProvider.idTax,
        idBankAccount: idBankAccount ?? existingProvider.idBankAccount,
        idAddress: addressId,
      },
      include: {
        address: true,
      },
    });

    return NextResponse.json({ provider, success: true });
  } catch (error) {
    console.error("Error updating provider:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du fournisseur" },
      { status: 500 }
    );
  }
}

// DELETE - Delete provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if provider exists and user has access
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json({ error: "Fournisseur non trouvé" }, { status: 404 });
    }

    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: existingProvider.idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Delete provider's address if exists
    if (existingProvider.idAddress) {
      await prisma.address.delete({
        where: { id: existingProvider.idAddress },
      });
    }

    // Delete provider
    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting provider:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fournisseur" },
      { status: 500 }
    );
  }
}
