import partnerLogos from '../assets/images/partner-logos.png';

export default function PartnersSection() {
  return (
    <section className="border-y border-slate-100 bg-white py-8 sm:py-10" aria-labelledby="partners-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="partners-title" className="text-center text-2xl font-extrabold text-[#43220F] sm:text-3xl">
          Các Tổ Chức & Đại Học đồng hành cùng cung cấp học bổng
        </h2>
        <div className="mt-7 flex min-h-20 items-center justify-center">
          <img
            src={partnerLogos}
            alt="Meta, Thăng Long University, CMC Corp, Vingroup, RMIT University, FTU, British University Vietnam và University of Oxford"
            className="h-auto w-full max-w-[1280px] object-contain"
          />
        </div>
      </div>
    </section>
  );
}
