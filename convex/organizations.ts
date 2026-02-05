import { query } from "./_generated/server";
import { v } from "convex/values";

// DEBUG: List all data in database (remove in production)
export const debugListAll = query({
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const allUserOrganizations = await ctx.db.query("userOrganizations").collect();
    const allOrganizations = await ctx.db.query("organizations").collect();
    const allEstablishments = await ctx.db.query("establishments").collect();

    return {
      usersCount: allUsers.length,
      users: allUsers.map(u => ({ oidcId: u.oidcId, email: u.email })),
      userOrganizationsCount: allUserOrganizations.length,
      userOrganizations: allUserOrganizations.map(uo => ({ userId: uo.userId, idOrg: uo.idOrg, role: uo.role })),
      organizationsCount: allOrganizations.length,
      organizations: allOrganizations.map(o => ({ id: o.id, name: o.name })),
      establishmentsCount: allEstablishments.length,
    };
  },
});

// Get organizations for a specific user by their userId
export const getMyOrganizations = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = args.userId;

    if (!userId) {
      console.log("====> No userId provided, returning empty array");
      return [];
    }

    console.log("====> Fetching organizations for userId:", userId);

    // Get user's organizations from the join table
    const userOrganizations = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    console.log("====> userOrganizations count:", userOrganizations.length);

    if (userOrganizations.length === 0) {
      return [];
    }

    // Fetch organization details for each
    const organizations = await Promise.all(
      userOrganizations.map(async (uo) => {
        // Use full table scan to find by id (need to add index later)
        const allOrgs = await ctx.db.query("organizations").collect();
        const organization = allOrgs.find((o) => o.id === uo.idOrg);

        if (!organization) {
          return null;
        }

        // Get establishments for this organization
        const establishments = await ctx.db
          .query("establishments")
          .withIndex("by_org", (q) => q.eq("idOrg", organization.id))
          .collect();

        return {
          id: organization.id,
          name: organization.name,
          logo: organization.logo,
          role: uo.role,
          establishments: establishments.map((etb) => ({
            id: etb.id,
            name: etb.designation,
          })),
        };
      })
    );

    // Filter out nulls
    const result = organizations.filter((org): org is NonNullable<typeof org> => org !== null);
    console.log("====> Final organizations count:", result.length);
    return result;
  },
});

// Get a single organization by ID
export const getOrganization = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // Use full table scan to find by id (need to add index later)
    const allOrgs = await ctx.db.query("organizations").collect();
    const organization = allOrgs.find((o) => o.id === args.id);

    if (!organization) {
      return null;
    }

    const establishments = await ctx.db
      .query("establishments")
      .withIndex("by_org", (q) => q.eq("idOrg", organization.id))
      .collect();

    return {
      id: organization.id,
      name: organization.name,
      logo: organization.logo,
      active: organization.active,
      establishments: establishments.map((etb) => ({
        id: etb.id,
        name: etb.designation,
        isDefault: etb.isDefault,
        isHidden: etb.isHidden,
      })),
    };
  },
});

// Get establishments for an organization
export const getEstablishments = query({
  args: { idOrg: v.string() },
  handler: async (ctx, args) => {
    const establishments = await ctx.db
      .query("establishments")
      .withIndex("by_org", (q) => q.eq("idOrg", args.idOrg))
      .collect();

    return establishments.map((etb) => ({
      id: etb.id,
      name: etb.designation,
      isDefault: etb.isDefault,
      isHidden: etb.isHidden,
    }));
  },
});

// Get all establishments with organization info
export const listAllEstablishments = query({
  handler: async (ctx) => {
    const establishments = await ctx.db.query("establishments").collect();
    const organizations = await ctx.db.query("organizations").collect();

    return establishments.map((etb) => {
      const org = organizations.find((o) => o.id === etb.idOrg);
      return {
        id: etb.id,
        reference: etb.reference,
        name: etb.designation,
        domain: etb.domain,
        isDefault: etb.isDefault,
        isHidden: etb.isHidden,
        organization: {
          id: etb.idOrg,
          name: org?.name,
          reference: org?.reference,
        },
      };
    });
  },
});

// Get all locations with deposit and establishment info
export const listAllLocations = query({
  handler: async (ctx) => {
    const locations = await ctx.db.query("locations").collect();
    const deposits = await ctx.db.query("deposits").collect();
    const establishments = await ctx.db.query("establishments").collect();
    const organizations = await ctx.db.query("organizations").collect();

    return locations.map((loc) => {
      // Find deposit by string id (idDepo is a string reference to deposit.id)
      const deposit = deposits.find((d) => d.id === loc.idDepo);
      // Find establishment by string id (idEtb is a string reference to establishment.id)
      const establishment = deposit ? establishments.find((e) => e.id === deposit.idEtb) : null;
      const organization = establishment ? organizations.find((o) => o.id === establishment.idOrg) : null;

      return {
        id: loc.id,
        reference: loc.reference,
        name: loc.designation,
        volume: loc.volume,
        deposit: deposit ? {
          id: deposit.id,
          name: deposit.designation,
          reference: deposit.reference,
        } : null,
        establishment: establishment ? {
          id: establishment.id,
          name: establishment.designation,
          reference: establishment.reference,
        } : null,
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          reference: organization.reference,
        } : null,
      };
    });
  },
});
