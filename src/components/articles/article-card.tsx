import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Box, ChevronRight } from "lucide-react";
import { S3_HOST } from "@/lib/config";
import { ArticleListItem } from "@/lib/types";

interface ArticleCardProps {
  article: ArticleListItem;
  onClick?: () => void;
}

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

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  const hasSubArticles = article.subArticles && article.subArticles.length > 0;

  return (
    <Card
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm font-semibold truncate">
                {article.designation || article.reference}
              </CardTitle>
              {article.isPublish ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Réf: {article.reference}
            </p>
          </div>

          <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img
              src={
                article.media && article.media !== ""
                  ? `${S3_HOST}/${article.media}`
                  : `/placeholder.png`
              }
              alt={article.designation || article.reference}
              className="size-full object-cover"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {article.shortDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {article.shortDescription}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {article.productType && (
              <Badge className={`${getProductTypeColor(article.productType)} text-xs`}>
                {getProductTypeLabel(article.productType)}
              </Badge>
            )}
            {article.isService && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="w-3 h-3" />
                Service
              </Badge>
            )}
            {article.isDigitalProduct && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Box className="w-3 h-3" />
                Numérique
              </Badge>
            )}
          </div>
          {article.taxedPrice != null && (
            <div className="ml-auto flex flex-col items-end gap-0.5">
              <span className="font-semibold text-sm">
                {article.taxedPrice.toFixed(2)} TND
              </span>
              {article.discount && (
                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                  -{article.discount.value}{article.discount.profitType === "PERCENT" ? "%" : " TND"}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Sub-articles list */}
        {hasSubArticles && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Variantes ({article.subArticles!.length})
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {article.subArticles!.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/50 hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to sub-article
                    window.location.href = `/articles/${sub.id}`;
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {sub.media && (
                      <img
                        src={`${S3_HOST}/${sub.media}`}
                        alt=""
                        className="w-5 h-5 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <span className="truncate">{sub.designation || sub.reference}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  </div>
                  {sub.taxedPrice != null && (
                    <span className="font-medium flex-shrink-0 ml-2">
                      {sub.taxedPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
