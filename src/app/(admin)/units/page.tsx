"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { PaginationData, UnitListItem } from "@/lib/types";
import { toast } from "sonner";
import { Ruler, Search, Plus, MoreHorizontal, Trash2, Eye } from "lucide-react";
import { useScope } from "@/hooks/use-scope";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function UnitsPage() {
  const router = useRouter();
  const scope = useScope();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<UnitListItem | null>(null);

  const handleLimitChange = (newLimit: number) => { setLimit(newLimit); setPage(1); };

  const fetchUnits = useCallback(async () => {
    if (!scope.orgId || !scope.etbId) { setUnits([]); setPagination(null); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ idOrg: scope.orgId, idEtb: scope.etbId, page: page.toString(), limit: limit.toString() });
      if (searchQuery) params.append("search", searchQuery);
      const response = await fetch(`/api/units?${params}`);
      if (response.ok) { const data = await response.json(); setUnits(data.units); setPagination(data.pagination); }
      else toast.error("Erreur lors du chargement");
    } catch { toast.error("Erreur lors du chargement"); }
    finally { setIsLoading(false); }
  }, [scope.orgId, scope.etbId, page, limit, searchQuery]);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);
  useEffect(() => { setPage(1); }, [searchQuery]);

  const handleDelete = async () => {
    if (!unitToDelete) return;
    try {
      const response = await fetch(`/api/units/${unitToDelete.id}`, { method: "DELETE" });
      if (response.ok) { toast.success("Unité supprimée"); fetchUnits(); }
      else { const data = await response.json(); toast.error(data.error || "Erreur"); }
    } catch { toast.error("Erreur"); }
    finally { setDeleteDialogOpen(false); setUnitToDelete(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><Ruler className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold">Unités</h1></div>
        <Button asChild size="sm"><Link href="/units/new"><Plus className="w-4 h-4 mr-1" />Nouvelle</Link></Button>
      </div>
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => (<Skeleton key={i} className="h-16 w-full" />))}</div>
      ) : units.length === 0 ? (
        <Card className="p-8 text-center">
          <Ruler className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-1">Aucune unité</h3>
          <p className="text-sm text-muted-foreground">Créez des unités pour vos articles (kg, pièce, mètre...)</p>
        </Card>
      ) : (
        <>
          <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Unité</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/units/${unit.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Ruler className="w-5 h-5 text-muted-foreground" /></div>
                        <div>
                          <p className="font-medium">{unit.designation || unit.reference}</p>
                          <p className="text-xs text-muted-foreground font-mono">{unit.reference}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/units/${unit.id}`); }}><Eye className="w-4 h-4 mr-2" />Voir</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setUnitToDelete(unit); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {units.map((unit) => (
              <Card key={unit.id} className="p-4 cursor-pointer" onClick={() => router.push(`/units/${unit.id}`)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Ruler className="w-5 h-5 text-muted-foreground" /></div>
                  <div>
                    <p className="font-medium">{unit.designation || unit.reference}</p>
                    <p className="text-xs text-muted-foreground font-mono">{unit.reference}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} onLimitChange={handleLimitChange} />}
        </>
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer l'unité</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr ?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
