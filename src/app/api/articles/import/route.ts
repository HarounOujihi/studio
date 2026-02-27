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

type ImportRow = {
  designation: string;
  parentId: string;
  variantType: string;
  variantValue: string;
  salePrice: string;
  shortDescription: string;
  isPublish: string;
};

// POST - Import articles from CSV
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
    const { idOrg, idEtb, articles } = body as {
      idOrg: string;
      idEtb: string;
      articles: ImportRow[];
    };

    if (!idOrg || !idEtb) {
      return NextResponse.json(
        { error: "Organisation et établissement requis" },
        { status: 400 }
      );
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json(
        { error: "Aucun article à importer" },
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
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Get defaults
    const firstUnit = await prisma.unit.findFirst({
      where: { idOrg, idEtb },
    });

    const firstTax = await prisma.tax.findFirst({
      where: { idOrg, idEtb },
    });

    const defaultDeposit = await prisma.deposit.findFirst({
      where: { idOrg, idEtb, isDefault: true },
    });

    // Get last article reference for incrementing
    const lastArticle = await prisma.article.findFirst({
      where: { idOrg, idEtb },
      orderBy: { reference: "desc" },
    });

    let refCounter = 1;
    if (lastArticle?.reference) {
      const lastRef = lastArticle.reference.replace("ART", "");
      refCounter = (parseInt(lastRef) || 0) + 1;
    }

    // Helper to generate reference
    const generateReference = () => {
      const ref = `ART${String(refCounter).padStart(5, "0")}`;
      refCounter++;
      return ref;
    };

    // Helper to generate slug
    function slugify(text: string): string {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Group articles by parentId to build hierarchy
    const parentGroups: Map<string, ImportRow[]> = new Map();
    const parentArticles: ImportRow[] = [];

    for (const row of articles) {
      if (!row.parentId || row.parentId.trim() === "") {
        parentArticles.push(row);
      } else {
        const existing = parentGroups.get(row.parentId) || [];
        existing.push(row);
        parentGroups.set(row.parentId, existing);
      }
    }

    // Track created articles by temp parent ID
    const createdArticles: Map<string, { id: string; reference: string; designation: string }> = new Map();
    const results = {
      created: 0,
      variants: 0,
      errors: [] as string[],
    };

    // Create parent articles first
    for (let i = 0; i < parentArticles.length; i++) {
      const row = parentArticles[i];
      const tempId = String(i + 1);

      if (!row.designation?.trim()) {
        results.errors.push(`Ligne ${i + 1}: Désignation requise`);
        continue;
      }

      try {
        const articleId = `art-${nanoid()}`;
        const reference = generateReference();
        const slug = slugify(row.designation);
        const salePrice = parseFloat(row.salePrice) || 0;
        const isPublish = row.isPublish?.toLowerCase() === "true";

        // Create article
        await prisma.article.create({
          data: {
            id: articleId,
            idOrg,
            idEtb,
            reference,
            slug,
            designation: row.designation,
            shortDescription: row.shortDescription || null,
            isPublish,
            picking: "FIFO",
            stockManagement: "IN_STOCK",
            articleManagement: "BY_EAN",
            saleUnit: firstUnit?.id || null,
            purchaseUnit: firstUnit?.id || null,
          },
        });

        // Create pricing
        await prisma.pricing.create({
          data: {
            id: `price-${nanoid()}`,
            idOrg,
            idEtb,
            idArticle: articleId,
            idTax: firstTax?.id || null,
            purchasePrice: 0,
            fees: 0,
            profitType: "PERCENT",
            profitMargin: 0,
            salePrice,
            effectDate: new Date(),
          },
        });

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

        createdArticles.set(tempId, { id: articleId, reference, designation: row.designation });
        results.created++;

        // Create variants for this parent
        const variants = parentGroups.get(tempId) || [];
        for (const variantRow of variants) {
          if (!variantRow.variantValue?.trim()) continue;

          const variantArticleId = `art-${nanoid()}`;
          const variantReference = `${reference}-${slugify(variantRow.variantValue)}`;
          const variantSlug = `${slug}-${slugify(variantRow.variantValue)}`;
          const variantPrice = parseFloat(variantRow.salePrice) || salePrice;

          // Check slug uniqueness
          let uniqueSlug = variantSlug;
          const slugCount = await prisma.article.count({
            where: { idOrg, idEtb, slug: variantSlug },
          });
          if (slugCount > 0) {
            uniqueSlug = `${variantSlug}-${Date.now()}`;
          }

          await prisma.article.create({
            data: {
              id: variantArticleId,
              idOrg,
              idEtb,
              reference: variantReference.toUpperCase(),
              slug: uniqueSlug,
              designation: `${row.designation} ${variantRow.variantValue}`,
              shortDescription: row.shortDescription || null,
              isPublish,
              isSubArticle: true,
              idParent: articleId,
              picking: "FIFO",
              stockManagement: "IN_STOCK",
              articleManagement: "BY_EAN",
              saleUnit: firstUnit?.id || null,
              purchaseUnit: firstUnit?.id || null,
            },
          });

          // Create pricing for variant
          await prisma.pricing.create({
            data: {
              id: `price-${nanoid()}`,
              idOrg,
              idEtb,
              idArticle: variantArticleId,
              idTax: firstTax?.id || null,
              purchasePrice: 0,
              fees: 0,
              profitType: "PERCENT",
              profitMargin: 0,
              salePrice: variantPrice,
              effectDate: new Date(),
            },
          });

          // Create VariantProps record
          const lastVariant = await prisma.variantProps.findFirst({
            where: { idOrg, idEtb },
            orderBy: { reference: "desc" },
          });
          const lastVarRef = lastVariant?.reference || "VAR00000";
          const varRefNum = (parseInt(lastVarRef.replace("VAR", "")) || 0) + 1;
          const variantRef = `VAR${String(varRefNum).padStart(5, "0")}`;

          const variantType = (variantRow.variantType?.toUpperCase() || "TEXT") as "COLOR" | "SIZE" | "NUMBER" | "TEXT";

          await prisma.variantProps.create({
            data: {
              id: `var-${nanoid()}`,
              idOrg,
              idEtb,
              idArticle: articleId,
              idSubArticle: variantArticleId,
              reference: variantRef,
              designation: variantRow.variantValue,
              type: ["COLOR", "SIZE", "NUMBER", "TEXT"].includes(variantType) ? variantType : "TEXT",
              value: variantRow.variantValue,
            },
          });

          results.variants++;
        }
      } catch (error) {
        console.error(`Error importing article ${row.designation}:`, error);
        results.errors.push(`${row.designation}: Erreur lors de l'import`);
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        parentArticles: results.created,
        variants: results.variants,
        total: results.created + results.variants,
        errors: results.errors,
      },
    });
  } catch (error) {
    console.error("Error importing articles:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'import des articles" },
      { status: 500 }
    );
  }
}
