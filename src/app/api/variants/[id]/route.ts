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

// DELETE - Delete a variant and its sub-article
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

    // Get the variant
    const variant = await prisma.variantProps.findUnique({
      where: { id },
      include: {
        subArticleProps: {
          include: {
            parentArticleProps: true, // Child variants
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variante non trouvée" }, { status: 404 });
    }

    // Check if variant has children
    if (variant.subArticleProps && variant.subArticleProps.parentArticleProps?.length > 0) {
      return NextResponse.json(
        { error: "Cette variante a des sous-variantes. Supprimez d'abord les sous-variantes." },
        { status: 400 }
      );
    }

    // Verify user has access to the organization
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: variant.idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const subArticleId = variant.idSubArticle;

    // Delete the variant first
    await prisma.variantProps.delete({
      where: { id },
    });

    // Try to delete the sub-article if it exists
    if (subArticleId) {
      try {
        // Check if sub-article has movements or other relations that prevent deletion
        const movementsCount = await prisma.movement.count({
          where: { idArticle: subArticleId },
        });

        if (movementsCount > 0) {
          // Can't delete the sub-article, but variant is already deleted
          // This is okay - the sub-article becomes an orphan but remains for history
          return NextResponse.json({
            success: true,
            warning: "La variante a été supprimée, mais le sous-article ne peut pas être supprimé car il est utilisé dans des mouvements."
          });
        }

        // Delete related records first
        await prisma.articleTag.deleteMany({
          where: { idArticle: subArticleId },
        });

        await prisma.articleCategories.deleteMany({
          where: { idArticle: subArticleId },
        });

        await prisma.articleDeposits.deleteMany({
          where: { idArticle: subArticleId },
        });

        await prisma.pricing.deleteMany({
          where: { idArticle: subArticleId },
        });

        await prisma.discount.deleteMany({
          where: { idArticle: subArticleId },
        });

        // Delete the sub-article
        await prisma.article.delete({
          where: { id: subArticleId },
        });
      } catch (deleteError) {
        console.error("Error deleting sub-article:", deleteError);
        // Variant is deleted, sub-article deletion failed - this is acceptable
        return NextResponse.json({
          success: true,
          warning: "La variante a été supprimée, mais le sous-article n'a pas pu être supprimé."
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la variante" },
      { status: 500 }
    );
  }
}

// PUT - Update a variant
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
    const { type, value, designation, image } = body;

    // Get the variant
    const variant = await prisma.variantProps.findUnique({
      where: { id },
      include: {
        subArticleProps: true,
        parentArticleProps: {
          include: {
            articles: {
              select: { designation: true },
            },
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variante non trouvée" }, { status: 404 });
    }

    // Verify user has access
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: variant.idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Update the variant
    const updatedVariant = await prisma.variantProps.update({
      where: { id },
      data: {
        type: type || variant.type,
        value: value ?? variant.value,
        designation: designation ?? variant.designation,
        image: image ?? variant.image,
      },
    });

    // Update the sub-article designation if exists
    if (variant.idSubArticle && designation) {
      // Get parent article designation
      const parentArticle = await prisma.article.findUnique({
        where: { id: variant.idArticle },
        select: { designation: true },
      });

      await prisma.article.update({
        where: { id: variant.idSubArticle },
        data: {
          designation: `${parentArticle?.designation || ""} ${designation}`,
          media: image ?? variant.subArticleProps?.media,
        },
      });
    }

    return NextResponse.json({ success: true, variant: updatedVariant });
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la variante" },
      { status: 500 }
    );
  }
}
