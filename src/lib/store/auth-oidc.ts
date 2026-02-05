import { atom } from "jotai";
import { atomWithStoredBroadcast } from "../../../store/broadcast";

export type OrganizationRole = "SUPER_ADMIN" | "MANAGER" | "USER";

export interface Establishment {
  id: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  role: OrganizationRole;
  establishments: Establishment[];
}

// Persist selected org/etb to localStorage (survives page reloads)
export const currentOrgIdAtom = atomWithStoredBroadcast<string | null>("selected-org-id", null);
export const currentEtbIdAtom = atomWithStoredBroadcast<string | null>("selected-etb-id", null);

// Combined scope atom (derived)
export const currentScopeAtom = atom((get) => {
  const orgId = get(currentOrgIdAtom);
  const etbId = get(currentEtbIdAtom);
  return { orgId, etbId };
});

// Organizations atom - can be set from API response
export const organizationsAtom = atom<Organization[]>([]);

// Derived atom for current organization
export const currentOrganizationAtom = atom((get) => {
  const orgId = get(currentOrgIdAtom);
  const orgs = get(organizationsAtom);
  return orgs.find((org) => org.id === orgId) || orgs[0];
});

// Derived atom for current establishment
export const currentEstablishmentAtom = atom((get) => {
  const etbId = get(currentEtbIdAtom);
  const org = get(currentOrganizationAtom);
  return org?.establishments.find((etb) => etb.id === etbId) || org?.establishments[0];
});

// Action atoms
export const switchOrganizationAtom = atom(
  null,
  (get, set, orgId: string) => {
    set(currentOrgIdAtom, orgId);
    // Also reset to first establishment of the new org
    const orgs = get(organizationsAtom);
    const org = orgs.find((o) => o.id === orgId);
    set(currentEtbIdAtom, org?.establishments[0]?.id || null);
  }
);

export const switchEstablishmentAtom = atom(
  null,
  (get, set, etbId: string) => {
    set(currentEtbIdAtom, etbId);
  }
);

// Initialize organizations and auto-select first
export const initializeOrganizationsAtom = atom(
  null,
  (get, set, orgs: Organization[]) => {
    set(organizationsAtom, orgs);

    // Auto-select first org and establishment if not already set
    const currentOrgId = get(currentOrgIdAtom);
    if (!currentOrgId && orgs.length > 0) {
      const firstOrg = orgs[0];
      set(currentOrgIdAtom, firstOrg.id);
      set(currentEtbIdAtom, firstOrg.establishments[0]?.id || null);
    }
  }
);
