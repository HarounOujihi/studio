import { useAtomValue } from "jotai";
import { currentScopeAtom } from "@/lib/store/auth-oidc";

/**
 * Hook to get the current scope (orgId, etbId) from global state
 * Use this for API calls that need organization/establishment context
 */
export function useScope() {
  return useAtomValue(currentScopeAtom);
}
