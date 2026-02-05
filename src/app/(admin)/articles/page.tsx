"use client";

import { useState, useEffect, useCallback } from "react";
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
import { CDN_BASE_URL } from "@/lib/config";
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
} from "lucide-react";
import { useScope } from "@/hooks/useScopedQuery";

type ViewMode = "table" | "grid";

export default function ArticleListItemsAdminPage() {
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

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  // Fetch articles from Prisma API (with pagination)
  const [articles, setArticleListItems] = useState<ArticleListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArticleListItems = useCallback(async () => {
    if (!scope.orgId || !scope.etbId) {
      setArticleListItems([]);
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
        setArticleListItems(data.articles);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch articles");
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Error loading articles");
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
    fetchArticleListItems();
  }, [fetchArticleListItems]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterPublish, filterType, searchQuery]);

  // Client-side search filter
  const filteredArticleListItems = articles.filter((article: ArticleListItem) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.designation?.toLowerCase().includes(query) ||
      article.reference.toLowerCase().includes(query) ||
      article.description?.toLowerCase().includes(query)
    );
  });

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

  const formatTimestamp = (date?: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6" />
            ArticleListItems Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catalog from PostgreSQL (with pagination)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterPublish === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPublish(undefined)}
          >
            All
          </Button>
          <Button
            variant={filterPublish === true ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPublish(true)}
          >
            Published
          </Button>
          <Button
            variant={filterPublish === false ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPublish(false)}
          >
            Draft
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Empty State */}
            {articles.length === 0 && !isLoading && (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No ArticleListItems Found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {!scope.orgId || !scope.etbId
                    ? "Select an organization and establishment from the admin shell"
                    : "Try adjusting your filters"}
                </p>
              </Card>
            )}

            {/* ArticleListItems List/Grid */}
            {filteredArticleListItems.length > 0 && (
              <>
                {/* Toolbar */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {/* {filteredArticleListItems.length} articles
                    {pagination &&
                      ` (page ${page} of ${pagination.totalPages})`} */}
                    {pagination && <div>{pagination.total} total articles</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Table View (Desktop) */}
                {viewMode === "table" && (
                  <div className="hidden md:block rounded-lg border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ArticleListItem</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredArticleListItems.map((article: ArticleListItem) => (
                          <TableRow
                            key={article.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {article.media && article.media !== "" ? (
                                  <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                                    <img
                                      src={`${CDN_BASE_URL}/${article.media}`}
                                      alt={
                                        article.designation || article.reference
                                      }
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
                                    {article.designation || "Untitled"}
                                  </p>
                                  {article.shortDescription && (
                                    <p className="text-sm text-muted-foreground truncate">
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
                                <Badge
                                  className={getProductTypeColor(
                                    article.productType,
                                  )}
                                >
                                  {article.productType.replace(/_/g, " ")}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {article.isPublish ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Draft
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatTimestamp(article.updatedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Grid View (Mobile & Desktop) */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredArticleListItems.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                )}

                {/* Mobile Table View */}
                {viewMode === "table" && (
                  <div className="md:hidden space-y-4">
                    {filteredArticleListItems.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                )}

                {/* Pagination at bottom */}
                {pagination && (
                  <div className="border-t pt-4">
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
    </div>
  );
}
