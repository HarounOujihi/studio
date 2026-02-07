import { atom } from "jotai";

// Establishment details for settings completion check
export interface EstablishmentDetails {
  id: string;
  designation: string | null;
  slogan: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

export const establishmentDetailsAtom = atom<EstablishmentDetails | null>(null);

// Derived atom to check if settings are incomplete
export const settingsIncompleteAtom = atom((get) => {
  const details = get(establishmentDetailsAtom);
  // if (!details) return false;

  // Check if key settings are missing
  return !details || !details.designation || !details.slogan || !details.logo || !details.phone || !details.website || !details.email;
});

// User authentication state
export const isAuthenticatedAtom = atom(false);

export const userAtom = atom<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: string;
} | null>(null);

// Organization and Establishment scope
export const currentOrgIdAtom = atom<string | null>(null);
export const currentEtbIdAtom = atom<string | null>(null);

// Combined scope atom (derived)
export const currentScopeAtom = atom((get) => {
  const orgId = get(currentOrgIdAtom);
  const etbId = get(currentEtbIdAtom);
  return { orgId, etbId };
});

// Fake organizations data
export const organizationsAtom = atom([
  {
    id: "org-1",
    name: "Acme Corporation",
    logo: "/acme-logo.png",
    establishments: [
      { id: "etb-1", name: "Main Store - Downtown" },
      { id: "etb-2", name: "Warehouse - North" },
      { id: "etb-3", name: "Online Store" },
    ],
  },
  {
    id: "org-2",
    name: "Globex Retail",
    logo: "/globex-logo.png",
    establishments: [
      { id: "etb-4", name: "Flagship Store" },
      { id: "etb-5", name: "Distribution Center" },
    ],
  },
  {
    id: "org-3",
    name: "Stark Industries",
    logo: "/stark-logo.png",
    establishments: [
      { id: "etb-6", name: "HQ Tower" },
      { id: "etb-7", name: "R&D Facility" },
    ],
  },
]);

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
export const loginAtom = atom(
  null, // no get
  (get, set) => {
    // Fake login - set default user and scope
    set(isAuthenticatedAtom, true);
    set(userAtom, {
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
      email: "john@acme.com",
      picture: "/avatar.png",
    });

    // Set default org and etb
    const orgs = get(organizationsAtom);
    set(currentOrgIdAtom, orgs[0]?.id || null);
    set(currentEtbIdAtom, orgs[0]?.establishments[0]?.id || null);
  }
);

export const logoutAtom = atom(
  null,
  (get, set) => {
    set(isAuthenticatedAtom, false);
    set(userAtom, null);
    set(currentOrgIdAtom, null);
    set(currentEtbIdAtom, null);
  }
);

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
