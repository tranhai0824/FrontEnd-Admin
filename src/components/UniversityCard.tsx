import React from 'react';
import { BookOpen, Calendar, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export interface UniversityCardProps {
  universityName: string;
  location: string;
  attendance: string;
  masterCount: number | string;
  intake: string;
  scholarshipCount: number | string;
  rating: number;
  reviewCount: number;
  globalRanking: number | string;
  logoUrl?: string;
  websiteUrl: string;
}

const PodiumIcon = () => (
  <svg className="h-6 w-6 shrink-0 stroke-[1.5] text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21h18M5 21v-4h4v4M9 21V9h6v12M15 21v-8h4v8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MastersPortalRibbonLogo = () => (
  <svg className="h-10 w-8 shrink-0" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 1C2 1 12 1 12 1V23L7 19L2 23V1Z" fill="#3ba1e0" />
    <path d="M12 3C12 3 22 3 22 3V25L17 21L12 25V3Z" fill="#3c1053" />
  </svg>
);

export default function UniversityCard({
  universityName,
  location,
  attendance,
  masterCount,
  intake,
  scholarshipCount,
  rating,
  reviewCount,
  globalRanking,
  logoUrl,
  websiteUrl
}: UniversityCardProps) {
  return (
    <motion.div
      id={`university-card-${universityName.toLowerCase().replace(/\s+/g, '-')}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full rounded-xl border border-gray-200 bg-white p-6 transition-shadow duration-300 hover:shadow-md"
    >
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 lg:pr-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${universityName} logo`}
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 object-contain"
                  onError={(event) => {
                    (event.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <MastersPortalRibbonLogo />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="font-sans text-[24px] font-bold leading-[32px] tracking-normal text-[#181818]">
                  {universityName}
                </h3>
                <div className="flex shrink-0 items-center gap-0.5 text-sm font-normal md:text-base">
                  <span className="font-semibold text-[#eab308]">{rating}</span>
                  <span className="text-[#eab308]">★</span>
                  <span className="font-normal text-gray-400">({reviewCount})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4 pl-12">
            <div className="flex flex-col">
              <span className="text-[13px] font-normal leading-normal text-gray-500">Vị trí</span>
              <span className="mt-0.5 text-[15px] font-normal text-slate-800">{location}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[13px] font-normal leading-normal text-gray-500">Sự tham dự</span>
              <span className="mt-0.5 text-[15px] font-normal text-slate-800">{attendance}</span>
            </div>

            <div className="pt-2">
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[15px] font-medium text-[#0066cc] transition-colors hover:text-[#0052a3] hover:underline"
              >
                Truy cập trang web của trường đại học
              </a>
            </div>
          </div>
        </div>

        <div className="hidden w-px self-stretch bg-gray-200 lg:my-2 lg:block" />

        <div className="flex w-full items-center lg:w-[42%]">
          <div className="grid w-full grid-cols-1 gap-x-6 gap-y-6 py-2 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0">
                <PodiumIcon />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-normal leading-tight text-gray-500">Xếp hạng toàn cầu</span>
                <span className="mt-1 text-base font-normal text-slate-800">{globalRanking}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0 text-slate-700">
                <Calendar className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-normal leading-tight text-gray-500">Kỳ nhập học</span>
                <span className="mt-1 text-base font-normal text-slate-800">{intake}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0 text-slate-700">
                <BookOpen className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-normal leading-tight text-gray-500">Thạc sĩ</span>
                <span className="mt-1 text-base font-normal text-slate-800">{masterCount}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0 text-slate-700">
                <GraduationCap className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-normal leading-tight text-gray-500">Học bổng</span>
                <span className="mt-1 text-base font-normal text-slate-800">{scholarshipCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
