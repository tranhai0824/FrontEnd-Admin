import { Button } from "@/components/ui/button";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, pageCount, onPageChange, disabled }: PaginationProps) {
  const lastPage = Math.max(1, pageCount);
  return (
    <nav aria-label="Phân trang" className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>
        Trước
      </Button>
      <span className="min-w-20 text-center text-sm text-muted-foreground">
        {page} / {lastPage}
      </span>
      <Button variant="outline" size="sm" disabled={disabled || page >= lastPage} onClick={() => onPageChange(page + 1)}>
        Sau
      </Button>
    </nav>
  );
}
