"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getCdnUrl } from "@/lib/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Building2,
  Store,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  DollarSign,
  Percent,
  Receipt,
  Warehouse,
  MapPin,
  Ruler,
} from "lucide-react";
import Link from "next/link";
import { useMobile } from "@/lib/hooks/use-mobile";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  switchOrganizationAtom,
  switchEstablishmentAtom,
  currentOrganizationAtom,
  currentEstablishmentAtom,
  organizationsAtom,
  initializeOrganizationsAtom,
  Organization,
  OrganizationRole,
  Establishment,
} from "@/lib/store/auth-oidc";
import { settingsIncompleteAtom } from "@/lib/store/auth";
import { useEstablishmentDetails } from "@/lib/hooks/use-establishment-details";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

interface AdminShellProps {
  children: React.ReactNode;
}

// Types matching the Convex query return shape
type ConvexOrganization = {
  id: string;
  name?: string;
  logo?: string;
  role: string;
  establishments: ConvexEstablishment[];
};

type ConvexEstablishment = {
  id: string;
  name?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  showIndicator?: boolean;
};

const navigation: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "E-commerce",
    items: [
      {
        title: "Articles",
        href: "/articles",
        icon: <Package className="h-4 w-4" />,
      },
      {
        title: "Categories",
        href: "/categories",
        icon: <Store className="h-4 w-4" />,
      },
      {
        title: "Orders",
        href: "/orders",
        icon: <ShoppingCart className="h-4 w-4" />,
      },
      {
        title: "Customers",
        href: "/customers",
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Pricings",
        href: "/pricings",
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        title: "Discounts",
        href: "/discounts",
        icon: <Percent className="h-4 w-4" />,
      },

      // { title: "Users", href: "/users", icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Taxes",
        href: "/taxes",
        icon: <Receipt className="h-4 w-4" />,
      },
      {
        title: "Deposits",
        href: "/deposits",
        icon: <Warehouse className="h-4 w-4" />,
      },
      {
        title: "Locations",
        href: "/locations",
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        title: "Units",
        href: "/units",
        icon: <Ruler className="h-4 w-4" />,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: <Settings className="h-4 w-4" />,
        showIndicator: true,
      },
    ],
  },
];

