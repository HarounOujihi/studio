import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Sync Header from Prisma to Convex
export const sync = mutation({
  args: {
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    docType: v.string(),
    idClient: v.optional(v.string()),
    idProvider: v.optional(v.string()),
    idContact: v.optional(v.string()),
    codeOperation: v.optional(v.string()),
    idCommercialDoc: v.optional(v.string()),
    idPhase: v.optional(v.string()),
    idTax: v.optional(v.string()),
    idDeposit: v.optional(v.string()),
    status: v.optional(v.string()),
    untaxedAmount: v.optional(v.number()),
    taxedAmount: v.optional(v.number()),
    headerGroup: v.optional(v.string()),
    pickupAt: v.optional(v.number()),
    deliveryClientName: v.optional(v.string()),
    deliveryPhone: v.optional(v.string()),
    deliveryEmail: v.optional(v.string()),
    billingAddress: v.optional(v.string()),
    deliveryAddress: v.optional(v.string()),
    note: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("headers")
      .withIndex("by_org_etb", (q) => q.eq("idOrg", args.idOrg).eq("idEtb", args.idEtb))
      .collect()
      .then((headers) => headers.find((h) => h.id === args.id));

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args });
    } else {
      await ctx.db.insert("headers", { ...args });
    }
  },
});

// List headers with optional filters
export const list = query({
  args: {
    idOrg: v.optional(v.string()),
    idEtb: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let headers: any[];

    if (args.idOrg && args.idEtb) {
      const idOrg = args.idOrg;
      const idEtb = args.idEtb;
      headers = await ctx.db
        .query("headers")
        .withIndex("by_org_etb", (q) => q.eq("idOrg", idOrg).eq("idEtb", idEtb))
        .collect();
    } else {
      headers = await ctx.db.query("headers").collect();
    }

    if (args.status) {
      headers = headers.filter((h) => h.status === args.status);
    }

    return headers.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

// Get a single header by reference
export const getByReference = query({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const headers = await ctx.db.query("headers").collect();
    return headers.find((h) => h.reference === args.reference) || null;
  },
});
