import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrashPaginationProps {
  currentPage: number;
  totalPages: number;
  search?: string;
}

function buildHref(page: number, search?: string): string {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/trash${qs ? `?${qs}` : ""}`;
}

export function TrashPagination({ currentPage, totalPages, search }: TrashPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Trash pagination" className="mt-6 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Button asChild variant="outline" size="sm">
          <Link href={buildHref(currentPage - 1, search)}>
            <ChevronLeft className="mr-1 size-4" />
            Previous
          </Link>
        </Button>
      )}
      <span className="text-muted-foreground text-sm">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <Button asChild variant="outline" size="sm">
          <Link href={buildHref(currentPage + 1, search)}>
            Next
            <ChevronRight className="ml-1 size-4" />
          </Link>
        </Button>
      )}
    </nav>
  );
}
