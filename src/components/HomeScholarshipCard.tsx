import React from 'react';
import { ScholarshipItem } from '../data/mockScholarships';
import { Bookmark, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import scholarshipCover from '../assets/images/ptit-campus.png';
import ptitLogo from '../assets/images/ptit-logo.png';

interface HomeScholarshipCardProps {
  key?: React.Key;
  scholarship: ScholarshipItem;
  onToggleFavorite: (id: string) => void;
  onViewDetails?: (scholarship: ScholarshipItem) => void;
}

export default function HomeScholarshipCard({ scholarship, onToggleFavorite, onViewDetails }: HomeScholarshipCardProps) {
  const isFullScholarship = scholarship.amount === 'Toàn phần';
  const matchLabel = 'Độ phù hợp';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onViewDetails?.(scholarship);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, boxShadow: '0 14px 28px rgba(15, 23, 42, 0.12)' }}
      transition={{ duration: 0.18 }}
      className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_3px_12px_rgba(15,23,42,0.08)] outline-none focus-within:ring-2 focus-within:ring-[#2C6EAF]/40"
      id={`home-sch-card-${scholarship.id}`}
    >
      <button
        type="button"
        onClick={() => onViewDetails?.(scholarship)}
        className="block h-44 w-full overflow-hidden bg-slate-100 text-left"
        aria-label={`Xem ${scholarship.title}`}
      >
        <img
          src={scholarshipCover}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          style={{ objectPosition: 'center center' }}
        />
      </button>

      <div className="flex flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF9FF] px-3 py-1 text-xs font-medium text-[#3AABEC]">
            {matchLabel} <Percent className="h-4 w-4 rounded-full border border-[#3AABEC] p-[1px]" />
          </span>
          <button
            type="button"
            onClick={() => onToggleFavorite(scholarship.id)}
            aria-label={scholarship.isFavorite ? 'Bỏ lưu học bổng' : 'Lưu học bổng'}
            className="text-slate-400 transition-colors hover:text-[#D6A400] focus:outline-none"
          >
            <Bookmark className={`h-6 w-6 stroke-[1.8] ${scholarship.isFavorite ? 'fill-[#FFD84D] text-[#D6A400]' : ''}`} />
          </button>
        </div>

        <h4
          onClick={() => onViewDetails?.(scholarship)}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          className="mt-3 truncate whitespace-nowrap cursor-pointer text-lg font-bold leading-6 text-[#05293C] outline-none"
        >
          {scholarship.title}
        </h4>

        <button
          type="button"
          onClick={() => onViewDetails?.(scholarship)}
          className="mt-5 flex items-center gap-3 text-left focus:outline-none"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white">
            <img src={ptitLogo} alt="Logo PTIT" className="h-full w-full object-contain p-1" />
          </span>
          <span className="min-w-0">
            <span className="block line-clamp-1 text-sm font-medium text-[#17496E]">{scholarship.sponsorName}</span>
            <span className="mt-0.5 block text-sm text-slate-500">{scholarship.location}</span>
          </span>
        </button>
      </div>
    </motion.article>
  );
}
