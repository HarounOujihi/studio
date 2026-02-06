import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Box, Image as ImageIcon } from "lucide-react";
import { S3_HOST } from "@/lib/config";
import { ArticleListItem } from "@/lib/types";

interface ArticleCardProps {
  article: ArticleListItem;
  onClick?: () => void;
}

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

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-base font-semibold truncate">
                {article.designation || article.reference}
              </CardTitle>
              {article.isPublish ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Ref: {article.reference}
            </p>
          </div>

          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
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
      <CardContent className="space-y-3">
        {article.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {article.shortDescription}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {article.productType && (
            <Badge className={getProductTypeColor(article.productType)}>
              {article.productType.replace(/_/g, " ")}
            </Badge>
          )}
          {article.isService && (
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              Service
            </Badge>
          )}
          {article.isDigitalProduct && (
            <Badge variant="outline" className="gap-1">
              <Box className="w-3 h-3" />
              Digital
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Updated: {formatTimestamp(article.updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
