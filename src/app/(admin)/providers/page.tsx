"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PaginationData, ProviderListItem } from "@/lib/types";
import { toast } from "sonner";
import {
  Truck,
  Search,
  Plus,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  Trash2,
  Eye,
} from "lucide-react";
import { useScope } from "@/hooks/use-scope";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProvidersPage() {
  const router = useRouter();
  const scope = useScope();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterNature, setFilterNature] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [providers, setProviders] = useState<ProviderListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<ProviderListItem | null>(null);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const fetchProviders = useCallback(async () => {
    if (!scope.orgId || !scope.etbId) {
      setProviders([]);
      setPagination(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        idOrg: scope.orgId,
        idEtb: scope.etbId,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filterNature) {
        params.append("nature", filterNature);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/providers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
        setPagination(data.pagination);
      } else {
        toast.error("Erreur lors du chargement des fournisseurs");
      }
    } catch {
      toast.error("Erreur lors du chargement des fournisseurs");
    } finally {
      setIsLoading(false);
    }
  }, [scope.orgId, scope.etbId, page, limit, filterNature, searchQuery]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    setPage(1);
  }, [filterNature, searchQuery]);

  const handleDelete = async () => {
    if (!providerToDelete) return;

    try {
      const response = await fetch(`/api/providers/${providerToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Fournisseur supprimé avec succès");
        fetchProviders();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
    }
  };

  const getDisplayName = (provider: ProviderListItem) => {
    if (provider.nature === "COMPANY") {
      return provider.companyName || "Entreprise";
    }
    return `${provider.firstName || ""} ${provider.lastName || ""}`.trim() || "Sans nom";
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Fournisseurs</h1>
        </div>
        <Button asChild size="sm">
          <Link href="/providers/new">
            <Plus className="w-4 h-4 mr-1" />
            Nouveau
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterNature === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterNature("")}
          >
            Tous
          </Button>
          <Button
            variant={filterNature === "INDIVIDUAL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterNature("INDIVIDUAL")}
          >
            <User className="w-4 h-4 mr-1" />
            Particuliers
          </Button>
          <Button
            variant={filterNature === "COMPANY" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterNature("COMPANY")}
          >
            <Building2 className="w-4 h-4 mr-1" />
            Entreprises
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Empty State */}
            {providers.length === 0 && (
              <Card className="p-8 text-center">
                <Truck className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-1">
                  Aucun fournisseur trouvé
                </h3>
                <p className="text-sm text-muted-foreground">
                  {!scope.orgId || !scope.etbId
                    ? "Sélectionnez une organisation et un établissement"
                    : "Essayez de modifier vos filtres ou ajoutez un nouveau fournisseur"}
                </p>
              </Card>
            )}

            {/* Providers List */}
            {providers.length > 0 && (
              <>
                {/* Table View (Desktop) */}
                <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Adresse</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providers.map((provider) => (
                        <TableRow
                          key={provider.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => router.push(`/providers/${provider.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                {provider.nature === "COMPANY" ? (
                                  <Building2 className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <User className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{getDisplayName(provider)}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {provider.reference}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {provider.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="w-3 h-3 text-muted-foreground" />
                                  <span className="truncate max-w-[200px]">{provider.email}</span>
                                </div>
                              )}
                              {provider.tel && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  <span>{provider.tel}</span>
                                </div>
                              )}
                              {!provider.email && !provider.tel && (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {provider.address ? (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate max-w-[200px]">
                                  {[provider.address.city, provider.address.country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                provider.nature === "COMPANY"
                                  ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                                  : "bg-green-500/10 text-green-700 border-green-500/20"
                              }
                            >
                              {provider.nature === "COMPANY" ? "Entreprise" : "Particulier"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/providers/${provider.id}`);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir les détails
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProviderToDelete(provider);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {providers.map((provider) => (
                    <Card
                      key={provider.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/providers/${provider.id}`)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            {provider.nature === "COMPANY" ? (
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <User className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{getDisplayName(provider)}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {provider.reference}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            provider.nature === "COMPANY"
                              ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                              : "bg-green-500/10 text-green-700 border-green-500/20"
                          }
                        >
                          {provider.nature === "COMPANY" ? "Entreprise" : "Particulier"}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        {provider.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {provider.email}
                          </div>
                        )}
                        {provider.tel && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {provider.tel}
                          </div>
                        )}
                        {provider.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {[provider.address.city, provider.address.country]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && (
                  <div className="pt-4">
                    <Pagination
                      pagination={pagination}
                      onPageChange={setPage}
                      onLimitChange={handleLimitChange}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le fournisseur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong>{providerToDelete ? getDisplayName(providerToDelete) : ""}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
