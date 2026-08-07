import { Building2, Trophy, UserRound } from 'lucide-react';

const stats = [
  {
    icon: Trophy,
    value: '1,000+',
    label: 'Scholarship Opportunities',
  },
  {
    icon: Building2,
    value: '300+',
    label: 'Companies & Universities',
  },
  {
    icon: UserRound,
    value: '2.1M+',
    label: 'Students',
  },
];

export default function StatsBar() {
  return (
    <section className="relative z-20 mx-auto -mt-8 w-full max-w-[812px] px-4 sm:-mt-10" aria-label="Thống kê nền tảng">
      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-100 bg-white py-2 shadow-[0_4px_12px_rgba(15,55,88,0.18)] sm:grid-cols-3 sm:py-0">
        {stats.map(({ icon: Icon, value, label }, index) => (
          <div
            key={label}
            className={`flex items-center justify-center gap-3 px-5 py-3.5 sm:py-4 ${
              index < stats.length - 1 ? 'sm:border-r sm:border-slate-100' : ''
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 text-[#1687DD]" strokeWidth={1.8} />
            <div className="text-left leading-tight">
              <p className="text-sm font-semibold text-[#1687DD]">{value}</p>
              <p className="mt-0.5 text-[11px] text-[#4288C3]">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
