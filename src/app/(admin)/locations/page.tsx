"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Package, MapPin, Plus, Download, Upload, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, ActionButton, ActionGroup } from "@/components/admin/page-header";
import { useSetAtom } from "jotai";
import {
  switchOrganizationAtom,
  switchEstablishmentAtom,
} from "@/lib/store/auth-oidc";

type Location = {
  id: string;
  reference: string;
  name: string | null | undefined;
  volume: string | null | undefined;
  deposit: {
    id: string;
    name: string | null | undefined;
    reference: string;
  } | null;
  establishment: {
    id: string;
    name: string | null | undefined;
    reference: string;
  } | null;
  organization: {
    id: string;
    name: string | null | undefined;
    reference: string;
  } | null;
};

export default function LocationsPage() {
  const locations = useQuery(api.organizations.listAllLocations);
  const switchOrg = useSetAtom(switchOrganizationAtom);
  const switchEtb = useSetAtom(switchEstablishmentAtom);

  const handleLocationClick = (location: Location) => {
    if (location.establishment?.id && location.organization?.id) {
      // First switch to the organization (this also resets establishment)
      switchOrg(location.organization.id);
      // Then switch to the specific establishment
      switchEtb(location.establishment.id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Physical locations within your deposits"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Locations" },
        ]}
        stats={[
          {
            icon: <MapPin className="w-4 h-4" />,
            label: "locations",
            value: locations?.length ?? 0,
          },
        ]}
        actions={
          <ActionGroup>
            <ActionButton variant="ghost" size="sm" icon={<Upload className="w-4 h-4" />}>
              Import
            </ActionButton>
            <ActionButton variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
              Export
            </ActionButton>
            <ActionButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              New Location
            </ActionButton>
          </ActionGroup>
        }
      />

      {/* Loading State */}
      {locations === undefined && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {locations !== undefined && locations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations found</h3>
            <p className="text-sm text-muted-foreground text-center">
              Locations are physical storage spaces within deposits
            </p>
          </CardContent>
        </Card>
      )}

      {/* Locations Grid */}
      {locations && locations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              onClick={() => handleLocationClick(loc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LocationCard({
  location,
  onClick,
}: {
  location: Location;
  onClick: () => void;
}) {
  return (
    <Card
      className="group hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate pr-2">
              {location.name || "Unnamed Location"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {location.deposit?.name || "Unknown Deposit"}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Reference */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground w-12 shrink-0 text-xs">Ref:</span>
          <span className="font-mono text-foreground/80 truncate">
            {location.reference}
          </span>
        </div>

        {/* Deposit */}
        {location.deposit && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-12 shrink-0 text-xs">Deposit:</span>
            <span className="text-foreground/80 truncate">
              {location.deposit.reference}
            </span>
          </div>
        )}

        {/* Establishment */}
        {location.establishment && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-12 shrink-0 text-xs">Etab:</span>
            <span className="text-foreground/80 truncate">
              {location.establishment.reference}
            </span>
          </div>
        )}

        {/* Volume */}
        {location.volume && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-12 shrink-0 text-xs">Volume:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {location.volume}
            </span>
          </div>
        )}

        {/* Organization */}
        {location.organization && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-12 shrink-0 text-xs">Org:</span>
            <span className="text-foreground/80 truncate">
              {location.organization.reference}
            </span>
          </div>
        )}

        {/* Action hint */}
        <div className="pt-2 border-t text-xs text-muted-foreground text-center">
          Click to view details
        </div>
      </CardContent>
    </Card>
  );
}
