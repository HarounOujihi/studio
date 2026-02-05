import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Access Control Utilities for Convex
 *
 * These helpers replace PostgreSQL RLS with application-level filtering.
 *
 * Usage in Convex functions:
 * ```ts
 * import { hasAccess, checkAccess } from "./auth";
 *
 * export const myQuery = query({
 *   args: { orgId: v.string() },
 *   handler: async (ctx, args) => {
 *     // Check if user has access
 *     const access = await hasAccess(ctx, args.orgId);
 *     if (!access.allowed) return [];
 *
 *     // Query data
 *     return await ctx.db.query("articles")
 *       .withIndex("by_org", (q) => q.eq("idOrg", args.orgId))
 *       .collect();
 *   },
 * });
 * ```
 */

/**
 * Get current authenticated user from Convex auth
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_oidc", (q) => q.eq("oidcId", identity.subject))
    .first();

  return user;
}

/**
 * Get all organizations a user has access to
 */
export async function getUserOrgIds(ctx: QueryCtx | MutationCtx, userId: string) {
  const userOrgs = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  return userOrgs.map((uo) => uo.idOrg);
}

/**
 * Get user's role in an organization
 */
export async function getUserRole(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  orgId: string
) {
  const userOrg = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("idOrg", orgId))
    .first();

  return userOrg?.role || null;
}

/**
 * Check if user has access to an organization
 */
export async function hasOrgAccess(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  orgId: string
): Promise<boolean> {
  const userOrgs = await getUserOrgIds(ctx, userId);
  return userOrgs.includes(orgId);
}

/**
 * Access result with details
 */
export interface AccessResult {
  allowed: boolean;
  reason?: string;
  role?: string;
}

/**
 * Check if user has access to a specific scope (org + optional etb)
 */
export async function checkAccess(
  ctx: QueryCtx | MutationCtx,
  orgId: string,
  etbId?: string
): Promise<AccessResult> {
  const user = await getCurrentUser(ctx);

  if (!user) {
    return { allowed: false, reason: "Not authenticated" };
  }

  // Check organization access
  const userOrgs = await getUserOrgIds(ctx, user.oidcId);

  if (!userOrgs.includes(orgId)) {
    return {
      allowed: false,
      reason: "User does not have access to this organization"
    };
  }

  // Get user's role
  const role = await getUserRole(ctx, user.oidcId, orgId);

  // If etbId is specified, we'd need to check establishment access
  // (This would require an establishments table or similar)

  return { allowed: true, role: role || "USER" };
}

/**
 * Filter data by user's accessible organizations
 * Use this when you need to filter results after fetching
 */
export async function filterByUserOrgs<T extends { idOrg: string }>(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  data: T[]
): Promise<T[]> {
  const userOrgs = await getUserOrgIds(ctx, userId);
  return data.filter(item => userOrgs.includes(item.idOrg));
}

/**
 * Mutation guard - throws if user doesn't have access
 * Use in mutations to enforce access control
 */
export async function requireAccess(
  ctx: MutationCtx,
  orgId: string,
  etbId?: string
): Promise<void> {
  const access = await checkAccess(ctx, orgId, etbId);

  if (!access.allowed) {
    throw new Error(`Access denied: ${access.reason}`);
  }
}

/**
 * Query helper - returns null if no access instead of throwing
 */
export async function queryWithAccess<T>(
  ctx: QueryCtx,
  orgId: string,
  queryFn: () => Promise<T>
): Promise<T | null> {
  const access = await checkAccess(ctx, orgId);

  if (!access.allowed) {
    return null;
  }

  return await queryFn();
}
