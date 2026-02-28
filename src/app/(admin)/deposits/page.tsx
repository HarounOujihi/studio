"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { PaginationData, DepositListItem } from "@/lib/types";
import { toast } from "sonner";
import { Warehouse, Search, Plus, MapPin, CheckCircle, MoreHorizontal, Trash2, Eye } from "lucide-react";
import { useScope } from "@/hooks/use-scope";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const getTypeLabel = (type: string) => {
  switch (type) {
    case "WAREHOUSE": return "Entrepôt";
    case "STORE": return "Magasin";
    case "SHOWROOM": return "Showroom";
    default: return type;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "WAREHOUSE": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    case "STORE": return "bg-green-500/10 text-green-700 border-green-500/20";
    case "SHOWROOM": return "bg-purple-500/10 text-purple-700 border-purple-500/20";
    default: return "bg-gray-500/10 text-gray-700 border-gray-500/20";
  }
};

export default function DepositsPage() {
  const router = useRouter();
  const scope = useScope();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deposits, setDeposits] = useState<DepositListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState<DepositListItem | null>(null);

  const handleLimitChange = (newLimit: number) => { setLimit(newLimit); setPage(1); };

  const fetchDeposits = useCallback(async () => {
    if (!scope.orgId || !scope.etbId) { setDeposits([]); setPagination(null); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ idOrg: scope.orgId, idEtb: scope.etbId, page: page.toString(), limit: limit.toString() });
      if (filterType) params.append("type", filterType);
      if (searchQuery) params.append("search", searchQuery);
      const response = await fetch(`/api/deposits?${params}`);
      if (response.ok) { const data = await response.json(); setDeposits(data.deposits); setPagination(data.pagination); }
      else toast.error("Erreur lors du chargement des dépôts");
    } catch { toast.error("Erreur lors du chargement des dépôts"); }
    finally { setIsLoading(false); }
  }, [scope.orgId, scope.etbId, page, limit, filterType, searchQuery]);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);
  useEffect(() => { setPage(1); }, [filterType, searchQuery]);

  const handleDelete = async () => {
    if (!depositToDelete) return;
    try {
      const response = await fetch(`/api/deposits/${depositToDelete.id}`, { method: "DELETE" });
      if (response.ok) { toast.success("Dépôt supprimé"); fetchDeposits(); }
      else { const data = await response.json(); toast.error(data.error || "Erreur"); }
    } catch { toast.error("Erreur lors de la suppression"); }
    finally { setDeleteDialogOpen(false); setDepositToDelete(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Dépôts</h1>
        </div>
        <Button asChild size="sm"><Link href="/deposits/new"><Plus className="w-4 h-4 mr-1" />Nouveau</Link></Button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={filterType === "" ? "default" : "outline"} size="sm" onClick={() => setFilterType("")}>Tous</Button>
          <Button variant={filterType === "WAREHOUSE" ? "default" : "outline"} size="sm" onClick={() => setFilterType("WAREHOUSE")}>Entrepôts</Button>
          <Button variant={filterType === "STORE" ? "default" : "outline"} size="sm" onClick={() => setFilterType("STORE")}>Magasins</Button>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => (<Skeleton key={i} className="h-16 w-full" />))}</div>
      ) : deposits.length === 0 ? (
        <Card className="p-8 text-center">
          <Warehouse className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-1">Aucun dépôt trouvé</h3>
          <p className="text-sm text-muted-foreground">Créez votre premier dépôt pour commencer</p>
        </Card>
      ) : (
        <>
          <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Dépôt</TableHead><TableHead>Type</TableHead><TableHead>Adresse</TableHead><TableHead>Emplacements</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
              <TableBody>
                {deposits.map((deposit) => (
                  <TableRow key={deposit.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/deposits/${deposit.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Warehouse className="w-5 h-5 text-muted-foreground" /></div>
                        <div>
                          <p className="font-medium">{deposit.designation || deposit.reference}</p>
                          <p className="text-xs text-muted-foreground font-mono">{deposit.reference}</p>
                        </div>
                        {deposit.isDefault && <Badge variant="secondary" className="ml-2"><CheckCircle className="w-3 h-3 mr-1" />Par défaut</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={getTypeColor(deposit.type)}>{getTypeLabel(deposit.type)}</Badge></TableCell>
                    <TableCell>
                      {deposit.address ? (
                        <div className="flex items-center gap-1 text-sm"><MapPin className="w-3 h-3 text-muted-foreground" /><span>{[deposit.address.city, deposit.address.country].filter(Boolean).join(", ")}</span></div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{deposit.locationCount || 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/deposits/${deposit.id}`); }}><Eye className="w-4 h-4 mr-2" />Voir</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDepositToDelete(deposit); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {deposits.map((deposit) => (
              <Card key={deposit.id} className="p-4 cursor-pointer" onClick={() => router.push(`/deposits/${deposit.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Warehouse className="w-5 h-5 text-muted-foreground" /></div>
                    <div>
                      <p className="font-medium">{deposit.designation || deposit.reference}</p>
                      <p className="text-xs text-muted-foreground font-mono">{deposit.reference}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getTypeColor(deposit.type)}>{getTypeLabel(deposit.type)}</Badge>
                </div>
              </Card>
            ))}
          </div>
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} onLimitChange={handleLimitChange} />}
        </>
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer le dépôt</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir supprimer ce dépôt ?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
