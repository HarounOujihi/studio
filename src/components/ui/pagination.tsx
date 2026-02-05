"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  showLimitSelector?: boolean;
  showTotal?: boolean;
}

const DEFAULT_LIMIT_OPTIONS = [10, 20, 50, 100];

export function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = DEFAULT_LIMIT_OPTIONS,
  showLimitSelector = true,
  showTotal = true,
}: PaginationProps) {
  const { page, limit, total, totalPages } = pagination;

  // Calculate page range to show
  const getPageRange = () => {
    const range: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always show first page
      range.push(1);

      if (page > 3) {
        range.push("...");
      }

      // Show pages around current
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      if (page < totalPages - 2) {
        range.push("...");
      }

      // Always show last page
      range.push(totalPages);
    }

    return range;
  };

  const pageRange = getPageRange();
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Items per page selector */}
      {showLimitSelector && onLimitChange && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Show</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">per page</span>
        </div>
      )}

      {/* Page info */}
      {showTotal && (
        <div className="text-sm text-muted-foreground">
          Showing {startIndex}-{endIndex} of {total}
        </div>
      )}

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageRange.map((p, index) =>
            typeof p === "number" ? (
              <Button
                key={index}
                variant={p === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p)}
                className="w-9 h-9"
              >
                {p}
              </Button>
            ) : (
              <span key={index} className="px-2 text-muted-foreground">
                {p}
              </span>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
