import { useQuery } from "convex/react";
import { useAtomValue } from "jotai";
import { currentScopeAtom } from "@/lib/store/auth-oidc";
import type { GenericQueryCtx } from "convex/server";
import type { FunctionReference } from "convex/server";

/**
 * Scoped query hook that automatically injects the current organization and establishment scope
 *
 * This hook wraps Convex's useQuery and automatically passes the current scope (orgId, etbId)
 * from the global state. This means:
 * 1. Pages don't need to manage org/etb state manually
 * 2. Changing scope in the admin shell automatically updates all data
 * 3. All queries are automatically filtered by the selected establishment
 *
 * @example
 * ```tsx
 * // Instead of:
 * const articles = useQuery(api.articles.list, {
 *   idOrg: orgId,
 *   idEtb: etbId,
 *   isPublish: true,
 * });
 *
 * // Use:
 * const articles = useScopedQuery(api.articles.list, {
 *   isPublish: true,
 * });
 * ```
 */
export function useScopedQuery<
  Query extends FunctionReference<"query", "public">,
  Args extends Record<string, unknown> = { idOrg?: string; idEtb?: string }
>(
  query: Query,
  args?: Omit<Args, "idOrg" | "idEtb">
) {
  const scope = useAtomValue(currentScopeAtom);

  // Build query args with automatic scope injection
  const queryArgs: any = {
    idOrg: scope.orgId || undefined,
    idEtb: scope.etbId || undefined,
    ...args,
  };

  return useQuery(query, queryArgs);
}

/**
 * Hook to get the current scope - useful for mutations or when you need
 * to manually pass scope to API calls
 */
export function useScope() {
  return useAtomValue(currentScopeAtom);
}
