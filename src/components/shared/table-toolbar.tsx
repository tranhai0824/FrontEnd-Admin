"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TableToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  status?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function TableToolbar({ query, onQueryChange, status = "all", onStatusChange, statusOptions = [], placeholder = "Tìm kiếm..." }: TableToolbarProps) {
  const hasFilters = Boolean(query || status !== "all");
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-white p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => onQueryChange(event.target.value)} className="pl-9" placeholder={placeholder} /></div>
      {onStatusChange && <Select value={status} onValueChange={onStatusChange}><SelectTrigger className="w-full sm:w-48"><SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>}
      {hasFilters && <Button variant="ghost" size="sm" onClick={() => { onQueryChange(""); onStatusChange?.("all"); }}><X /> Xóa lọc</Button>}
    </div>
  );
}

