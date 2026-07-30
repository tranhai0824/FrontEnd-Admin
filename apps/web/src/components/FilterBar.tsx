import React from 'react';
import {
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedChip: string;
  setSelectedChip: (chip: string) => void;
  visibleCount: number;
  totalCount: number;
}

const CATEGORIES = [
  { value: 'Toàn phần', label: 'Loại học bổng' },
  { value: 'Lĩnh vực', label: 'Lĩnh vực đào tạo' },
  { value: 'Địa điểm', label: 'Địa điểm học tập' },
  { value: 'Cấp học', label: 'Trình độ đào tạo' },
  { value: 'Du học', label: 'Hình thức học tập' }
];

const CHIPS_BY_CATEGORY: Record<string, string[]> = {
  'Toàn phần': ['Tất cả', 'Toàn phần', 'Bán phần'],
  'Lĩnh vực': ['Tất cả', 'Nông nghiệp', 'Công nghệ thông tin', 'Kinh tế', 'Đa ngành'],
  'Địa điểm': ['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Hưng Yên', 'Nhật Bản'],
  'Cấp học': ['Tất cả', 'Đại học', 'Thạc sĩ'],
  'Du học': ['Tất cả', 'Trong nước', 'Du học']
};

export default function FilterBar({
  selectedCategory,
  setSelectedCategory,
  selectedChip,
  setSelectedChip,
  visibleCount,
  totalCount
}: FilterBarProps) {
  const chips = CHIPS_BY_CATEGORY[selectedCategory] || ['Tất cả'];

  return (
    <div className="mb-6 flex flex-col gap-3 select-none md:flex-row md:items-start md:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start">
        <label className="relative flex h-11 w-full shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#2C2C2B] transition-colors focus-within:border-[#2783DE] focus-within:ring-2 focus-within:ring-[#2783DE]/20 sm:w-[220px]">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#7D7A75]" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedChip('Tất cả');
            }}
            aria-label="Lọc theo tiêu chí"
            className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-7 text-sm font-semibold text-[#2C2C2B] outline-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D7A75]" />
        </label>

        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {chips.map((chip) => {
            const isActive = selectedChip === chip;

            return (
              <button
                key={chip}
                type="button"
                onClick={() => setSelectedChip(chip)}
                className={`inline-flex h-[32px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-[24px] py-2.5 text-[15px] font-semibold transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                  isActive
                    ? 'border-[#111827] bg-white text-[#111827] hover:bg-[#F0F0F0]'
                    : 'border-[#111827] bg-white text-[#111827] hover:bg-[#F0F0F0] hover:border-[#111827]'
                }`}
                aria-pressed={isActive}
              >
                <span>{chip}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="inline-flex h-8 shrink-0 items-center self-start rounded-lg bg-slate-100 px-3 text-xs font-medium text-[#7D7A75] md:mt-1.5">
        Hiển thị: <span className="mx-1 font-semibold text-[#2783DE]">{visibleCount}</span> / {totalCount} học bổng
      </div>
    </div>
  );
}
