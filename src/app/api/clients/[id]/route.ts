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

// GET - Get single client by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
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

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      client: {
        ...client,
        createdAt: client.createdAt?.toISOString() || null,
        updatedAt: client.updatedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT - Update client
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

    // Check if client exists and user has access
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: existingClient.idOrg,
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
    let addressId = existingClient.idAddress;

    if (street || city || country) {
      if (existingClient.idAddress) {
        // Update existing address
        await prisma.address.update({
          where: { id: existingClient.idAddress },
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
            idOrg: existingClient.idOrg,
            idEtb: existingClient.idEtb,
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

    // Update client
    const client = await prisma.client.update({
      where: { id },
      data: {
        firstName: firstName ?? existingClient.firstName,
        lastName: lastName ?? existingClient.lastName,
        companyName: companyName ?? existingClient.companyName,
        email: email ?? existingClient.email,
        tel: tel ?? existingClient.tel,
        nature: nature ?? existingClient.nature,
        taxIdNumber: taxIdNumber ?? existingClient.taxIdNumber,
        personalIdType: personalIdType ?? existingClient.personalIdType,
        personalId: personalId ?? existingClient.personalId,
        customsCode: customsCode ?? existingClient.customsCode,
        note: note ?? existingClient.note,
        idTax: idTax ?? existingClient.idTax,
        idBankAccount: idBankAccount ?? existingClient.idBankAccount,
        idAddress: addressId,
      },
      include: {
        address: true,
      },
    });

    return NextResponse.json({ client, success: true });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du client" },
      { status: 500 }
    );
  }
}

// DELETE - Delete client
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

    // Check if client exists and user has access
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: existingClient.idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Delete client's address if exists
    if (existingClient.idAddress) {
      await prisma.address.delete({
        where: { id: existingClient.idAddress },
      });
    }

    // Delete client
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du client" },
      { status: 500 }
    );
  }
}
