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
import { ArticleCard } from "@/components/articles/article-card";
import { S3_HOST } from "@/lib/config";
import { PaginationData, ArticleListItem } from "@/lib/types";
import { toast } from "sonner";
import {
  Package,
  Search,
  Grid3x3,
  List,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronRight,
  ChevronDown,
  Upload,
} from "lucide-react";
import { useScope } from "@/hooks/use-scope";
import { ArticleImportDialog } from "@/components/articles/article-import-dialog";

type ViewMode = "table" | "grid";

// Nested article row component
function ArticleRow({
  article,
  router,
  isSubArticle = false,
}: {
  article: ArticleListItem;
  router: ReturnType<typeof useRouter>;
  isSubArticle?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSubArticles = article.subArticles && article.subArticles.length > 0;

  const getProductTypeLabel = (type?: string) => {
    switch (type) {
      case "PHYSICAL_PRODUCT":
        return "Produit physique";
      case "DIGITAL_PRODUCT":
        return "Produit numérique";
      case "SERVICE":
        return "Service";
      case "WEBINAR":
        return "Webinaire";
      default:
        return type?.replace(/_/g, " ") || "-";
    }
  };

  const getProductTypeColor = (type?: string) => {
    switch (type) {
      case "PHYSICAL_PRODUCT":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "DIGITAL_PRODUCT":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "SERVICE":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "WEBINAR":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  return (
    <>
      <TableRow
        className={`hover:bg-muted/50 cursor-pointer ${isSubArticle ? "bg-muted/30" : ""}`}
        onClick={() => router.push(`/articles/${article.id}`)}
      >
        <TableCell>
          <div
            className={`flex items-center gap-3 ${isSubArticle ? "pl-8" : ""}`}
          >
            {hasSubArticles && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            {!hasSubArticles && isSubArticle && (
              <span className="w-6" />
            )}
            {article.media && article.media !== "" ? (
              <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={`${S3_HOST}/${article.media}`}
                  alt={article.designation || article.reference}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">
                {article.designation || "Sans titre"}
              </p>
              {article.shortDescription && (
                <p className="text-sm text-muted-foreground truncate max-w-xs">
                  {article.shortDescription}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="font-mono text-sm">
          {article.reference}
        </TableCell>
        <TableCell>
          {article.productType && (
            <Badge className={getProductTypeColor(article.productType)}>
              {getProductTypeLabel(article.productType)}
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex flex-col items-end gap-1">
            <span className="font-medium">
              {article.taxedPrice != null
                ? `${article.taxedPrice.toFixed(2)} TND`
                : "-"}
            </span>
            {article.discount && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                -{article.discount.value}{article.discount.profitType === "PERCENT" ? "%" : " TND"}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          {article.isPublish ? (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle2 className="w-3 h-3" />
              Publié
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="w-3 h-3" />
              Brouillon
            </Badge>
          )}
        </TableCell>
      </TableRow>
      {expanded &&
        hasSubArticles &&
        article.subArticles!.map((subArticle) => (
          <ArticleRow
            key={subArticle.id}
            article={subArticle}
            router={router}
            isSubArticle={true}
          />
        ))}
    </>
  );
}

export default function ArticlesPage() {
  const router = useRouter();
  const scope = useScope();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filterPublish, setFilterPublish] = useState<boolean | undefined>(
    undefined,
  );
  const [filterType, setFilterType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Fetch articles from Prisma API (with pagination)
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    if (!scope.orgId || !scope.etbId) {
      setArticles([]);
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

      if (filterPublish !== undefined) {
        params.append("isPublish", filterPublish.toString());
      }
      if (filterType) {
        params.append("productType", filterType);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/articles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles);
        setPagination(data.pagination);
      } else {
        toast.error("Erreur lors du chargement des articles");
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Erreur lors du chargement des articles");
    } finally {
      setIsLoading(false);
    }
  }, [
    scope.orgId,
    scope.etbId,
    page,
    limit,
    filterPublish,
    filterType,
    searchQuery,
  ]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterPublish, filterType, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Articles</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4 mr-1" />
            Importer
          </Button>
          <Button asChild size="sm">
            <Link href="/articles/new">
              <Plus className="w-4 h-4 mr-1" />
              Nouveau
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterPublish === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPublish(undefined)}
          >
            Tous
          </Button>
          <Button
            variant={filterPublish === true ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPublish(true)}
          >
            Publiés
          </Button>
          <Button
            variant={filterPublish === false ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPublish(false)}
          >
            Brouillons
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
            {articles.length === 0 && (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-1">
                  Aucun article trouvé
                </h3>
                <p className="text-sm text-muted-foreground">
                  {!scope.orgId || !scope.etbId
                    ? "Sélectionnez une organisation et un établissement"
                    : "Essayez de modifier vos filtres"}
                </p>
              </Card>
            )}

            {/* Articles List/Grid */}
            {articles.length > 0 && (
              <>
                {/* Toolbar */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {pagination && <span>{pagination.total} articles</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode("table")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Table View (Desktop) */}
                {viewMode === "table" && (
                  <div className="hidden lg:block rounded-lg border bg-card overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Article</TableHead>
                          <TableHead>Référence</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Prix TTC</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articles.map((article: ArticleListItem) => (
                          <ArticleRow
                            key={article.id}
                            article={article}
                            router={router}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
                    {articles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onClick={() => router.push(`/articles/${article.id}`)}
                      />
                    ))}
                  </div>
                )}

                {/* Mobile List View */}
                {viewMode === "table" && (
                  <div className="lg:hidden space-y-3">
                    {articles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onClick={() => router.push(`/articles/${article.id}`)}
                      />
                    ))}
                  </div>
                )}

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

      {/* Import Dialog */}
      <ArticleImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        orgId={scope.orgId || ""}
        etbId={scope.etbId || ""}
        onSuccess={fetchArticles}
      />
    </div>
  );
}
