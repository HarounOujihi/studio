import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Custom authentication helpers for NextAuth + Convex integration
 *
 * Note: This uses Convex's built-in auth system. For full NextAuth integration,
 * you should configure Convex auth properly or pass the user info through a
 * different mechanism.
 */

// Get current authenticated user
export const currentUser = query({
  handler: async (ctx) => {
    // Get the identity from Convex auth
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Extract user ID from identity subject
    const oidcId = identity.subject;

    if (!oidcId) {
      return null;
    }

    // Find the user in Convex
    const user = await ctx.db
      .query("users")
      .withIndex("by_oidc", (q) => q.eq("oidcId", oidcId))
      .first();

    return user;
  },
});

// Sync user from auth provider to Convex
export const syncUser = mutation({
  args: {
    oidcId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    picture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_oidc", (q) => q.eq("oidcId", args.oidcId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email ?? existingUser.email,
        firstName: args.firstName ?? existingUser.firstName,
        lastName: args.lastName ?? existingUser.lastName,
        picture: args.picture ?? existingUser.picture,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      oidcId: args.oidcId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      picture: args.picture,
    });

    return userId;
  },
});

// Get or create current user (helper for queries)
export const getOrCreateCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const oidcId = identity.subject;

    if (!oidcId) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_oidc", (q) => q.eq("oidcId", oidcId))
      .first();

    return user;
  },
});

// For development: create a test user (remove in production)
export const createTestUser = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const oidcId = `test_${args.email}`;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_oidc", (q) => q.eq("oidcId", oidcId))
      .first();

    if (existingUser) {
      return existingUser;
    }

    const userId = await ctx.db.insert("users", {
      oidcId,
      email: args.email,
      firstName: args.firstName ?? "Test",
      lastName: args.lastName ?? "User",
    });

    return await ctx.db.get(userId);
  },
});

// Create an organization (for sync/migration)
export const createOrganization = mutation({
  args: {
    id: v.string(),
    reference: v.string(),
    name: v.optional(v.string()),
    logo: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if organization already exists
    const allOrgs = await ctx.db.query("organizations").collect();
    const existing = allOrgs.find((o) => o.id === args.id);

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        reference: args.reference,
        name: args.name,
        logo: args.logo,
        active: args.active,
      });
      return existing._id;
    }

    // Create new
    const orgId = await ctx.db.insert("organizations", {
      id: args.id,
      reference: args.reference,
      name: args.name,
      logo: args.logo,
      active: args.active,
    });

    return orgId;
  },
});

// Link user to organization (for sync/migration)
export const linkUserToOrganization = mutation({
  args: {
    userId: v.string(),
    idOrg: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if link already exists
    const existingLinks = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("idOrg", args.idOrg)
      )
      .collect();

    if (existingLinks.length > 0) {
      return existingLinks[0]._id;
    }

    // Create new link
    const linkId = await ctx.db.insert("userOrganizations", {
      userId: args.userId,
      idOrg: args.idOrg,
      role: args.role,
    });

    return linkId;
  },
});

// Create an establishment (for sync/migration)
export const createEstablishment = mutation({
  args: {
    id: v.string(),
    idOrg: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    idCurrency: v.optional(v.string()),
    domain: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isHidden: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if establishment already exists
    const allEtb = await ctx.db.query("establishments").collect();
    const existing = allEtb.find((e) => e.id === args.id);

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        reference: args.reference,
        designation: args.designation,
        idCurrency: args.idCurrency,
        domain: args.domain,
        isDefault: args.isDefault,
        isHidden: args.isHidden,
      });
      return existing._id;
    }

    // Create new
    const etbId = await ctx.db.insert("establishments", {
      id: args.id,
      idOrg: args.idOrg,
      reference: args.reference,
      designation: args.designation,
      idCurrency: args.idCurrency,
      domain: args.domain,
      isDefault: args.isDefault,
      isHidden: args.isHidden,
    });

    return etbId;
  },
});
