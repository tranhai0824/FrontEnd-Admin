import { Atom, GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';
import skolaMentor from '../assets/images/skola-mentor.png';
import wavePattern from '../assets/images/reasons-wave-pattern.png';
import cloudShape from '../assets/images/reasons-cloud-shape.png';

interface ReasonsSectionProps {
  onCreateProfile: () => void;
}

const benefits = [
  {
    icon: Atom,
    title: 'AI Match thông minh',
    description: 'Tự động phân tích hồ sơ và gợi ý những học bổng phù hợp với năng lực.',
  },
  {
    icon: ShieldCheck,
    title: 'Thông tin minh bạch, cập nhật liên tục',
    description: 'Mọi thông tin học bổng được kiểm duyệt và cập nhật thường xuyên.',
  },
  {
    icon: GraduationCap,
    title: 'Kết nối mentor giàu kinh nghiệm',
    description: 'Nhận lời khuyên và định hướng từ mentor giàu kinh nghiệm để nâng cao hồ sơ.',
  },
];

export default function ReasonsSection({ onCreateProfile }: ReasonsSectionProps) {
  return (
    <section className="relative px-4 py-10 md:px-8 md:py-14" aria-labelledby="reasons-title">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-2xl border-[3px] border-[#1598F2] bg-gradient-to-r from-[#50AEEF] via-[#54B2F2] to-[#77C7F8] shadow-sm">
      <img
        src={wavePattern}
        alt=""
        className="pointer-events-none absolute inset-x-0 top-0 w-full max-w-none opacity-50"
      />
      <img
        src={cloudShape}
        alt=""
        className="pointer-events-none absolute -left-16 -top-8 w-[330px] opacity-50"
      />
      <img
        src={cloudShape}
        alt=""
        className="pointer-events-none absolute -right-16 top-2 w-[320px] rotate-12 opacity-50"
      />

      <div className="relative grid min-h-[390px] grid-cols-1 gap-4 px-6 py-5 sm:px-10 lg:grid-cols-[0.78fr_1.55fr] lg:items-end lg:px-12">
        <div className="relative hidden min-h-[350px] lg:block" aria-hidden="true">
          <img
            src={skolaMentor}
            alt=""
            className="absolute bottom-[-4px] left-[-36px] h-[370px] w-auto max-w-none object-contain"
          />
        </div>

        <div>
          <h2 id="reasons-title" className="text-3xl font-extrabold tracking-tight text-[#3F260F] sm:text-4xl">
            Lí do nên chọn <span className="text-white">Skola</span>
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#3F260F] sm:text-base">
            SKOLAR nền tảng giúp sinh viên tìm kiếm học bổng từ các nhà tài trợ, kết nối với mentor, tiếp cận những cơ hội học tập phù hợp.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
            <article key={title} className="min-h-[142px] rounded-xl bg-white p-4 shadow-[0_6px_18px_rgba(29,96,151,0.15)]">
                <Icon className="h-7 w-7 text-[#4A2B15]" strokeWidth={1.8} />
                <h3 className="mt-3 text-base font-bold leading-5 text-[#4A2B15]">{title}</h3>
                <p className="mt-3 text-xs leading-5 text-[#3B2E25]">{description}</p>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={onCreateProfile}
            className="mt-6 inline-flex min-w-64 items-center justify-center gap-3 rounded-xl bg-[#FFE971] px-6 py-3 text-sm font-bold text-[#4A2B15] shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#FFDD58]"
          >
            Tạo hồ sơ ngay
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      </div>
    </section>
  );
}
