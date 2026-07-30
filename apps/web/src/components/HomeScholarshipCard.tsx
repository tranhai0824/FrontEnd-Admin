import React from 'react';
import { ScholarshipItem, formatDate } from '../data/mockScholarships';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeScholarshipCardProps {
  key?: React.Key;
  scholarship: ScholarshipItem;
  onToggleFavorite: (id: string) => void;
  onViewDetails?: (scholarship: ScholarshipItem) => void;
}

function SponsorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2 23 7.5H1z" />
      <rect width="22" height="1.6" rx="0.3" x="1" y="8.5" />
      <rect width="2.2" height="8.4" rx="0.3" x="3" y="10.6" />
      <rect width="2.2" height="8.4" rx="0.3" x="8.2" y="10.6" />
      <rect width="2.2" height="8.4" rx="0.3" x="13.6" y="10.6" />
      <rect width="2.2" height="8.4" rx="0.3" x="18.8" y="10.6" />
      <rect width="22" height="1.6" rx="0.3" x="1" y="19.4" />
      <rect width="24" height="1.8" rx="0.3" y="21.4" />
    </svg>
  );
}

function formatGrantAmount(amount: string): string {
  const normalizedAmount = amount.trim();

  if (normalizedAmount === 'Toàn phần') return '657.400.180 VND';

  const millionMatch = normalizedAmount.match(/^(\d+(?:[.,]\d+)?)\s*triệu$/i);
  if (millionMatch) {
    const amountValue = Number(millionMatch[1].replace(',', '.')) * 1000000;
    if (Number.isFinite(amountValue)) {
      return `${new Intl.NumberFormat('vi-VN').format(amountValue)} VND`;
    }
  }

  return normalizedAmount;
}

export default function HomeScholarshipCard({
  scholarship,
  onToggleFavorite,
  onViewDetails
}: HomeScholarshipCardProps) {
  const isFullScholarship = scholarship.amount === 'Toàn phần';
  const typeLabel = isFullScholarship ? 'Học bổng Toàn phần' : 'Bán phần/ Trợ cấp';
  const typeTagClass = isFullScholarship
    ? 'bg-[#F1FFFA] text-black border-[#D5EDE7]'
    : 'bg-[#FDFFF7] text-black border-[#F6DEAC]';
  const grantAmount = formatGrantAmount(scholarship.amount);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onViewDetails?.(scholarship);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)' }}
      transition={{ duration: 0.15 }}
      className="relative min-h-[210px] overflow-hidden rounded-[12px] border border-slate-200 bg-white p-5 pt-14 shadow-sm transition-all duration-150 outline-none focus-within:ring-2 focus-within:ring-[#2C6EAF]/40"
      id={`home-sch-card-${scholarship.id}`}
    >
      <div className={`absolute left-0 top-0 z-10 min-w-[170px] rounded-br-[30px] border-b border-r px-5 py-3 text-[12px] font-normal ${typeTagClass}`}>
        {typeLabel}
      </div>

      <button
        type="button"
        onClick={() => onViewDetails?.(scholarship)}
        className="absolute right-5 top-3.5 z-10 max-w-[calc(100%-220px)] truncate text-[12px] font-normal leading-none text-[#2C6EAF] transition-colors cursor-pointer hover:text-[#1E5084] focus:outline-none focus:text-[#1E5084]"
      >
        Đọc thêm về điều kiện →
      </button>

      <div className="grid h-full grid-cols-[116px_minmax(0,1fr)] gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col justify-between gap-4">
          <div className="flex aspect-[1.32] w-full items-center justify-center overflow-hidden rounded-[14px] border border-slate-100 bg-white">
            <img
              src={scholarship.sponsorLogo}
              alt={scholarship.sponsorName}
              className="h-full w-full object-contain p-2"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>

          <div className="font-card-bold flex items-baseline gap-2 whitespace-nowrap">
            <span className="text-[14px] font-normal leading-[18px] text-[#606061]">
              Khoản trợ cấp
            </span>
            <span className="text-[16px] font-semibold leading-[18px] text-black">
              {grantAmount}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          {/* Tiêu đề học bổng */}
          <h4
            onClick={() => onViewDetails?.(scholarship)}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            className="font-card-bold text-[16px] font-normal leading-[24px] tracking-normal text-[#05293C] line-clamp-2 transition-colors cursor-pointer outline-none hover:text-[#2C6EAF] focus:text-[#2C6EAF]"
          >
            {scholarship.title}
          </h4>

          {/* Tên nhà trường hoặc doanh nghiệp tài trợ */}
          <button
            type="button"
            onClick={() => onViewDetails?.(scholarship)}
            className="font-card-bold mt-3.5 flex items-start gap-2 text-left tracking-normal transition-colors cursor-pointer focus:outline-none"
          >
            <SponsorIcon className="mt-[1px] h-[18px] w-[18px] shrink-0 text-slate-300 opacity-80" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="line-clamp-1 text-[14px] font-normal leading-[18px] text-[#181818]">
                {scholarship.sponsorName}
              </span>
              <span className="line-clamp-1 text-[13px] font-normal leading-[18px] text-[#6F7882]">
                {scholarship.location}
              </span>
            </span>
          </button>

          <div className="mt-auto flex items-center justify-end gap-4 pt-5">
            <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-slate-600">
              <span className="text-[13px] font-normal text-slate-500">Thời hạn</span>
              <span className="whitespace-nowrap font-bold text-black">{formatDate(scholarship.deadline)}</span>
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(scholarship.id);
              }}
              aria-label={scholarship.isFavorite ? 'Bỏ yêu thích học bổng' : 'Yêu thích học bổng'}
              className="flex shrink-0 items-center justify-center border-0 bg-transparent p-0 text-slate-400 shadow-none transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
            >
              <Heart
                className={`h-5 w-5 ${
                  scholarship.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
