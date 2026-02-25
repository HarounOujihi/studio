import { NextResponse } from "next/server";
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

async function verifyAccess(userId: string, etbId: string): Promise<boolean> {
  const hasAccess = await prisma.userOrganization.findFirst({
    where: {
      userId,
      organization: {
        establishments: {
          some: { id: etbId },
        },
      },
    },
  });
  return !!hasAccess;
}

// GET single category
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const etbId = url.searchParams.get("etbId");

    if (!etbId) {
      return NextResponse.json(
        { error: "Establishment ID (etbId) is required" },
        { status: 400 }
      );
    }

    if (!(await verifyAccess(userId, etbId))) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        globalCategory: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            slug: true,
            iconName: true,
          },
        },
        parent: {
          select: {
            id: true,
            designation: true,
            reference: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PATCH update category
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const etbId = url.searchParams.get("etbId");

    if (!etbId) {
      return NextResponse.json(
        { error: "Establishment ID (etbId) is required" },
        { status: 400 }
      );
    }

    if (!(await verifyAccess(userId, etbId))) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate global category if provided
    if (body.globalCategoryId) {
      const globalCategory = await prisma.globalCategory.findUnique({
        where: { id: body.globalCategoryId },
      });
      if (!globalCategory) {
        return NextResponse.json(
          { error: "Catégorie globale non trouvée" },
          { status: 400 }
        );
      }
    }

    // Verify parent exists if provided
    if (body.idParent !== undefined) {
      if (body.idParent) {
        const parent = await prisma.category.findUnique({
          where: { id: body.idParent },
        });
        if (!parent) {
          return NextResponse.json(
            { error: "Catégorie parente non trouvée" },
            { status: 400 }
          );
        }
        // Prevent circular reference
        if (body.idParent === id) {
          return NextResponse.json(
            { error: "Impossible de définir la catégorie comme son propre parent" },
            { status: 400 }
          );
        }
      }
    }

    // Generate unique slug if provided
    let slug = body.slug !== undefined ? body.slug : undefined;
    if (slug !== undefined && slug !== null) {
      // Check if slug exists for this establishment (excluding current category)
      let slugExists = await prisma.category.findFirst({
        where: { idEtb: etbId, slug, id: { not: id } },
      });

      // Add suffix if slug exists
      let suffix = 1;
      const baseSlug = slug;
      while (slugExists) {
        slug = `${baseSlug}-${suffix}`;
        slugExists = await prisma.category.findFirst({
          where: { idEtb: etbId, slug, id: { not: id } },
        });
        suffix++;
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(body.designation !== undefined && { designation: body.designation || null }),
        ...(slug !== undefined && { slug: slug || null }),
        ...(body.logo !== undefined && { logo: body.logo || null }),
        ...(body.image !== undefined && { image: body.image || null }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.shortDescription !== undefined && { shortDescription: body.shortDescription || null }),
        ...(body.globalCategoryId !== undefined && { globalCategoryId: body.globalCategoryId }),
        ...(body.idParent !== undefined && {
          idParent: body.idParent || null,
          isSubCategory: !!body.idParent,
        }),
      },
      include: {
        globalCategory: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            slug: true,
            iconName: true,
          },
        },
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la catégorie" },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const etbId = url.searchParams.get("etbId");

    if (!etbId) {
      return NextResponse.json(
        { error: "Establishment ID (etbId) is required" },
        { status: 400 }
      );
    }

    if (!(await verifyAccess(userId, etbId))) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if category has children
    const childrenCount = await prisma.category.count({
      where: { idParent: id },
    });

    if (childrenCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories. Delete or move them first." },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
