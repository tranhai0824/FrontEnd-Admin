import { ArrowRight, Send } from 'lucide-react';
import viettelConstructionLogo from '../assets/images/viettel-construction.png';

interface GreenBadgePromoProps {
  onExplore: () => void;
}

const highlights = [
  'Học bổng Viettel Future Talent 2026',
  'Học bổng Viettel Future Talent 2026',
  'Học bổng Viettel Future Talent 2026',
];

export default function GreenBadgePromo({ onExplore }: GreenBadgePromoProps) {
  return (
    <section className="relative overflow-hidden bg-[#4AAEF0]" aria-labelledby="green-badge-title">
      <div className="absolute -left-20 bottom-0 h-44 w-[54%] rounded-tr-[120px] bg-[#65BDF5]" />
      <div className="absolute right-10 top-8 h-36 w-72 rounded-full bg-[#7FC9F7]/65" />
      <div className="absolute -right-16 bottom-0 h-44 w-[44%] rounded-tl-[120px] bg-[#68BDF4]" />

      <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 py-10 sm:px-10 md:grid-cols-[1.08fr_0.92fr] md:py-12">
        <div className="max-w-[470px] text-white">
          <h2 id="green-badge-title" className="text-4xl font-bold tracking-tight sm:text-5xl">Huy hiệu Xanh</h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/95">
            Ghi nhận những chương trình học bổng có giá trị cao, tiêu chí minh bạch và được cộng đồng sinh viên đánh giá tích cực.
          </p>
          <p className="mt-3 text-lg font-semibold">
            1.520+ <span className="text-base font-normal">chương trình học bổng trên SKOLA.</span>
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#FFE56E] px-6 py-3 text-sm font-bold text-[#3F2A17] shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#FFDF4E]"
          >
            Xem ngay
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mx-auto w-full max-w-sm py-1">
          <Send className="absolute -left-12 bottom-6 h-16 w-16 -rotate-12 fill-white/90 text-white/90 md:-left-20" strokeWidth={1.4} />
          <div className="absolute -bottom-2 -left-12 h-24 w-44 rounded-full border border-dashed border-white/60" />
          <div className="relative z-10 flex flex-col gap-3">
            {highlights.map((title, index) => (
              <article key={`${title}-${index}`} className="flex min-h-[72px] items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-[0_5px_12px_rgba(19,88,146,0.18)]">
                <img
                  src={viettelConstructionLogo}
                  alt="Viettel Construction"
                  className="h-10 w-10 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-[#402310]">{title}</h3>
                  <p className="mt-1 truncate text-[11px] text-[#5A3B2A]">Tập đoàn Công nghiệp – Viễn thông Quân đội (Viettel)</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
