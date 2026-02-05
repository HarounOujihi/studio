import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Sync Movement from Prisma to Convex
export const sync = mutation({
  args: {
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idHeader: v.string(),
    idArticle: v.string(),
    qty: v.number(),
    idUnit: v.string(),
    options: v.optional(v.array(v.string())),
    idTax: v.optional(v.string()),
    idPricing: v.optional(v.string()),
    idDiscount: v.optional(v.string()),
    idDeposit: v.optional(v.string()),
    idLot: v.optional(v.string()),
    untaxedAmount: v.optional(v.number()),
    taxedAmount: v.optional(v.number()),
    codeOperation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("movements")
      .collect()
      .then((movements) => movements.find((m) => m.id === args.id));

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("movements", args);
    }
  },
});

// List movements with optional filters
export const list = query({
  args: {
    idOrg: v.optional(v.string()),
    idEtb: v.optional(v.string()),
    idHeader: v.optional(v.string()),
    idArticle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let movements: any[];

    if (args.idOrg && args.idEtb) {
      const idOrg = args.idOrg;
      const idEtb = args.idEtb;
      movements = await ctx.db
        .query("movements")
        .withIndex("by_org_etb", (q) => q.eq("idOrg", idOrg).eq("idEtb", idEtb))
        .collect();
    } else {
      movements = await ctx.db.query("movements").collect();
    }

    if (args.idHeader) {
      movements = movements.filter((m) => m.idHeader === args.idHeader);
    }
    if (args.idArticle) {
      movements = movements.filter((m) => m.idArticle === args.idArticle);
    }

    return movements;
  },
});

// Get movements for a specific header
export const getByHeader = query({
  args: { idHeader: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("movements")
      .withIndex("by_header", (q) => q.eq("idHeader", args.idHeader))
      .collect();
  },
});
