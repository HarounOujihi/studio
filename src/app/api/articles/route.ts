import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

type JWTPayload = {
  user?: {
    id: string;
  };
  exp?: number;
};

// Helper to generate slug from designation (supports Arabic)
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-") // Keep alphanumeric + Arabic
    .replace(/(^-|-$)/g, ""); // Remove leading/trailing hyphens
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idOrg = searchParams.get("idOrg");
    const idEtb = searchParams.get("idEtb");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const isPublish = searchParams.get("isPublish");
    const productType = searchParams.get("productType");
    const search = searchParams.get("search");

    // Validate required scope
    if (!idOrg || !idEtb) {
      return NextResponse.json(
        { error: "idOrg and idEtb are required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      idOrg,
      idEtb,
    };

    if (isPublish === "true") {
      where.isPublish = true;
    } else if (isPublish === "false") {
      where.isPublish = false;
    }

    if (productType) {
      where.productType = productType;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.article.count({ where });

    // Fetch paginated articles
    const articles = await prisma.article.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST - Create new article
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      idOrg, idEtb, designation, slug: providedSlug, shortDescription, media,
      categoryIds, tagIds, isPublish,
      // Pricing fields
      salePrice, purchasePrice, fees, profitMargin, profitType, taxId,
      // Discount fields
      discountPercent, discountStartDate, discountEndDate,
      // Variants
      variants
    } = body;

    // Validate required fields
    if (!idOrg || !idEtb) {
      return NextResponse.json(
        { error: "Organisation et établissement requis" },
        { status: 400 }
      );
    }

    if (!designation) {
      return NextResponse.json(
        { error: "La désignation est requise" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Get default deposit and first unit for auto-fill
    const defaultDeposit = await prisma.deposit.findFirst({
      where: { idOrg, idEtb, isDefault: true },
    });

    const firstUnit = await prisma.unit.findFirst({
      where: { idOrg, idEtb },
    });

    // Generate unique reference (ART00001 format)
    const lastArticle = await prisma.article.findFirst({
      where: { idOrg, idEtb },
      orderBy: { reference: "desc" },
    });

    const lastRef = lastArticle?.reference || "ART00000";
    const refNum = (parseInt(lastRef.replace("ART", "")) || 0) + 1;
    const reference = `ART${String(refNum).padStart(5, "0")}`;

    // Generate unique slug (use provided or create from designation)
    let slug = providedSlug || slugify(designation);

    // Ensure slug is unique within the establishment
    const existingSlugCount = await prisma.article.count({
      where: { idOrg, idEtb, slug },
    });
    if (existingSlugCount > 0) {
      // Try with suffix until unique
      let suffix = 1;
      let uniqueSlug = `${slug}-${suffix}`;
      while (await prisma.article.count({ where: { idOrg, idEtb, slug: uniqueSlug } }) > 0) {
        suffix++;
        uniqueSlug = `${slug}-${suffix}`;
      }
      slug = uniqueSlug;
    }

    // Create article
    const articleId = `art-${nanoid()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articleData: any = {
      id: articleId,
      idOrg,
      idEtb,
      reference,
      slug,
      designation,
      shortDescription: shortDescription || null,
      media: media || null,
      isPublish: isPublish ?? false,
      picking: "FIFO",
      stockManagement: "IN_STOCK",
      articleManagement: "BY_EAN",
      saleUnit: firstUnit?.id || null,
      purchaseUnit: firstUnit?.id || null,
    };

    const article = await prisma.article.create({
      data: articleData,
    });

    // Create category relations
    if (categoryIds && categoryIds.length > 0) {
      await prisma.articleCategories.createMany({
        data: categoryIds.map((idCategory: string) => ({
          idOrg,
          idEtb,
          idArticle: articleId,
          idCategory,
        })),
      });
    }

    // Create tag relations
    if (tagIds && tagIds.length > 0) {
      await prisma.articleTag.createMany({
        data: tagIds.map((idTag: string) => ({
          idArticle: articleId,
          idTag,
        })),
      });
    }

    // Create deposit relation
    if (defaultDeposit) {
      await prisma.articleDeposits.create({
        data: {
          idOrg,
          idEtb,
          idArticle: articleId,
          idDeposit: defaultDeposit.id,
        },
      });
    }

    // Get first tax as default if no taxId provided
    let finalTaxId = taxId;
    if (!finalTaxId) {
      const firstTax = await prisma.tax.findFirst({
        where: { idOrg, idEtb },
      });
      finalTaxId = firstTax?.id || null;
    }

    // Create pricing record
    await prisma.pricing.create({
      data: {
        id: `price-${nanoid()}`,
        idOrg,
        idEtb,
        idArticle: articleId,
        idTax: finalTaxId,
        purchasePrice: purchasePrice || 0,
        fees: fees || 0,
        profitType: profitType || "PERCENT",
        profitMargin: profitMargin || 0,
        salePrice: salePrice || 0,
        effectDate: new Date(),
      },
    });

    // Create discount record if discount percentage is provided
    if (discountPercent && discountPercent > 0) {
      const discountId = `disc-${nanoid()}`;

      // Generate discount reference
      const lastDiscount = await prisma.discount.findFirst({
        where: { idOrg, idEtb },
        orderBy: { reference: "desc" },
      });
      const lastDiscRef = lastDiscount?.reference || "DISC00000";
      const discRefNum = (parseInt(lastDiscRef.replace("DISC", "")) || 0) + 1;
      const discountRef = `DISC${String(discRefNum).padStart(5, "0")}`;

      await prisma.discount.create({
        data: {
          id: discountId,
          idOrg,
          idEtb,
          reference: discountRef,
          value: discountPercent,
          startDate: discountStartDate ? new Date(discountStartDate) : new Date(),
          endDate: discountEndDate ? new Date(discountEndDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
          idArticle: articleId,
          profitType: "PERCENT",
        },
      });
    }

    // Helper function to create variant hierarchy recursively
    type VariantInput = {
      id: string;
      type: string;
      value: string;
      designation: string;
      image?: string;
      children?: VariantInput[];
    };

    async function createVariantHierarchy(
      parentId: string,
      parentRef: string,
      parentDesignation: string,
      variantList: VariantInput[]
    ): Promise<void> {
      for (const variant of variantList) {
        if (!variant.value || !variant.designation) continue;

        // Create sub-article
        const subArticleId = `art-${nanoid()}`;
        const subArticleRef = `${parentRef}-${slugify(variant.value)}`;
        const subArticleSlug = `${slug}-${slugify(variant.value)}`;

        // Check slug uniqueness
        let uniqueSlug = subArticleSlug;
        const slugCount = await prisma.article.count({
          where: { idOrg, idEtb, slug: subArticleSlug },
        });
        if (slugCount > 0) {
          uniqueSlug = `${subArticleSlug}-${Date.now()}`;
        }

        await prisma.article.create({
          data: {
            id: subArticleId,
            idOrg,
            idEtb,
            reference: subArticleRef.toUpperCase(),
            slug: uniqueSlug,
            designation: `${parentDesignation} ${variant.designation}`,
            shortDescription: shortDescription || null,
            media: variant.image || media || null,
            isPublish: isPublish ?? false,
            isSubArticle: true,
            idParent: parentId,
            picking: "FIFO",
            stockManagement: "IN_STOCK",
            articleManagement: "BY_EAN",
            saleUnit: firstUnit?.id || null,
            purchaseUnit: firstUnit?.id || null,
          },
        });

        // Create pricing for sub-article
        await prisma.pricing.create({
          data: {
            id: `price-${nanoid()}`,
            idOrg,
            idEtb,
            idArticle: subArticleId,
            idTax: finalTaxId,
            purchasePrice: purchasePrice || 0,
            fees: fees || 0,
            profitType: profitType || "PERCENT",
            profitMargin: profitMargin || 0,
            salePrice: salePrice || 0,
            effectDate: new Date(),
          },
        });

        // Create discount for sub-article if parent has discount
        if (discountPercent && discountPercent > 0) {
          const discId = `disc-${nanoid()}`;
          await prisma.discount.create({
            data: {
              id: discId,
              idOrg,
              idEtb,
              reference: `DISC-${subArticleRef}`,
              value: discountPercent,
              startDate: discountStartDate ? new Date(discountStartDate) : new Date(),
              endDate: discountEndDate ? new Date(discountEndDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              idArticle: subArticleId,
              profitType: "PERCENT",
            },
          });
        }

        // Create VariantProps record
        const lastVariant = await prisma.variantProps.findFirst({
          where: { idOrg, idEtb },
          orderBy: { reference: "desc" },
        });
        const lastVarRef = lastVariant?.reference || "VAR00000";
        const varRefNum = (parseInt(lastVarRef.replace("VAR", "")) || 0) + 1;
        const variantRef = `VAR${String(varRefNum).padStart(5, "0")}`;

        await prisma.variantProps.create({
          data: {
            id: `var-${nanoid()}`,
            idOrg,
            idEtb,
            idArticle: parentId,
            idSubArticle: subArticleId,
            reference: variantRef,
            designation: variant.designation,
            type: variant.type as "COLOR" | "SIZE" | "NUMBER" | "TEXT",
            value: variant.value,
            image: variant.image || null,
          },
        });

        // Recursively create children variants
        if (variant.children && variant.children.length > 0) {
          await createVariantHierarchy(
            subArticleId,
            subArticleRef,
            `${parentDesignation} ${variant.designation}`,
            variant.children
          );
        }
      }
    }

    // Create variants if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      await createVariantHierarchy(articleId, reference, designation, variants);
    }

    return NextResponse.json({ article, success: true });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'article" },
      { status: 500 }
    );
  }
}
