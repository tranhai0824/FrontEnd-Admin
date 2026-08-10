"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertCircle, ArrowDown, ArrowUp, ChevronsUpDown, Download, Inbox, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { PacmanLoader } from "@/components/shared/pacman-loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type SortDirection = "asc" | "desc";
export interface DataTableSort {
  key: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  loadingVariant?: "pacman" | "skeleton";
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  footerLabel?: ReactNode;
  filters?: readonly { key: string; label: string; onRemove: () => void }[];
  selectable?: boolean;
  renderBulkActions?: (selectedRows: readonly T[], clearSelection: () => void) => ReactNode;
  csv?: {
    fileName: string;
    columns: readonly { header: string; value: (row: T) => string | number | null | undefined }[];
  };
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  loadingVariant = "pacman",
  error,
  onRetry,
  emptyTitle = "Không có dữ liệu",
  emptyDescription,
  page,
  pageCount,
  onPageChange,
  sort,
  onSortChange,
  footerLabel,
  filters = [],
  selectable,
  renderBulkActions,
  csv,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(getRowId(row))),
    [getRowId, rows, selectedIds],
  );
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIds.has(getRowId(row)));
  const columnCount = columns.length + (selectable ? 1 : 0);

  const toggleAll = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      rows.forEach((row) => allVisibleSelected ? next.delete(getRowId(row)) : next.add(getRowId(row)));
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCsv = () => {
    if (!csv) return;
    const escape = (value: string | number | null | undefined) => {
      const text = String(value ?? "");
      return `"${text.replaceAll("\"", "\"\"")}"`;
    };
    const source = selectedRows.length ? selectedRows : rows;
    const content = [
      csv.columns.map((column) => escape(column.header)).join(","),
      ...source.map((row) => csv.columns.map((column) => escape(column.value(row))).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = csv.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const changeSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSortChange) return;
    onSortChange({
      key: column.key,
      direction: sort?.key === column.key && sort.direction === "asc" ? "desc" : "asc",
    });
  };

  return (
    <div>
      {filters.length || selectedRows.length || csv ? (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          {filters.map((filter) => (
            <span key={filter.key} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
              {filter.label}
              <button type="button" aria-label={`Xóa bộ lọc ${filter.label}`} onClick={filter.onRemove}><X className="h-3.5 w-3.5" /></button>
            </span>
          ))}
          {selectedRows.length ? (
            <>
              <span className="ml-auto text-sm font-medium">{selectedRows.length} mục đã chọn</span>
              {renderBulkActions?.(selectedRows, () => setSelectedIds(new Set()))}
            </>
          ) : null}
          {csv ? (
            <Button className={selectedRows.length ? "" : "ml-auto"} variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4" /> Xuất CSV
            </Button>
          ) : null}
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            {selectable ? (
              <TableHead className="w-12">
                <input type="checkbox" aria-label="Chọn tất cả hàng đang hiển thị" checked={allVisibleSelected} onChange={toggleAll} />
              </TableHead>
            ) : null}
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.sortable ? (
                  <button className="inline-flex items-center gap-1" type="button" onClick={() => changeSort(column)}>
                    {column.header}
                    {sort?.key !== column.key ? <ChevronsUpDown className="h-3.5 w-3.5" /> : sort.direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                  </button>
                ) : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="p-0">
                {loadingVariant === "skeleton" ? (
                  <div className="space-y-3 p-4" aria-label="Đang tải dữ liệu">
                    {Array.from({ length: 5 }, (_, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4">
                        <div className="h-5 animate-pulse rounded-sm bg-muted" />
                        <div className="h-5 animate-pulse rounded-sm bg-muted" />
                        <div className="h-5 animate-pulse rounded-sm bg-muted" />
                        <div className="h-5 animate-pulse rounded-sm bg-muted" />
                      </div>
                    ))}
                  </div>
                ) : <PacmanLoader />}
              </TableCell>
            </TableRow>
          ) : null}
          {!loading && !error ? rows.map((row) => (
            <TableRow key={getRowId(row)}>
              {selectable ? (
                <TableCell>
                  <input type="checkbox" aria-label={`Chọn hàng ${getRowId(row)}`} checked={selectedIds.has(getRowId(row))} onChange={() => toggleRow(getRowId(row))} />
                </TableCell>
              ) : null}
              {columns.map((column) => <TableCell key={column.key} className={column.className}>{column.cell(row)}</TableCell>)}
            </TableRow>
          )) : null}
          {!loading && error ? (
            <TableRow><TableCell colSpan={columnCount}><EmptyState icon={AlertCircle} title="Không tải được dữ liệu" description={error} action={onRetry ? <Button variant="outline" onClick={onRetry}>Thử lại</Button> : undefined} /></TableCell></TableRow>
          ) : null}
          {!loading && !error && rows.length === 0 ? (
            <TableRow><TableCell colSpan={columnCount}><EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} /></TableCell></TableRow>
          ) : null}
        </TableBody>
      </Table>
      {(footerLabel || (page && pageCount && onPageChange)) ? (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">{footerLabel}</div>
          {page && pageCount && onPageChange ? <Pagination page={page} pageCount={pageCount} onPageChange={onPageChange} disabled={loading} /> : null}
        </div>
      ) : null}
    </div>
  );
}
