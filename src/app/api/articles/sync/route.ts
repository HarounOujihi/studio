import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idOrg, idEtb, limit = 50 } = body;

    // Debug: Log database URL
    console.log("====> DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

    // Validate required fields
    if (!idOrg || !idEtb) {
      return NextResponse.json(
        { error: "idOrg and idEtb are required" },
        { status: 400 }
      );
    }

    // Fetch articles from Prisma
    console.log("====> Fetching articles from Prisma for org:", idOrg, "etb:", idEtb);
    const articles = await prisma.article.findMany({
      where: {
        idOrg,
        idEtb,
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to match Convex schema (filter out null values for optional fields)
    const convexArticles = articles.map((article) => {
      const obj: Record<string, string | boolean | number | string[] | null | undefined> = {
        id: article.id,
        idOrg: article.idOrg,
        idEtb: article.idEtb,
        reference: article.reference,
        isSubArticle: article.isSubArticle ?? false,
      };

      // Only include optional fields if they have values
      if (article.slug) obj.slug = article.slug;
      if (article.designation) obj.designation = article.designation;
      if (article.description) obj.description = article.description;
      if (article.shortDescription) obj.shortDescription = article.shortDescription;
      if (article.details) obj.details = article.details;
      if (article.materials) obj.materials = article.materials;
      if (article.media) obj.media = article.media;
      if (article.gallery) obj.gallery = article.gallery;
      if (article.productType) obj.productType = article.productType;
      if (article.isService !== undefined) obj.isService = article.isService;
      if (article.isDigitalProduct !== undefined) obj.isDigitalProduct = article.isDigitalProduct;
      if (article.isPublish !== undefined) obj.isPublish = article.isPublish;
      if (article.saleUnit) obj.saleUnit = article.saleUnit;
      if (article.purchaseUnit) obj.purchaseUnit = article.purchaseUnit;
      if (article.weight) obj.weight = article.weight;
      if (article.volume) obj.volume = article.volume;
      if (article.sortIndex) obj.sortIndex = article.sortIndex;
      if (article.idParent) obj.idParent = article.idParent;
      if (article.createdAt) obj.createdAt = article.createdAt.getTime();
      if (article.updatedAt) obj.updatedAt = article.updatedAt.getTime();

      return obj;
    });

    // Sync to Convex using mutation
    const results = await convex.mutation(api.articles.syncBulk, {
      articles: convexArticles as any,
    });

    return NextResponse.json({
      success: true,
      synced: results.length,
      results,
    });
  } catch (error) {
    console.error("Error syncing articles:", error);
    return NextResponse.json(
      {
        error: "Failed to sync articles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Sync a single article by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get("id");

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    // Fetch single article from Prisma
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Transform to match Convex schema (filter out null values for optional fields)
    const convexArticle: Record<string, string | boolean | number | string[] | null | undefined> = {
      id: article.id,
      idOrg: article.idOrg,
      idEtb: article.idEtb,
      reference: article.reference,
      isSubArticle: article.isSubArticle ?? false,
    };

    // Only include optional fields if they have values
    if (article.slug) convexArticle.slug = article.slug;
    if (article.designation) convexArticle.designation = article.designation;
    if (article.description) convexArticle.description = article.description;
    if (article.shortDescription) convexArticle.shortDescription = article.shortDescription;
    if (article.details) convexArticle.details = article.details;
    if (article.materials) convexArticle.materials = article.materials;
    if (article.media) convexArticle.media = article.media;
    if (article.gallery) convexArticle.gallery = article.gallery;
    if (article.productType) convexArticle.productType = article.productType;
    if (article.isService !== undefined) convexArticle.isService = article.isService;
    if (article.isDigitalProduct !== undefined) convexArticle.isDigitalProduct = article.isDigitalProduct;
    if (article.isPublish !== undefined) convexArticle.isPublish = article.isPublish;
    if (article.saleUnit) convexArticle.saleUnit = article.saleUnit;
    if (article.purchaseUnit) convexArticle.purchaseUnit = article.purchaseUnit;
    if (article.weight) convexArticle.weight = article.weight;
    if (article.volume) convexArticle.volume = article.volume;
    if (article.sortIndex) convexArticle.sortIndex = article.sortIndex;
    if (article.idParent) convexArticle.idParent = article.idParent;
    if (article.createdAt) convexArticle.createdAt = article.createdAt.getTime();
    if (article.updatedAt) convexArticle.updatedAt = article.updatedAt.getTime();

    // Sync to Convex using mutation
    const result = await convex.mutation(api.articles.sync, convexArticle as any);

    return NextResponse.json({
      success: true,
      articleId,
      convexId: result,
    });
  } catch (error) {
    console.error("Error syncing article:", error);
    return NextResponse.json(
      {
        error: "Failed to sync article",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
