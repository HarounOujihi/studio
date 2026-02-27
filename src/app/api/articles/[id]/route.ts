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

// GET - Fetch single article with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        articleCategories: {
          select: {
            idCategory: true,
          },
        },
        pricing: {
          orderBy: { effectDate: "desc" },
        },
        discounts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }

    // Fetch tags separately via ArticleTag
    const articleTags = await prisma.articleTag.findMany({
      where: { idArticle: id },
      select: { idTag: true },
    });

    // Fetch deposits separately via ArticleDeposits
    const articleDeposits = await prisma.articleDeposits.findMany({
      where: { idArticle: id },
      select: { idDeposit: true },
    });

    // Fetch variants (VariantProps where this article is the parent)
    const variants = await prisma.variantProps.findMany({
      where: { idArticle: id },
      include: {
        subArticleProps: {
          select: {
            id: true,
            designation: true,
            reference: true,
            media: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Build variant tree structure
    type VariantWithChildren = typeof variants[0] & { children: VariantWithChildren[] };

    async function buildVariantTree(parentId: string): Promise<VariantWithChildren[]> {
      const childVariants = await prisma.variantProps.findMany({
        where: { idArticle: parentId },
        include: {
          subArticleProps: {
            select: {
              id: true,
              designation: true,
              reference: true,
              media: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const result: VariantWithChildren[] = [];
      for (const variant of childVariants) {
        const children = await buildVariantTree(variant.idSubArticle);
        result.push({ ...variant, children } as VariantWithChildren);
      }
      return result;
    }

    const variantTree = await buildVariantTree(id);

    return NextResponse.json({
      article,
      variants: variantTree,
      categoryIds: article.articleCategories.map((c) => c.idCategory),
      tagIds: articleTags.map((t) => t.idTag),
      depositIds: articleDeposits.map((d) => d.idDeposit),
      pricings: article.pricing, // All pricings
      discounts: article.discounts, // All discounts
      activePricing: article.pricing[0] || null, // Most recent
      activeDiscount: article.discounts.find(d => new Date(d.startDate) <= new Date() && new Date(d.endDate) >= new Date()) || null,
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de l'article" },
      { status: 500 }
    );
  }
}

// PUT - Update article
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
    const {
      idOrg, idEtb, designation, slug: providedSlug, shortDescription, media,
      categoryIds, tagIds, isPublish,
      // Pricing fields
      salePrice, purchasePrice, fees, profitMargin, profitType, taxId,
      // Discount fields
      discountPercent, discountStartDate, discountEndDate,
      // Variants
      variants,
    } = body;

    // Verify article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }

    // Verify user has access
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: existingArticle.idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Generate unique slug if changed
    let slug = providedSlug || existingArticle.slug;
    if (designation && designation !== existingArticle.designation) {
      slug = slugify(designation);
    }

    // Ensure slug is unique within the establishment
    if (slug !== existingArticle.slug) {
      const existingSlugCount = await prisma.article.count({
        where: { idOrg: existingArticle.idOrg, idEtb: existingArticle.idEtb, slug, id: { not: id } },
      });
      if (existingSlugCount > 0) {
        let suffix = 1;
        let uniqueSlug = `${slug}-${suffix}`;
        while (await prisma.article.count({
          where: { idOrg: existingArticle.idOrg, idEtb: existingArticle.idEtb, slug: uniqueSlug, id: { not: id } }
        }) > 0) {
          suffix++;
          uniqueSlug = `${slug}-${suffix}`;
        }
        slug = uniqueSlug;
      }
    }

    // Update article
    const articleData: Record<string, unknown> = {
      designation: designation ?? existingArticle.designation,
      slug,
      shortDescription: shortDescription ?? existingArticle.shortDescription,
      media: media ?? existingArticle.media,
      isPublish: isPublish ?? existingArticle.isPublish,
    };

    const article = await prisma.article.update({
      where: { id },
      data: articleData,
    });

    // Update category relations
    if (categoryIds !== undefined) {
      await prisma.articleCategories.deleteMany({
        where: { idArticle: id },
      });
      if (categoryIds && categoryIds.length > 0) {
        await prisma.articleCategories.createMany({
          data: categoryIds.map((idCategory: string) => ({
            idOrg: existingArticle.idOrg,
            idEtb: existingArticle.idEtb,
            idArticle: id,
            idCategory,
          })),
        });
      }
    }

    // Update tag relations
    if (tagIds !== undefined) {
      await prisma.articleTag.deleteMany({
        where: { idArticle: id },
      });
      if (tagIds && tagIds.length > 0) {
        await prisma.articleTag.createMany({
          data: tagIds.map((idTag: string) => ({
            idArticle: id,
            idTag,
          })),
        });
      }
    }

    // Update pricing if provided
    if (salePrice !== undefined || purchasePrice !== undefined) {
      const currentPricing = await prisma.pricing.findFirst({
        where: { idArticle: id },
        orderBy: { effectDate: "desc" },
      });

      if (currentPricing) {
        await prisma.pricing.update({
          where: { id: currentPricing.id },
          data: {
            purchasePrice: purchasePrice ?? currentPricing.purchasePrice,
            fees: fees ?? currentPricing.fees,
            profitType: profitType ?? currentPricing.profitType,
            profitMargin: profitMargin ?? currentPricing.profitMargin,
            salePrice: salePrice ?? currentPricing.salePrice,
            idTax: taxId ?? currentPricing.idTax,
          },
        });
      } else {
        // Create new pricing if none exists
        await prisma.pricing.create({
          data: {
            id: `price-${nanoid()}`,
            idOrg: existingArticle.idOrg,
            idEtb: existingArticle.idEtb,
            idArticle: id,
            idTax: taxId,
            purchasePrice: purchasePrice || 0,
            fees: fees || 0,
            profitType: profitType || "PERCENT",
            profitMargin: profitMargin || 0,
            salePrice: salePrice || 0,
            effectDate: new Date(),
          },
        });
      }
    }

    // Update discount if provided
    if (discountPercent !== undefined) {
      const currentDiscount = await prisma.discount.findFirst({
        where: { idArticle: id },
        orderBy: { createdAt: "desc" },
      });

      if (currentDiscount) {
        if (discountPercent > 0) {
          await prisma.discount.update({
            where: { id: currentDiscount.id },
            data: {
              value: discountPercent,
              startDate: discountStartDate ? new Date(discountStartDate) : currentDiscount.startDate,
              endDate: discountEndDate ? new Date(discountEndDate) : currentDiscount.endDate,
            },
          });
        } else {
          // Delete discount if percent is 0
          await prisma.discount.delete({
            where: { id: currentDiscount.id },
          });
        }
      } else if (discountPercent > 0) {
        // Create new discount
        const discountId = `disc-${nanoid()}`;
        const lastDiscount = await prisma.discount.findFirst({
          where: { idOrg: existingArticle.idOrg, idEtb: existingArticle.idEtb },
          orderBy: { reference: "desc" },
        });
        const lastDiscRef = lastDiscount?.reference || "DISC00000";
        const discRefNum = (parseInt(lastDiscRef.replace("DISC", "")) || 0) + 1;
        const discountRef = `DISC${String(discRefNum).padStart(5, "0")}`;

        await prisma.discount.create({
          data: {
            id: discountId,
            idOrg: existingArticle.idOrg,
            idEtb: existingArticle.idEtb,
            reference: discountRef,
            value: discountPercent,
            startDate: discountStartDate ? new Date(discountStartDate) : new Date(),
            endDate: discountEndDate ? new Date(discountEndDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            idArticle: id,
            profitType: "PERCENT",
          },
        });
      }
    }

    // Handle variants update - reorder and update
    if (variants && Array.isArray(variants)) {
      // Helper to update variant and its sub-article
      async function updateVariantWithChildren(
        variantId: string,
        variantData: { type: string; value: string; designation: string; image?: string; order: number },
        parentId: string
      ) {
        const existingVariant = await prisma.variantProps.findUnique({
          where: { id: variantId },
          include: { subArticleProps: true },
        });

        if (existingVariant) {
          // Update variant
          await prisma.variantProps.update({
            where: { id: variantId },
            data: {
              type: variantData.type as "COLOR" | "SIZE" | "NUMBER" | "TEXT",
              value: variantData.value,
              designation: variantData.designation,
              image: variantData.image || null,
            },
          });

          // Update sub-article designation
          if (existingVariant.idSubArticle) {
            const parent = await prisma.article.findUnique({
              where: { id: parentId },
              select: { designation: true },
            });
            await prisma.article.update({
              where: { id: existingVariant.idSubArticle },
              data: {
                designation: `${parent?.designation || ""} ${variantData.designation}`,
                media: variantData.image || existingVariant.subArticleProps?.media,
              },
            });
          }
        }
      }

      // Process variants in order
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (variant.id && !variant.id.startsWith("var-")) {
          // Existing variant
          await updateVariantWithChildren(variant.id, {
            type: variant.type,
            value: variant.value,
            designation: variant.designation,
            image: variant.image,
            order: i,
          }, id);
        }
      }
    }

    return NextResponse.json({ article, success: true });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'article" },
      { status: 500 }
    );
  }
}

// DELETE - Delete article
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

    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }

    // Verify user has access
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: article.idOrg,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Delete article (cascade should handle related records)
    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'article" },
      { status: 500 }
    );
  }
}
