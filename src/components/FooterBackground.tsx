import footerBackground from '../assets/images/footer-background.png';
import footerBottomBackground from '../assets/images/footer-bottom-background.png';
import googlePlayLogo from '../assets/images/google-play-logo.png';
import appStoreLogo from '../assets/images/app-store-logo.png';

const footerGroups = [
  {
    title: 'KHÁM PHÁ',
    links: ['Tìm học bổng', 'Trường đại học', 'Chương trình đào tạo', 'Học bổng theo quốc gia', 'Học bổng theo ngành', 'Học bổng toàn phần', 'Lịch hạn nộp 2026–2027']
  },
  {
    title: 'CÔNG CỤ',
    links: ['Đánh giá hồ sơ', 'Đo độ phù hợp học bổng', 'Lộ trình cải thiện hồ sơ', 'So sánh chương trình', 'Ước tính chi phí du học', 'Quy đổi điểm GPA', 'Checklist giấy tờ']
  },
  {
    title: 'HỖ TRỢ',
    links: ['Câu hỏi thường gặp', 'Hướng dẫn sử dụng', 'Hỏi đáp cộng đồng', 'Đặt lịch tư vấn 1-1', 'Review hồ sơ & bài luận', 'Báo lỗi & góp ý', 'Chính sách hoàn phí']
  },
  {
    title: 'VỀ SKOLA',
    links: ['Giới thiệu', 'Cách kiểm chứng học bổng', 'Cách chấm điểm hồ sơ', 'Hợp tác với trường học', 'Dành cho nhà tài trợ', 'Tuyển dụng', 'Liên hệ']
  }
];

export default function FooterBackground() {
  return (
    <footer
      className="relative overflow-hidden bg-cover bg-center bg-no-repeat text-white"
      style={{ backgroundImage: `url(${footerBackground})` }}
      id="site-footer"
      aria-label="Footer"
    >
      <div className="absolute inset-0 bg-[#004b7d]/25" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 sm:px-8 lg:grid-cols-[1.35fr_3fr] lg:px-10 lg:py-16">
        <section className="max-w-sm">
          <p className="text-3xl font-bold tracking-tight">SKOLA</p>
          <p className="mt-4 text-sm leading-6 text-white/90">
            Cổng học bổng giúp sinh viên Việt Nam tìm đúng suất học bổng và chuẩn bị hồ sơ tự tin hơn.
          </p>
          <dl className="mt-7 space-y-3 border-l border-white/35 pl-4 text-sm">
            <div><dt className="sr-only">Học bổng đã được kiểm chứng</dt><dd><strong className="text-base">4.128</strong> học bổng đã được kiểm chứng</dd></div>
            <div><dt className="sr-only">Hồ sơ đã được đánh giá</dt><dd><strong className="text-base">62.000+</strong> hồ sơ đã được đánh giá</dd></div>
            <div><dt className="sr-only">Tần suất cập nhật dữ liệu</dt><dd>Cập nhật dữ liệu <strong>hàng tuần</strong></dd></div>
          </dl>
        </section>

        <nav className="grid grid-cols-2 gap-x-7 gap-y-10 sm:grid-cols-4" aria-label="Liên kết cuối trang">
          {footerGroups.map((group) => (
            <section key={group.title}>
              <h2 className="text-xs font-bold tracking-[0.12em] text-white">{group.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#main-content-layout" className="text-xs leading-5 text-white/80 transition-colors hover:text-white hover:underline">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
      <section
        className="relative bg-cover bg-top bg-no-repeat pt-16 text-white"
        style={{ backgroundImage: `url(${footerBottomBackground})` }}
        aria-label="Thiết lập quốc gia và kênh theo dõi"
      >
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 pb-9 sm:grid-cols-2 sm:px-8 lg:px-10">
          <section>
            <h2 className="text-xs font-bold tracking-[0.08em]">TẢI ỨNG DỤNG</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="#site-footer" className="flex min-w-40 items-center gap-3 rounded-xl border border-white/30 bg-[#123f6b]/80 px-4 py-2.5 transition-colors hover:bg-white/10">
                <span className="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-[#2388ef]">
                  <img src={appStoreLogo} alt="App Store" className="h-full w-full scale-[1.14] object-cover" />
                </span>
                <span className="text-left text-[10px] leading-3 text-white/75">Tải trên<strong className="block text-sm text-white">App Store</strong></span>
              </a>
              <a href="#site-footer" className="flex min-w-40 items-center gap-3 rounded-xl border border-white/30 bg-[#123f6b]/80 px-4 py-2.5 transition-colors hover:bg-white/10">
                <img src={googlePlayLogo} alt="Google Play" className="h-7 w-7 object-contain" />
                <span className="text-left text-[10px] leading-3 text-white/75">Tải trên<strong className="block text-sm text-white">Google Play</strong></span>
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold tracking-[0.08em]">THEO DÕI CHÚNG TÔI</h2>
            <div className="mt-4 flex gap-2">
              {['f', 'in', '▶', '♪', '◎'].map((social) => <a key={social} href="#site-footer" aria-label={`Theo dõi SKOLA trên ${social}`} className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-white transition-colors hover:bg-white/20">{social}</a>)}
            </div>
          </section>
        </div>
        <div className="border-t border-white/10 bg-[#09365f]/85">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-5 text-xs text-white/75 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div className="flex flex-wrap gap-x-6 gap-y-2"><span>© 2026 SKOLA</span><a href="#site-footer" className="hover:text-white">Điều khoản sử dụng</a><a href="#site-footer" className="hover:text-white">Chính sách bảo mật</a><a href="#site-footer" className="hover:text-white">Cài đặt cookie</a><a href="#site-footer" className="hover:text-white">Miễn trừ trách nhiệm</a><a href="#site-footer" className="hover:text-white">Sơ đồ trang</a></div>
            <span>Xây dựng tại Việt Nam với <span className="text-rose-300">♥</span> cho sinh viên Việt</span>
          </div>
        </div>
      </section>
    </footer>
  );
}
