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
import { PaginationData } from "@/lib/types";
import { toast } from "sonner";
import { Receipt, Search, Plus, Percent, MoreHorizontal, Trash2, Eye } from "lucide-react";
import { useScope } from "@/hooks/use-scope";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type TaxItem = {
  id: string;
  reference: string;
  designation: string | null;
  value: number | null;
  taxType: string | null;
  createdAt: string | null;
};

export default function TaxesPage() {
  const router = useRouter();
  const scope = useScope();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [taxes, setTaxes] = useState<TaxItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taxToDelete, setTaxToDelete] = useState<TaxItem | null>(null);

  const handleLimitChange = (newLimit: number) => { setLimit(newLimit); setPage(1); };

  const fetchTaxes = useCallback(async () => {
    if (!scope.orgId || !scope.etbId) { setTaxes([]); setPagination(null); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ idOrg: scope.orgId, idEtb: scope.etbId, page: page.toString(), limit: limit.toString() });
      if (searchQuery) params.append("search", searchQuery);
      const response = await fetch(`/api/taxes?${params}`);
      if (response.ok) { const data = await response.json(); setTaxes(data.taxes); setPagination(data.pagination); }
      else toast.error("Erreur lors du chargement");
    } catch { toast.error("Erreur lors du chargement"); }
    finally { setIsLoading(false); }
  }, [scope.orgId, scope.etbId, page, limit, searchQuery]);

  useEffect(() => { fetchTaxes(); }, [fetchTaxes]);
  useEffect(() => { setPage(1); }, [searchQuery]);

  const handleDelete = async () => {
    if (!taxToDelete) return;
    try {
      const response = await fetch(`/api/taxes/${taxToDelete.id}`, { method: "DELETE" });
      if (response.ok) { toast.success("Taxe supprimée"); fetchTaxes(); }
      else { const data = await response.json(); toast.error(data.error || "Erreur"); }
    } catch { toast.error("Erreur"); }
    finally { setDeleteDialogOpen(false); setTaxToDelete(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /><h1 className="text-xl font-semibold">Taxes</h1></div>
        <Button asChild size="sm"><Link href="/taxes/new"><Plus className="w-4 h-4 mr-1" />Nouvelle</Link></Button>
      </div>
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => (<Skeleton key={i} className="h-16 w-full" />))}</div>
      ) : taxes.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-1">Aucune taxe</h3>
          <p className="text-sm text-muted-foreground">Créez des taxes pour vos articles (TVA, etc.)</p>
        </Card>
      ) : (
        <>
          <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Taxe</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Valeur</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
              <TableBody>
                {taxes.map((tax) => (
                  <TableRow key={tax.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/taxes/${tax.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Receipt className="w-5 h-5 text-muted-foreground" /></div>
                        <div>
                          <p className="font-medium">{tax.designation || tax.reference}</p>
                          <p className="text-xs text-muted-foreground font-mono">{tax.reference}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{tax.taxType || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{tax.value != null ? `${tax.value}%` : "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/taxes/${tax.id}`); }}><Eye className="w-4 h-4 mr-2" />Voir</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setTaxToDelete(tax); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {taxes.map((tax) => (
              <Card key={tax.id} className="p-4 cursor-pointer" onClick={() => router.push(`/taxes/${tax.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Percent className="w-5 h-5 text-muted-foreground" /></div>
                    <div>
                      <p className="font-medium">{tax.designation || tax.reference}</p>
                      <p className="text-xs text-muted-foreground">{tax.taxType}</p>
                    </div>
                  </div>
                  <span className="font-medium">{tax.value != null ? `${tax.value}%` : "-"}</span>
                </div>
              </Card>
            ))}
          </div>
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} onLimitChange={handleLimitChange} />}
        </>
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer la taxe</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr ?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
