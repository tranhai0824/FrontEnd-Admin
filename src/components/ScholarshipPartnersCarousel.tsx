import { ChevronLeft, ChevronRight, CircleArrowRight } from 'lucide-react';
import { useRef } from 'react';

const partners = [
  { name: 'Tập đoàn Samsung', scholarships: '120 học bổng', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=640&q=80' },
  { name: 'Tập đoàn Viettel', scholarships: '120 học bổng', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=640&q=80' },
  { name: 'Tập đoàn Harim', scholarships: '120 học bổng', image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=640&q=80' },
  { name: 'Tập đoàn Bangkok', scholarships: '120 học bổng', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=640&q=80' },
  { name: 'Museum of Future', scholarships: '120 học bổng', image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=640&q=80' },
  { name: 'British Council', scholarships: '80 học bổng', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=640&q=80' },
];

export default function ScholarshipPartnersCarousel() {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    railRef.current?.scrollBy({ left: direction === 'left' ? -280 : 280, behavior: 'smooth' });
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-4" aria-label="Tổ chức cấp học bổng">
      <div className="relative rounded-2xl border border-[#E5EDF7] bg-white px-7 py-7 sm:px-14">
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Xem tổ chức trước"
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-[#249CF0] transition-colors hover:bg-sky-50 sm:left-4"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.6} />
        </button>

        <div ref={railRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {partners.map((partner) => (
            <article key={partner.name} className="group relative h-52 w-36 shrink-0 snap-start overflow-hidden rounded-xl bg-slate-200 sm:h-56 sm:w-40">
              <img src={partner.image} alt={partner.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#12385D]/90 via-[#12385D]/40 to-transparent px-3 pb-3 pt-12 text-white">
                <h3 className="text-xs font-semibold leading-tight">{partner.name}</h3>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-medium">{partner.scholarships}</span>
                  <CircleArrowRight className="h-4 w-4 shrink-0 fill-white text-[#357DB5]" />
                </div>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Xem tổ chức tiếp theo"
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-[#249CF0] transition-colors hover:bg-sky-50 sm:right-4"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={1.6} />
        </button>
      </div>
    </section>
  );
}
