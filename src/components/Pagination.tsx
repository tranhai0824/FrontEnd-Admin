import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getVisiblePages(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('ellipsis');

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) pages.push('ellipsis');

  pages.push(totalPages);
  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
      aria-label="Phân trang danh sách học bổng"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors duration-150 cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2783DE]/35 disabled:pointer-events-none disabled:opacity-40"
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2 sm:flex">
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex min-h-11 min-w-8 items-center justify-center text-slate-400"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2783DE]/35 ${
                currentPage === page
                  ? 'border-[#2783DE] bg-[#2783DE] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              aria-label={`Trang ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      <span className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-500 sm:ml-1">
        <span className="font-semibold text-[#2783DE]">{currentPage}</span>
        <span className="mx-1">/</span>
        <span>{totalPages} trang</span>
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors duration-150 cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2783DE]/35 disabled:pointer-events-none disabled:opacity-40"
        aria-label="Trang sau"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}