function OrgSwitcher({
  isMobile = false,
  onNoOrganizations,
}: {
  isMobile?: boolean;
  onNoOrganizations?: () => void;
}) {
  const organizations = useAtomValue(organizationsAtom);
  const currentOrg = useAtomValue(currentOrganizationAtom);
  const currentEtb = useAtomValue(currentEstablishmentAtom);
  const switchOrg = useSetAtom(switchOrganizationAtom);
  const switchEtb = useSetAtom(switchEstablishmentAtom);
  const initializeOrgs = useSetAtom(initializeOrganizationsAtom);

  // Mobile expansion state
  const [expandedOrgId, setExpandedOrgId] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  // Fetch organizations from Prisma API
  const [orgsData, setOrgsData] = React.useState<{
    organizations?: ConvexOrganization[];
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadOrganizations() {
      try {
        const response = await fetch("/api/auth/organizations");
        const data = await response.json();
        setOrgsData(data);
      } catch (error) {
        console.error("Failed to load organizations:", error);
        setOrgsData({ organizations: [] });
      } finally {
        setIsLoading(false);
      }
    }
    loadOrganizations();
  }, []);

  const prismaOrgs = orgsData?.organizations;

  React.useEffect(() => {
    if (prismaOrgs && prismaOrgs.length > 0) {
      // Convert Prisma result to match Organization interface
      const typedOrgs: Organization[] = prismaOrgs.map(
        (org: ConvexOrganization) => ({
          id: org.id,
          name: org.name || org.id,
          logo: org.logo,
          role: org.role as OrganizationRole,
          establishments: (org.establishments || []).map(
            (etb: ConvexEstablishment): Establishment => ({
              id: etb.id,
              name: etb.name || etb.id,
            }),
          ),
        }),
      );
      initializeOrgs(typedOrgs);
    }
  }, [prismaOrgs, initializeOrgs]);

  // Call onNoOrganizations callback if user has no organizations
  React.useEffect(() => {
    if (!isLoading && prismaOrgs !== undefined && prismaOrgs.length === 0) {
      onNoOrganizations?.();
    }
  }, [isLoading, prismaOrgs, onNoOrganizations]);

  if (isLoading || !currentOrg) return null;

  // Mobile: Collapsible list view
  if (isMobile) {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Building2 className="h-4 w-4" />
          <span className="flex-1 text-left">
            {currentOrg.name} / {currentEtb?.name || "Select establishment"}
          </span>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
        </Button>

        {isOpen && (
          <div className="space-y-1 pl-2">
            {organizations.map((org) => (
              <div key={org.id} className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-2 h-8 text-sm"
                  onClick={() => {
                    setExpandedOrgId(expandedOrgId === org.id ? null : org.id);
                    switchOrg(org.id);
                    // Auto-select first establishment if none selected
                    if (org.establishments.length > 0) {
                      switchEtb(org.establishments[0].id);
                    }
                  }}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">{org.name}</span>
                  {org.establishments.length > 0 && (
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform ${
                        expandedOrgId === org.id ? "rotate-90" : ""
                      }`}
                    />
                  )}
                </Button>

                {expandedOrgId === org.id && (
                  <div className="space-y-1 pl-6">
                    {org.establishments.map((etb) => (
                      <Button
                        key={etb.id}
                        variant="ghost"
                        className={`w-full justify-start gap-2 px-2 h-8 text-sm ${
                          currentOrg.id === org.id && currentEtb?.id === etb.id
                            ? "bg-accent"
                            : ""
                        }`}
                        onClick={() => {
                          switchOrg(org.id);
                          switchEtb(etb.id);
                          setIsOpen(false);
                        }}
                      >
                        <Store className="h-3.5 w-3.5" />
                        <span className="flex-1 text-left">{etb.name}</span>
                        {currentOrg.id === org.id &&
                          currentEtb?.id === etb.id && (
                            <span className="text-xs">✓</span>
                          )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Dropdown with hover
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 w-[220px] justify-start">
          <Building2 className="h-4 w-4" />
          <span className="truncate">{currentOrg.name}</span>
          <ChevronRight className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuSub key={org.id}>
            <DropdownMenuSubTrigger
              className={org.id === currentOrg.id ? "bg-accent" : ""}
              onClick={() => switchOrg(org.id)}
            >
              <Building2 className="h-4 w-4 mr-2" />
              <span className="flex-1">{org.name}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {org.establishments.map((etb) => (
                <DropdownMenuItem
                  key={etb.id}
                  className={
                    currentOrg.id === org.id && currentEtb?.id === etb.id
                      ? "bg-accent"
                      : ""
                  }
                  onClick={() => {
                    switchOrg(org.id);
                    switchEtb(etb.id);
                  }}
                >
                  <Store className="h-4 w-4 mr-2" />
                  <span>{etb.name}</span>
                  {currentOrg.id === org.id && currentEtb?.id === etb.id && (
                    <DropdownMenuShortcut>✓</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session");
        const sessionData = await response.json();
        setUser(sessionData?.session?.user);
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  const handleLogout = async () => {
    // Get the current session to retrieve id_token
    try {
      const response = await fetch("/api/auth/session");
      const sessionData = await response.json();
      const idToken = sessionData?.session?.idToken;

      // First, call NextAuth signOut to clear local session
      await signOut({ redirect: false });

      // Then redirect to OIDC logout URL with id_token_hint
      const logoutUrl = process.env.NEXT_PUBLIC_OIDC_LOGOUT_URL
        ? `${process.env.NEXT_PUBLIC_OIDC_LOGOUT_URL}?id_token_hint=${encodeURIComponent(idToken || "")}&post_logout_redirect_uri=${encodeURIComponent(window.location.origin + "/auth/login")}`
        : "/auth/login";

      window.location.href = logoutUrl;
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to simple logout
      await signOut({ redirect: false });
      window.location.href = "/auth/login";
    }
  };

  if (loading || !user) {
    return (
      <Button variant="ghost" size="icon">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-primary/20 animate-pulse" />
        </div>
      </Button>
    );
  }

  const initials = user.firstName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            {user.image ? (
              <img
                src={getCdnUrl(user.image) || undefined}
                alt={user.firstName || "User"}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium">{initials || "U"}</span>
            )}
          </div>
          <span className="hidden md:inline text-sm">
            {user.firstName?.split(" ")[0] || "User"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  const isMobile = useMobile();
  const [open, setOpen] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const pathname = usePathname();

  // Fetch establishment details and check if settings are incomplete
  useEstablishmentDetails();
  const [settingsIncomplete] = useAtom(settingsIncompleteAtom);

  // Helper to check if a path is active
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/admin";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleNoOrganizations = React.useCallback(() => {
    setShowOnboarding(true);
  }, []);

  const handleOnboardingComplete = React.useCallback(() => {
    setShowOnboarding(false);
  }, []);

  return (
    <>
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
      <div className="grid h-screen w-full overflow-hidden lg:grid-cols-[280px_1fr]">
        {/* Mobile Header */}
        {isMobile && (
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden sticky top-0 z-50">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-4 space-y-4">
                  {/* Mobile Org Switcher */}
                  <OrgSwitcher
                    isMobile
                    onNoOrganizations={handleNoOrganizations}
                  />

                  {/* Mobile Nav */}
                  <nav className="space-y-6">
                    {navigation.map((section) => (
                      <div key={section.title}>
                        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase">
                          {section.title}
                        </h3>
                        <div className="space-y-1">
                          {section.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                isActive(item.href)
                                  ? "bg-accent text-primary"
                                  : "text-muted-foreground hover:text-primary hover:bg-accent/50",
                              )}
                            >
                              <span className="relative">
                                {item.icon}
                                {item.showIndicator && settingsIncomplete && (
                                  <>
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                    </span>
                                  </>
                                )}
                              </span>
                              <span>{item.title}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="font-semibold">Sawi Studio</h1>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </header>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden h-screen border-r bg-muted/40 lg:block dark:bg-zinc-950">
          <div className="flex h-full flex-col overflow-hidden">
            {/* Sidebar Header */}
            <div className="flex h-16 items-center border-b px-6">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold text-lg"
              >
                <Building2 className="h-6 w-6" />
                <span>Sawi Studio</span>
              </Link>
            </div>

            {/* Org Switcher */}
            <div className="p-4">
              <OrgSwitcher onNoOrganizations={handleNoOrganizations} />
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
              <nav className="space-y-6 px-4">
                {navigation.map((section) => {
                  return (
                    <div key={section.title}>
                      <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase">
                        {section.title}
                      </h3>
                      <div className="space-y-1">
                        {section.items.map((item) => {
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                isActive(item.href)
                                  ? "bg-accent text-primary"
                                  : "text-muted-foreground hover:text-primary hover:bg-accent/50",
                              )}
                            >
                              <span className="relative">
                                {item.icon}
                                {item.showIndicator && settingsIncomplete && (
                                  <>
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                    </span>
                                  </>
                                )}
                              </span>
                              <span>{item.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* User Menu - Desktop */}
            <div className="border-t p-4">
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex h-screen flex-col overflow-hidden">
          {/* Desktop Header */}
          {!isMobile && (
            <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
              <div className="flex-1" />
              <UserMenu />
            </header>
          )}
          <main className="flex-1 overflow-y-auto p-4 pt-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
