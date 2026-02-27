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

// DELETE - Delete a media
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

    // Get the media
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json({ error: "Média non trouvé" }, { status: 404 });
    }

    // Verify user has access to the organization
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: media.idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Delete the media
    await prisma.media.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du média" },
      { status: 500 }
    );
  }
}

// PUT - Update a media (sortIndex, isDefault)
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
    const { sortIndex, isDefault } = body;

    // Get the media
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json({ error: "Média non trouvé" }, { status: 404 });
    }

    // Verify user has access to the organization
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: media.idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Update the media
    const updateData: { sortIndex?: number; isDefault?: boolean } = {};
    if (sortIndex !== undefined) updateData.sortIndex = sortIndex;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedMedia = await prisma.media.update({
      where: { id },
      data: updateData,
    });

    // If setting as default, unset other defaults for the same article
    if (isDefault && media.idArticle) {
      await prisma.media.updateMany({
        where: {
          idArticle: media.idArticle,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    return NextResponse.json({ success: true, media: updatedMedia });
  } catch (error) {
    console.error("Error updating media:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du média" },
      { status: 500 }
    );
  }
}
