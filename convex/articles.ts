import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// DEBUG: List all articles without filtering
export const debugListAll = query({
  handler: async (ctx) => {
    const articles = await ctx.db.query("articles").collect();
    return {
      count: articles.length,
      articles: articles.map(a => ({
        id: a.id,
        reference: a.reference,
        designation: a.designation,
        idOrg: a.idOrg,
        idEtb: a.idEtb,
      })),
    };
  },
});

// List all articles with optional filters
export const list = query({
  args: {
    idOrg: v.optional(v.string()),
    idEtb: v.optional(v.string()),
    isPublish: v.optional(v.boolean()),
    productType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let articles;

    // Use the most specific index available
    if (args.idOrg && args.idEtb) {
      // Use composite index for both org and etb
      const idOrg = args.idOrg;
      const idEtb = args.idEtb;
      articles = await ctx.db
        .query("articles")
        .withIndex("by_org_etb", (q) => q.eq("idOrg", idOrg).eq("idEtb", idEtb))
        .collect();
    } else if (args.idOrg) {
      // Use org index
      const idOrg = args.idOrg;
      articles = await ctx.db
        .query("articles")
        .withIndex("by_org", (q) => q.eq("idOrg", idOrg))
        .collect();
    } else if (args.idEtb) {
      // Use etb index
      const idEtb = args.idEtb;
      articles = await ctx.db
        .query("articles")
        .withIndex("by_etb", (q) => q.eq("idEtb", idEtb))
        .collect();
    } else {
      // No index filter, get all
      articles = await ctx.db.query("articles").collect();
    }

    // Client-side filtering for non-indexed fields
    let filtered = articles;
    if (args.isPublish !== undefined) {
      filtered = filtered.filter((a) => a.isPublish === args.isPublish);
    }
    if (args.productType) {
      filtered = filtered.filter((a) => a.productType === args.productType);
    }

    // Sort by sortIndex and createdAt
    return filtered.sort((a, b) => {
      if (a.sortIndex !== undefined && b.sortIndex !== undefined) {
        return a.sortIndex - b.sortIndex;
      }
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });
  },
});

// Get a single article by ID (uses full table scan until by_id index is in generated types)
export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const allArticles = await ctx.db.query("articles").collect();
    return allArticles.find((a) => a.id === args.id) || null;
  },
});

// Sync article from Prisma to Convex (call this from your API route)
export const sync = mutation({
  args: {
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    slug: v.optional(v.string()),
    designation: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    details: v.optional(v.string()),
    materials: v.optional(v.string()),
    media: v.optional(v.string()),
    gallery: v.optional(v.array(v.string())),
    productType: v.optional(v.string()),
    isService: v.optional(v.boolean()),
    isDigitalProduct: v.optional(v.boolean()),
    isPublish: v.optional(v.boolean()),
    saleUnit: v.optional(v.string()),
    purchaseUnit: v.optional(v.string()),
    weight: v.optional(v.number()),
    volume: v.optional(v.string()),
    sortIndex: v.optional(v.number()),
    isSubArticle: v.boolean(),
    idParent: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use full table scan until by_id index is in generated types
    const allArticles = await ctx.db.query("articles").collect();
    const existing = allArticles.find((a) => a.id === args.id);

    const now = Date.now();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        ...args,
        lastSyncedAt: now,
      });
      return existing._id;
    } else {
      // Insert new
      const newId = await ctx.db.insert("articles", {
        ...args,
        lastSyncedAt: now,
      });
      return newId;
    }
  },
});

// Bulk sync articles (call from API route)
export const syncBulk = mutation({
  args: {
    articles: v.array(
      v.object({
        id: v.string(),
        idOrg: v.string(),
        idEtb: v.string(),
        reference: v.string(),
        slug: v.optional(v.string()),
        designation: v.optional(v.string()),
        description: v.optional(v.string()),
        shortDescription: v.optional(v.string()),
        details: v.optional(v.string()),
        materials: v.optional(v.string()),
        media: v.optional(v.string()),
        gallery: v.optional(v.array(v.string())),
        productType: v.optional(v.string()),
        isService: v.optional(v.boolean()),
        isDigitalProduct: v.optional(v.boolean()),
        isPublish: v.optional(v.boolean()),
        saleUnit: v.optional(v.string()),
        purchaseUnit: v.optional(v.string()),
        weight: v.optional(v.number()),
        volume: v.optional(v.string()),
        sortIndex: v.optional(v.number()),
        isSubArticle: v.boolean(),
        idParent: v.optional(v.string()),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = [];

    for (const article of args.articles) {
      // Use full table scan for each article (can optimize in production)
      const allArticles = await ctx.db.query("articles").collect();
      const existing = allArticles.find((a) => a.id === article.id);

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...article,
          lastSyncedAt: now,
        });
        results.push({ id: article.id, action: "updated", convexId: existing._id });
      } else {
        const newId = await ctx.db.insert("articles", {
          ...article,
          lastSyncedAt: now,
        });
        results.push({ id: article.id, action: "created", convexId: newId });
      }
    }

    return results;
  },
});

// Delete article
export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // Use full table scan until by_id index is in generated types
    const allArticles = await ctx.db.query("articles").collect();
    const existing = allArticles.find((a) => a.id === args.id);

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }

    return false;
  },
});
