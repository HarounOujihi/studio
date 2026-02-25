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

// Helper to get etbId and orgId from request
function getContextFromRequest(request: Request): { etbId: string | null; orgId: string | null } {
  const url = new URL(request.url);
  const etbId = url.searchParams.get("etbId") || request.headers.get("x-etb-id");
  const orgId = url.searchParams.get("orgId") || request.headers.get("x-org-id");
  return { etbId, orgId };
}

// Tree structure type
type CategoryTree = {
  id: string;
  reference: string;
  designation: string | null;
  slug: string | null;
  logo: string | null;
  image: string | null;
  isSubCategory: boolean | null;
  sortIndex: number | null;
  globalCategoryId: string | null;
  globalCategory: {
    id: string;
    name: string;
    nameFr: string | null;
    slug: string;
    iconName: string | null;
  } | null;
  children: CategoryTree[];
};

// Build tree from flat list
function buildTree(
  categories: any[],
  parentId: string | null = null
): CategoryTree[] {
  return categories
    .filter((c) => c.idParent === parentId)
    .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
    .map((category) => ({
      id: category.id,
      reference: category.reference,
      designation: category.designation,
      slug: category.slug,
      logo: category.logo,
      image: category.image,
      isSubCategory: category.isSubCategory,
      sortIndex: category.sortIndex,
      globalCategoryId: category.globalCategoryId,
      globalCategory: category.globalCategory,
      children: buildTree(categories, category.id),
    }));
}

// GET - List categories as tree
export async function GET(request: Request) {
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

    const { etbId } = getContextFromRequest(request);

    if (!etbId) {
      return NextResponse.json(
        { error: "Establishment ID (etbId) is required" },
        { status: 400 }
      );
    }

    // Verify user has access
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

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this establishment" },
        { status: 403 }
      );
    }

    // Get establishment to get orgId
    const establishment = await prisma.establishment.findUnique({
      where: { id: etbId },
      select: { idOrg: true },
    });

    if (!establishment) {
      return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    }

    // Fetch all categories for this establishment
    const categories = await prisma.category.findMany({
      where: {
        idEtb: etbId,
        idOrg: establishment.idOrg,
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
      orderBy: { sortIndex: "asc" },
    });

    // Build tree structure
    const tree = buildTree(categories);

    return NextResponse.json({ categories: tree, flat: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: Request) {
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

    const { etbId } = getContextFromRequest(request);

    if (!etbId) {
      return NextResponse.json(
        { error: "L'ID de l'établissement (etbId) est requis" },
        { status: 400 }
      );
    }

    // Verify user has access
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

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès refusé à cet établissement" },
        { status: 403 }
      );
    }

    // Get establishment
    const establishment = await prisma.establishment.findUnique({
      where: { id: etbId },
      select: { idOrg: true },
    });

    if (!establishment) {
      return NextResponse.json({ error: "Établissement non trouvé" }, { status: 404 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.designation) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    if (!body.globalCategoryId) {
      return NextResponse.json(
        { error: "La catégorie globale est requise" },
        { status: 400 }
      );
    }

    // Verify global category exists
    const globalCategory = await prisma.globalCategory.findUnique({
      where: { id: body.globalCategoryId },
    });

    if (!globalCategory) {
      return NextResponse.json(
        { error: "Catégorie globale non trouvée" },
        { status: 400 }
      );
    }

    // Verify parent exists if provided
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
    }

    // Auto-generate reference with format CTG00001 (unique by establishment)
    const lastCategory = await prisma.category.findFirst({
      where: { idEtb: etbId },
      orderBy: { reference: "desc" },
      select: { reference: true },
    });

    let nextNumber = 1;
    if (lastCategory?.reference) {
      const match = lastCategory.reference.match(/CTG(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const reference = `CTG${nextNumber.toString().padStart(5, "0")}`;

    // Generate unique slug if provided
    let slug = body.slug || null;
    if (slug) {
      // Check if slug exists for this establishment
      let slugExists = await prisma.category.findFirst({
        where: { idEtb: etbId, slug },
      });

      // Add suffix if slug exists
      let suffix = 1;
      while (slugExists) {
        slug = `${body.slug}-${suffix}`;
        slugExists = await prisma.category.findFirst({
          where: { idEtb: etbId, slug },
        });
        suffix++;
      }
    }

    // Get max sortIndex for siblings
    const maxSortIndex = await prisma.category.aggregate({
      where: {
        idEtb: etbId,
        idParent: body.idParent || null,
      },
      _max: { sortIndex: true },
    });

    const newSortIndex = (maxSortIndex._max.sortIndex ?? -1) + 1;

    // Create category
    const category = await prisma.category.create({
      data: {
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        idOrg: establishment.idOrg,
        idEtb: etbId,
        reference,
        designation: body.designation || null,
        slug,
        idParent: body.idParent || null,
        isSubCategory: !!body.idParent,
        logo: body.logo || null,
        image: body.image || null,
        description: body.description || null,
        shortDescription: body.shortDescription || null,
        globalCategoryId: body.globalCategoryId,
        sortIndex: newSortIndex,
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
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la catégorie" },
      { status: 500 }
    );
  }
}

// PUT - Reorder categories (for drag and drop)
export async function PUT(request: Request) {
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

    const { etbId } = getContextFromRequest(request);

    if (!etbId) {
      return NextResponse.json(
        { error: "Establishment ID (etbId) is required" },
        { status: 400 }
      );
    }

    // Verify user has access
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

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this establishment" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { updates } = body as { updates: Array<{ id: string; sortIndex: number; idParent: string | null }> };

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    // Update each category in a transaction
    await prisma.$transaction(
      updates.map((update) =>
        prisma.category.update({
          where: { id: update.id },
          data: {
            sortIndex: update.sortIndex,
            idParent: update.idParent,
            isSubCategory: update.idParent !== null,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering categories:", error);
    return NextResponse.json(
      { error: "Failed to reorder categories" },
      { status: 500 }
    );
  }
}
