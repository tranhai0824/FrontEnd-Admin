import React, { useState, useEffect, FormEvent } from 'react';
import { SCHOLARSHIPS_DATA } from './data/scholarships';
import { ApplicationForm } from './types';
import ScholarshipDetailModal from './components/ScholarshipDetailModal';
import ScholarshipList from './components/ScholarshipList';
import ScholarshipFilterPage, { type ScholarshipSearchRequest } from './components/ScholarshipFilterPage';
import AuthModal, { AuthenticatedUser } from './components/AuthModal';
import StatsBar from './components/StatsBar';
import ScholarshipPartnersCarousel from './components/ScholarshipPartnersCarousel';
import GreenBadgePromo from './components/GreenBadgePromo';
import ReasonsSection from './components/ReasonsSection';
import SuccessStories from './components/SuccessStories';
import PartnersSection from './components/PartnersSection';
import FooterBackground from './components/FooterBackground';
import storyMinhAnh from './assets/images/story-minh-anh.png';
import storyTuan from './assets/images/story-tuan.png';
import consultingExpert from './assets/images/consulting-expert.png';
import consultingReview from './assets/images/consulting-review.png';
import consultingInterview from './assets/images/consulting-interview.png';
import consultingCtaBackground from './assets/images/consulting-cta-background.png';
import { 
  GraduationCap, 
  Heart, 
  Layers, 
  MapPin, 
  Search, 
  Award, 
  FileText, 
  Sparkles, 
  Clock, 
  Globe, 
  ChevronRight, 
  Trash2,
  Calendar,
  AlertCircle,
  Inbox,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Compass,
  Laptop,
  Megaphone,
  Route,
  ArrowLeftRight,
  TriangleAlert,
  MapPinned,
  Mic,
  NotebookPen,
  ShoppingCart,
  Calculator,
  Landmark,
  Truck,
  BrainCircuit,
  Database,
  Code2,
  Zap,
  CarFront,
  Cog,
  Building2,
  Palette,
  MonitorPlay,
  MessagesSquare,
  Scale,
  Coins,
  ShieldCheck,
  Languages,
  Stethoscope,
  Briefcase,
  HelpCircle,
  Phone,
  Mail,
  Map,
  BookOpen,
  X,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Bell,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MAJOR_MENU_ITEMS = [
  ['Marketing', Megaphone],
  ['Thương mại điện tử', ShoppingCart],
  ['Kế toán và Kiểm toán', Calculator],
  ['Tài chính – Ngân hàng', Landmark],
  ['Quản trị kinh doanh', Briefcase],
  ['Kinh doanh quốc tế', Globe],
  ['Logistics và Quản lý chuỗi cung ứng', Truck],
  ['Trí tuệ nhân tạo', BrainCircuit],
  ['Khoa học dữ liệu', Database],
  ['An toàn thông tin', ShieldCheck],
  ['Kỹ thuật phần mềm', Code2],
  ['Điện – Điện tử', Zap],
  ['Công nghệ ô tô', CarFront],
  ['Tự động hóa', Cog],
  ['Kiến trúc', Building2],
  ['Thiết kế đồ họa', Palette],
  ['Truyền thông đa phương tiện', MonitorPlay],
  ['Quan hệ công chúng', MessagesSquare],
  ['Ngôn ngữ Anh', Languages],
  ['Luật kinh tế', Scale],
] as const;

export default function App() {
  // Trạng thái màn hình chính: 'home' | 'saved' | 'applications' | 'filter'
  const [activeTab, setActiveTab] = useState<'home' | 'saved' | 'applications' | 'filter'>(() => {
    return window.location.pathname === '/hoc-bong' || window.location.pathname === '/scholarships/search'
      ? 'filter'
      : 'home';
  });

  // Trạng thái ô tìm kiếm trong banner kiểu TopCV
  const [heroKeyword, setHeroKeyword] = useState('');
  const [heroRegion, setHeroRegion] = useState('');
  const [heroLevel, setHeroLevel] = useState('');
  const [heroMajor, setHeroMajor] = useState('');
  const [heroScholarshipType, setHeroScholarshipType] = useState('');
  const [filterSearchRequest, setFilterSearchRequest] = useState<ScholarshipSearchRequest | undefined>();

  // Trạng thái menu thả xuống chính
  const [activeMenuDropdown, setActiveMenuDropdown] = useState<'schools_majors' | 'abroad' | 'funding' | 'apply' | 'guide' | 'advising' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Trạng thái đã lưu / đã ứng tuyển
  const [savedScholarshipIds, setSavedScholarshipIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('scholarship_saved_ids');
    return stored ? JSON.parse(stored) : [];
  });

  const [appliedScholarships, setAppliedScholarships] = useState<Array<{
    scholarshipId: string;
    appliedAt: string;
    applicantName: string;
    email: string;
    gpa: string;
    status: 'pending' | 'reviewing' | 'accepted';
  }>>(() => {
    const stored = localStorage.getItem('scholarship_applied_records');
    return stored ? JSON.parse(stored) : [];
  });

  // Hộp thoại chi tiết
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string | null>(null);

  // Thông báo phản hồi thành công
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Trạng thái xem trước đăng nhập / đăng ký
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  // Header dùng panel trượt; CTA trong nội dung dùng hộp thoại ở giữa màn hình.
  const [authPresentation, setAuthPresentation] = useState<'modal' | 'panel'>('modal');

  // Trạng thái phiên người dùng
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; avatar: string } | null>(() => {
    return null;
  });
  const [showAccountDropdown, setShowAccountDropdown] = useState<boolean>(false);

  useEffect(() => {
    const openRegistrationForProtectedAction = (event: MouseEvent) => {
      if (currentUser || showAuthModal) return;
      const target = event.target as HTMLElement | null;
      const action = target?.closest<HTMLElement>('button, a');
      if (!action) return;

      // Giữ các thao tác điều hướng, tìm kiếm và lọc công khai hoạt động bình thường.
      if (
        action.closest('#site-header, #auth-modal-overlay, form, #integrated-scholarship-filter-page') ||
        action.dataset.allowAnonymous === 'true'
      ) return;

      const main = action.closest('main');
      if (!main) return;

      event.preventDefault();
      event.stopPropagation();
      setAuthPresentation('modal');
      setAuthMode('login');
      setShowAuthModal(true);
    };

    document.addEventListener('click', openRegistrationForProtectedAction, true);
    return () => document.removeEventListener('click', openRegistrationForProtectedAction, true);
  }, [currentUser, showAuthModal]);

  const openScholarshipFilterPage = () => {
    setActiveMenuDropdown(null);
    setActiveTab('filter');
    window.history.pushState({}, '', '/hoc-bong');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openScholarshipFilterWithRequest = (request: ScholarshipSearchRequest) => {
    setFilterSearchRequest(request);
    openScholarshipFilterPage();
  };

  const handleClearFilters = () => {
    setHeroKeyword('');
    setHeroRegion('');
    setHeroLevel('');
    setHeroMajor('');
    setHeroScholarshipType('');
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(
        window.location.pathname === '/hoc-bong' || window.location.pathname === '/scholarships/search'
          ? 'filter'
          : 'home'
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Đồng bộ trạng thái vào bộ nhớ cục bộ
  useEffect(() => {
    localStorage.setItem('scholarship_saved_ids', JSON.stringify(savedScholarshipIds));
  }, [savedScholarshipIds]);

  useEffect(() => {
    localStorage.setItem('scholarship_applied_records', JSON.stringify(appliedScholarships));
  }, [appliedScholarships]);

  // Học bổng nổi bật cho trang chủ
  const featuredScholarships = SCHOLARSHIPS_DATA.filter(s => s.isPopular || s.isNew).slice(0, 3);

  const triggerFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleToggleSave = (id: string) => {
    setSavedScholarshipIds(prev => {
      const isSaved = prev.includes(id);
      let next: string[];
      if (isSaved) {
        next = prev.filter(item => item !== id);
        triggerFeedback('Đã bỏ lưu học bổng khỏi danh sách quan tâm.');
      } else {
        next = [...prev, id];
        triggerFeedback('Đã lưu học bổng thành công! Bạn có thể xem lại tại mục Đã lưu.');
      }
      return next;
    });
  };

  const handleViewDetails = (id: string) => {
    setSelectedScholarshipId(id);
  };

  // Xử lý gửi hồ sơ ứng tuyển
  const handleApplySuccess = (scholarshipId: string, form: ApplicationForm) => {
    const newRecord = {
      scholarshipId,
      appliedAt: new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      applicantName: form.fullName,
      email: form.email,
      gpa: form.gpa,
      status: 'pending' as const
    };

    setAppliedScholarships(prev => {
      const cleanPrev = prev.filter(item => item.scholarshipId !== scholarshipId);
      return [newRecord, ...cleanPrev];
    });

    triggerFeedback('Hồ sơ ứng tuyển trực tuyến của bạn đã được chuyển đến đối tác tuyển sinh thành công!');
  };

  const handleCancelApplication = (scholarshipId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn rút hồ sơ ứng tuyển này không?')) {
      setAppliedScholarships(prev => prev.filter(item => item.scholarshipId !== scholarshipId));
      triggerFeedback('Đã rút hồ sơ ứng tuyển.');
    }
  };

  // Gửi tìm kiếm từ banner chính
  const handleHeroSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    openScholarshipFilterWithRequest({
      keyword: heroKeyword,
      region: heroRegion,
      level: heroLevel,
      major: heroMajor,
      scholarshipType: heroScholarshipType
    });
    
    const searchMsg = heroKeyword 
      ? `Đã tìm kiếm: "${heroKeyword}"` 
      : 'Đã tìm kiếm tất cả học bổng';
    const filters = [
      heroMajor && `ngành ${heroMajor}`,
      heroRegion && `khu vực ${heroRegion}`,
      heroScholarshipType && `loại ${heroScholarshipType}`,
    ].filter(Boolean);
    triggerFeedback(`${searchMsg}${filters.length ? ` – ${filters.join(', ')}` : ''}!`);
  };

  // Xử lý khi bấm thẻ khu vực
  const handleCountryCardClick = (countryName: string, regionValue: string) => {
    setHeroRegion(regionValue);
    setHeroKeyword('');
    openScholarshipFilterWithRequest({ region: regionValue });
    triggerFeedback(`Đang hiển thị các cơ hội học bổng khu vực ${regionValue} (${countryName})`);
  };

  // Xử lý khi bấm thẻ ngành học
  const handleMajorCardClick = (majorName: string) => {
    setHeroKeyword('');
    setHeroRegion('');
    openScholarshipFilterWithRequest({ major: majorName });
    triggerFeedback(`Đang hiển thị ngành học: ${majorName}`);
  };

  // Kích hoạt thông báo cho các mục chức năng mô phỏng
  const handlePlaceholderAlert = (featureName: string) => {
    triggerFeedback(`Tính năng "${featureName}" được tối ưu cho thông tin tuyển sinh 2026!`);
  };

  const handleAuthSuccess = (
    user: AuthenticatedUser,
    completedMode: 'login' | 'register',
  ) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    triggerFeedback(
      completedMode === 'login'
        ? 'Đăng nhập tài khoản thành công!'
        : 'Xác thực email và đăng ký tài khoản thành công!',
    );
  };

  const selectedScholarship = SCHOLARSHIPS_DATA.find(item => item.id === selectedScholarshipId) || null;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-[#EAF2F9] selection:text-[#12385D]" id="main-root-wrapper">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-2.5 max-w-md w-[90%]"
            id="feedback-toast"
          >
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-xs font-semibold leading-normal">{feedbackMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TopCV Style Header (White Background) */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs" id="site-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-100 md:hidden" aria-label="Mở menu điều hướng" aria-expanded={mobileMenuOpen}>
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Center Navigation Menus */}
          <nav className="hidden md:flex items-center gap-5 text-xs lg:text-sm font-normal text-[#181818] flex-1 justify-center relative">
            
            {/* 1. Chọn trường & Ngành học */}
            <div className="relative">
              <button 
                onClick={() => setActiveMenuDropdown(activeMenuDropdown === 'schools_majors' ? null : 'schools_majors')}
                className={`flex items-center gap-1 py-1 cursor-pointer transition-colors duration-200 ${activeMenuDropdown === 'schools_majors' ? 'text-[#2C6EAF]' : 'hover:text-[#2B6CB0]'}`}
                id="nav-tab-schools-majors"
              >
                <span>Chọn trường & Ngành học</span>
                <ChevronDown className="w-3.5 h-3.5 text-current opacity-70 transition-colors duration-200" />
              </button>
              <AnimatePresence>
                {activeMenuDropdown === 'schools_majors' && (
                  <>
                    <div className="fixed inset-x-0 bottom-0 top-16 z-40" onClick={() => setActiveMenuDropdown(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="fixed left-1/2 top-16 z-50 mt-0 w-[min(1060px,calc(100vw-32px))] -translate-x-1/2 rounded-b-xl border border-slate-200 bg-white p-6 shadow-xl"
                    >
                      <div className="grid grid-cols-[0.68fr_2fr] gap-6">
                        <section className="border-r-2 border-slate-300 pr-6">
                          <h3 className="text-base font-bold text-slate-900">Trường theo khu vực</h3>
                          <div className="mt-3 grid grid-cols-1 gap-y-1">
                            {['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Thái Nguyên', 'Hải Phòng', 'Huế', 'Cần Thơ', 'Miền Bắc', 'Miền Trung', 'Miền Nam', 'Du học quốc tế'].map((region) => (
                              <button key={region} type="button" onClick={openScholarshipFilterPage} className="rounded px-1 py-1.5 text-left text-sm text-slate-900 transition-colors hover:bg-[#F4F8FC] hover:text-[#2072E1] hover:underline">
                                {region}
                              </button>
                            ))}
                          </div>
                        </section>

                        <section>
                          <h3 className="text-base font-bold text-slate-900">Ngành học phổ biến</h3>
                          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1">
                            {MAJOR_MENU_ITEMS.map(([major, Icon]) => (
                              <button key={major} type="button" onClick={openScholarshipFilterPage} className="flex items-center gap-2 rounded px-1 py-1.5 text-left text-sm text-slate-900 transition-colors hover:bg-[#F4F8FC] hover:text-[#2072E1] hover:underline">
                                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                                <span>{major}</span>
                              </button>
                            ))}
                          </div>
                        </section>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button type="button" onClick={openScholarshipFilterPage} className="group flex items-center gap-1 text-sm font-semibold text-[#2072E1] transition-colors">
                          <ChevronRight aria-hidden="true" className="h-6 w-6 shrink-0" strokeWidth={1.5} />
                          <span className="group-hover:underline">Xem tất cả trường học và ngành học</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Học bổng */}
            <div className="relative">
              <button 
                onClick={() => setActiveMenuDropdown(activeMenuDropdown === 'abroad' ? null : 'abroad')}
                className={`flex items-center gap-1 py-1 cursor-pointer transition-colors duration-200 ${activeMenuDropdown === 'abroad' ? 'text-[#2C6EAF]' : 'hover:text-[#2B6CB0]'}`}
                id="nav-tab-abroad"
              >
                <span>Học bổng</span>
                <ChevronDown className="w-3.5 h-3.5 text-current opacity-70 transition-colors duration-200" />
              </button>
              <AnimatePresence>
                {activeMenuDropdown === 'abroad' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenuDropdown(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="fixed left-1/2 top-16 z-50 w-[min(1040px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-b-xl border border-slate-200 bg-white shadow-xl origin-top"
                    >
                      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_minmax(220px,0.9fr)]">
                        {[
                          { title: 'Theo giá trị', items: ['Học bổng toàn phần', 'Học bổng bán phần', 'Học bổng 100% học phí', 'Học bổng 50% học phí', 'Học bổng hỗ trợ sinh hoạt phí', 'Học bổng nghiên cứu'] },
                          { title: 'Theo nguồn cấp', items: ['Học bổng chính phủ', 'Học bổng doanh nghiệp', 'Học bổng từ trường', 'Học bổng tổ chức phi lợi nhuận', 'Học bổng cựu sinh viên', 'Học bổng quốc tế'] },
                          { title: 'Theo tiêu chí', items: ['Học bổng đầu vào', 'Học bổng theo điểm thi THPT', 'Học bổng học sinh giỏi', 'Học bổng tài năng thể thao – nghệ thuật', 'Học bổng hoàn cảnh khó khăn', 'Học bổng nữ sinh ngành STEM'] },
                        ].map((group, index) => (
                          <section key={group.title}>
                            <h3 className="px-4 py-3 text-sm font-semibold text-slate-900">{group.title}</h3>
                            <div className={`py-1.5 ${index > 0 ? 'border-l-2 border-slate-300' : ''}`}>
                              {group.items.map((item) => (
                                <button key={item} type="button" onClick={openScholarshipFilterPage} className="block w-full px-4 py-2 text-left text-sm text-slate-800 transition-colors hover:bg-[#F4F8FC] hover:text-[#2072E1] hover:underline">
                                  {item}
                                </button>
                              ))}
                            </div>
                          </section>
                        ))}
                        <aside className="flex items-center border-l-2 border-slate-300 p-4">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuDropdown(null);
                              setShowAuthModal(true);
                            }}
                            className="w-full rounded border-2 border-slate-900 bg-white px-5 py-5 text-left text-base font-semibold leading-relaxed text-slate-900 transition-colors hover:border-[#2072E1] hover:text-[#2072E1]"
                          >
                            <span className="block">Nắm bắt cơ hội để hiện thực hóa giấc mơ du học của bạn</span>
                            <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#2072E1]">
                              <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                              Đăng ký học bổng
                            </span>
                          </button>
                        </aside>
                      </div>
                      <div className="flex justify-end px-4 py-3">
                        <button type="button" onClick={openScholarshipFilterPage} className="group flex items-center gap-1 text-sm font-semibold text-[#2072E1]">
                          <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                          <span className="group-hover:underline">Xem tất cả học bổng</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Học bổng tài trợ */}
            <div className="relative hidden">
              <button 
                onClick={() => setActiveMenuDropdown(activeMenuDropdown === 'funding' ? null : 'funding')}
                className={`flex items-center gap-1 py-1 cursor-pointer transition-colors duration-200 ${activeMenuDropdown === 'funding' ? 'text-[#2C6EAF]' : 'hover:text-[#2B6CB0]'}`}
                id="nav-tab-funding"
              >
                <span>Học bổng tài trợ</span>
                <ChevronDown className="w-3.5 h-3.5 text-current opacity-70 transition-colors duration-200" />
              </button>
              <AnimatePresence>
                {activeMenuDropdown === 'funding' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenuDropdown(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2.5 w-56 bg-white rounded-xl border border-slate-100 shadow-xl py-1.5 z-50 origin-top-left"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          openScholarshipFilterPage();
                          triggerFeedback('Đang hiển thị học bổng toàn phần (100%)');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Học bổng Toàn phần (100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openScholarshipFilterPage();
                          triggerFeedback('Đang hiển thị học bổng bán phần (50% - 70%)');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Học bổng Bán phần (50% - 70%)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openScholarshipFilterPage();
                          triggerFeedback('Đang hiển thị các cơ hội học bổng được tài trợ từ doanh nghiệp');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Học bổng từ Doanh nghiệp
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Nộp hồ sơ */}
            <div className="relative hidden">
              <button 
                onClick={() => setActiveMenuDropdown(activeMenuDropdown === 'apply' ? null : 'apply')}
                className={`flex items-center gap-1 py-1 cursor-pointer transition-colors duration-200 ${activeMenuDropdown === 'apply' ? 'text-[#2C6EAF]' : 'hover:text-[#2B6CB0]'}`}
                id="nav-tab-apply"
              >
                <span>Nộp hồ sơ</span>
                <ChevronDown className="w-3.5 h-3.5 text-current opacity-70 transition-colors duration-200" />
              </button>
              <AnimatePresence>
                {activeMenuDropdown === 'apply' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenuDropdown(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2.5 w-56 bg-white rounded-xl border border-slate-100 shadow-xl py-1.5 z-50 origin-top-right md:origin-top-left"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuDropdown(null);
                          setActiveTab('applications');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Trạng thái Đơn ứng tuyển
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuDropdown(null);
                          triggerFeedback('Tài liệu hướng dẫn viết bài luận cá nhân đã gửi về email đăng ký của bạn!');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Hướng dẫn viết bài luận cá nhân mẫu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuDropdown(null);
                          triggerFeedback('Mẫu thư giới thiệu chuẩn học thuật (Academic LOR) đã được tải xuống!');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Tải mẫu thư giới thiệu LOR
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button type="button" className="flex items-center gap-1 py-1 text-slate-800 transition-colors duration-200 hover:text-[#2072E1]">
              <span>Đánh giá hồ sơ</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveMenuDropdown(activeMenuDropdown === 'guide' ? null : 'guide')}
                className={`flex items-center gap-1 py-1 transition-colors duration-200 ${activeMenuDropdown === 'guide' ? 'text-[#2072E1]' : 'text-slate-800 hover:text-[#2072E1]'}`}
              >
                <span>Cẩm nang</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
              <AnimatePresence>
                {activeMenuDropdown === 'guide' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenuDropdown(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="fixed left-1/2 top-16 z-50 w-[min(1120px,calc(100vw-32px))] -translate-x-1/2 rounded-b-xl border border-slate-200 bg-white p-6 shadow-xl"
                    >
                      <div className="grid grid-cols-[0.9fr_1fr_1.35fr] gap-6">
                        <section>
                          <h3 className="mb-3 text-base font-bold text-slate-900">Cẩm nang học bổng</h3>
                          <div className="border-r-2 border-slate-300 pr-6">
                            {([
                              ['Lộ trình săn học bổng', Route], ['Thuật ngữ học bổng cần biết', BookOpen], ['So sánh các loại học bổng', ArrowLeftRight], ['Điều kiện tiếng Anh phổ biến', Languages], ['Học bổng cho từng bậc học', GraduationCap], ['Chi phí & tài chính du học', Coins], ['Lịch deadline theo tháng', Calendar],
                            ] as [string, typeof Route][]).map(([item, Icon]) => (
                              <button key={item} type="button" onClick={() => { setActiveMenuDropdown(null); triggerFeedback(`Đang mở: ${item}`); }} className="flex w-full items-center gap-3 rounded px-1 py-2 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-[#F4F8FC] hover:text-[#2072E1] hover:underline">
                                <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-900" strokeWidth={1.8} />
                                {item}
                              </button>
                            ))}
                          </div>
                        </section>
                        <section>
                          <h3 className="mb-3 text-base font-bold text-slate-900">Chuẩn bị hồ sơ</h3>
                          <div className="border-r-2 border-slate-300 pr-6">
                            {([
                              ['Hướng dẫn viết bài luận / SOP', FileText], ['Mẫu CV xin học bổng', FileText], ['Thư giới thiệu: cách xin và mẫu', Mail], ['Chuẩn bị phỏng vấn học bổng', Mic], ['Checklist giấy tờ cần có', CheckCircle2], ['Lỗi thường gặp khi nộp hồ sơ', TriangleAlert], ['Bảng chứng chỉ ngoại ngữ quy đổi', Languages],
                            ] as [string, typeof Route][]).map(([item, Icon]) => (
                              <button key={item} type="button" onClick={() => { setActiveMenuDropdown(null); triggerFeedback(`Đang mở: ${item}`); }} className="flex w-full items-center gap-3 rounded px-1 py-2 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-[#F4F8FC] hover:text-[#2072E1] hover:underline">
                                <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-900" strokeWidth={1.8} />
                                {item}
                              </button>
                            ))}
                          </div>
                        </section>
                        <section>
                          <h3 className="mb-3 text-base font-bold text-slate-900">Bài viết nổi bật</h3>
                          <div className="space-y-4">
                            {[
                              [storyMinhAnh, 'CÂU CHUYỆN', 'Hành trình giành học bổng toàn phần ngành Khoa học dữ liệu tại Hàn Quốc', '5 phút đọc · 12/07/2026'],
                              [storyTuan, 'KINH NGHIỆM', '7 lỗi khiến hồ sơ học bổng bị loại ngay vòng đầu', '4 phút đọc · 03/07/2026'],
                            ].map(([image, _category, title, meta]) => (
                              <button key={title} type="button" onClick={() => { setActiveMenuDropdown(null); triggerFeedback(`Đang mở bài viết: ${title}`); }} className="group flex w-full items-center gap-3 text-left">
                                <img src={image} alt="" className="h-[76px] w-[116px] shrink-0 rounded-md object-cover" />
                                <div className="min-w-0">
                                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-[#2072E1] group-hover:underline">{title}</p>
                                  <p className="mt-1 text-xs text-slate-500">{meta}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                          <button type="button" onClick={() => { setActiveMenuDropdown(null); triggerFeedback('Đang mở tất cả bài viết nổi bật'); }} className="group mt-4 flex items-center gap-1 text-sm font-semibold text-[#2072E1]">
                            <span className="group-hover:underline">Xem thêm bài viết nổi bật</span>
                            <ChevronRight aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                          </button>
                        </section>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Tư vấn */}
            <div className="relative">
              <button 
                onClick={() => setActiveMenuDropdown(activeMenuDropdown === 'advising' ? null : 'advising')}
                className={`flex items-center gap-1 py-1 cursor-pointer transition-colors duration-200 ${activeMenuDropdown === 'advising' ? 'text-[#2C6EAF]' : 'hover:text-[#2B6CB0]'}`}
                id="nav-tab-advising-root"
              >
                <span>Tư vấn</span>
                <ChevronDown className="w-3.5 h-3.5 text-current opacity-70 transition-colors duration-200" />
              </button>
              <AnimatePresence>
                {activeMenuDropdown === 'advising' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenuDropdown(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="fixed left-1/2 top-16 z-50 w-[min(1080px,calc(100vw-32px))] -translate-x-1/2 rounded-b-2xl border border-slate-200 bg-white p-6 shadow-xl"
                    >
                      <div className="grid grid-cols-[1.18fr_0.92fr_0.9fr] gap-8">
                        <section>
                          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-900">Dịch vụ tư vấn</h3>
                          <div className="space-y-3">
                            {[
                              ['Tư vấn 1-1 với chuyên gia', 'Chọn khung giờ phù hợp, trao đổi trực tiếp về định hướng của bạn.', consultingExpert],
                              ['Review hồ sơ & bài luận', 'Nhận nhận xét chi tiết từng phần, kèm gợi ý chỉnh sửa cụ thể.', consultingReview],
                              ['Luyện phỏng vấn học bổng', 'Phỏng vấn thử với cựu du học sinh, nhận xét ngay sau buổi.', consultingInterview],
                            ].map(([title, description, image]) => (
                              <button key={title} type="button" onClick={() => { setActiveMenuDropdown(null); setShowAuthModal(true); }} className="flex w-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-900">
                                <img src={image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                                <span className="min-w-0">
                                  <span className="block text-base font-semibold text-slate-900">{title}</span>
                                  <span className="mt-1 block text-sm leading-5 text-slate-700">{description}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </section>

                        <section>
                          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Hỗ trợ & giải đáp</h3>
                          <div className="space-y-1">
                            {([
                              ['Câu hỏi thường gặp', HelpCircle], ['Hỏi đáp cộng đồng', MessagesSquare], ['Hướng dẫn sử dụng', FileText], ['Tra cứu trạng thái hồ sơ', BookOpen], ['Báo lỗi & góp ý', TriangleAlert], ['Chính sách hoàn phí', HelpCircle],
                            ] as [string, typeof Route][]).map(([item, Icon]) => (
                              <button key={item} type="button" onClick={() => { setActiveMenuDropdown(null); triggerFeedback(`Đang mở: ${item}`); }} className="flex w-full items-center gap-3 rounded px-1 py-2.5 text-left text-sm text-slate-700 transition-colors hover:text-[#2072E1] hover:underline">
                                <Icon className="h-5 w-5 shrink-0 text-slate-900" strokeWidth={1.7} />
                                {item}
                              </button>
                            ))}
                          </div>
                          <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
                            <p className="mb-3 font-semibold text-slate-900">Liên hệ</p>
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-900" /> <strong className="text-slate-900">1900 6868</strong> · 8:00–21:00</p>
                            <p className="mt-3 flex items-center gap-2"><Mail className="h-4 w-4 text-slate-900" /> tuvan@topscholar.vn</p>
                          </div>
                        </section>

                        <aside className="rounded-2xl bg-cover bg-center p-7" style={{ backgroundImage: `url(${consultingCtaBackground})` }}>
                          <h3 className="text-2xl font-bold leading-tight text-[#4A2B15]">Nói chuyện với người đi trước</h3>
                          <p className="mt-4 text-sm leading-6 text-[#925A26]">Đặt lịch 30 phút với chuyên gia để gỡ đúng vướng mắc của bạn.</p>
                          <button type="button" onClick={() => { setActiveMenuDropdown(null); setShowAuthModal(true); }} className="mt-20 inline-flex items-center gap-2 rounded border-2 border-slate-900 bg-[#E8F6FF] px-6 py-3 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5">
                            Đặt lịch ngay <ArrowRight className="h-4 w-4" />
                          </button>
                        </aside>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </nav>

          {/* Right Header Controls (Right-aligned personal items group) */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Account dropdown */}
            <div className="relative z-50 flex items-center" id="account-dropdown-container">
              <button
                onClick={() => {
                  if (currentUser) {
                    setShowAccountDropdown(!showAccountDropdown);
                  } else {
                    setShowAccountDropdown(false);
                    setAuthPresentation('panel');
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-all cursor-pointer focus:outline-none ${
                  currentUser
                    ? 'rounded-full border border-slate-200/80 hover:bg-slate-50'
                    : 'rounded-md text-[#0B63CE] hover:bg-blue-50'
                }`}
                id="btn-account-toggle"
              >
                {currentUser ? (
                  <>
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-5.5 h-5.5 rounded-full object-cover border border-slate-100"
                    />
                    <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium">Đăng nhập</span>
                    <User className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
                  </>
                )}
              </button>

              <AnimatePresence>
                {showAccountDropdown && (
                  <>
                    {/* Click outside backdrop for easy closure */}
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setShowAccountDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-100 bg-white py-2 shadow-[0_10px_24px_rgba(15,23,42,0.14)] z-50 origin-top-right"
                      id="account-dropdown-menu"
                    >
                      {currentUser ? (
                        <>
                          {/* User quick info header */}
                          <div className="px-4 py-2 border-b border-slate-100 mb-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                          </div>

                          {/* Menu Options */}
                          <button
                            onClick={() => {
                              setShowAccountDropdown(false);
                              handlePlaceholderAlert('Hồ sơ của tôi');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors flex items-center gap-2.5 cursor-pointer"
                            id="dropdown-item-profile"
                          >
                            <User className="w-4 h-4 shrink-0" />
                            Hồ sơ của tôi
                          </button>

                          <button
                            onClick={() => {
                              setShowAccountDropdown(false);
                              setActiveTab('saved');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors flex items-center gap-2.5 cursor-pointer"
                            id="dropdown-item-saved"
                          >
                            <Heart className="w-4 h-4 shrink-0" />
                            Học bổng đã lưu
                          </button>

                          <button
                            onClick={() => {
                              setShowAccountDropdown(false);
                              setActiveTab('applications');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors flex items-center gap-2.5 cursor-pointer"
                            id="dropdown-item-apps"
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            Đơn ứng tuyển
                          </button>

                          <button
                            onClick={() => {
                              setShowAccountDropdown(false);
                              handlePlaceholderAlert('Cài đặt tài khoản');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors flex items-center gap-2.5 cursor-pointer"
                            id="dropdown-item-settings"
                          >
                            <Settings className="w-4 h-4 shrink-0" />
                            Cài đặt
                          </button>

                          <div className="border-t border-slate-100 my-1" />

                          <button
                            onClick={() => {
                              setShowAccountDropdown(false);
                              setCurrentUser(null);
                              triggerFeedback('Đã đăng xuất tài khoản thành công!');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5 cursor-pointer"
                            id="dropdown-item-logout"
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            Đăng xuất
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setShowAccountDropdown(false);
                              setAuthMode('login');
                              setShowAuthModal(true);
                            }}
                            className="w-full text-left px-5 py-3 text-[15px] font-semibold text-[#334155] transition-colors hover:bg-[#F4F8FC] hover:text-[#2C6EAF] cursor-pointer"
                            id="dropdown-item-login"
                          >
                            Đăng nhập
                          </button>
                          <button
                            onClick={() => {
                              setShowAccountDropdown(false);
                              setAuthMode('register');
                              setShowAuthModal(true);
                            }}
                            className="w-full text-left px-5 py-3 text-[15px] font-semibold text-[#334155] transition-colors hover:bg-[#F4F8FC] hover:text-[#2C6EAF] cursor-pointer"
                            id="dropdown-item-register"
                          >
                            Đăng ký
                          </button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-slate-100 bg-white px-4 py-3 shadow-lg md:hidden" aria-label="Điều hướng trên thiết bị nhỏ">
            {[
              ['Chọn trường & Ngành học', 'schools_majors'],
              ['Học bổng', 'funding'],
              ['Đánh giá hồ sơ', 'apply'],
              ['Cẩm nang', 'guide'],
              ['Tư vấn', 'advising']
            ].map(([label, menu]) => (
              <button key={menu} type="button" onClick={() => { setMobileMenuOpen(false); setActiveMenuDropdown(menu as typeof activeMenuDropdown); }} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50">
                {label}<ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Hero Search Section - Rendered on Home & Search for consistency */}
      <section 
        className={
          activeTab === 'filter'
            ? 'border-b border-[#DCEAF6] bg-[#2C6EAF] py-2 md:py-2 relative overflow-hidden'
            : 'min-h-[300px] pt-16 pb-20 md:min-h-[340px] md:pt-[96px] md:pb-24 text-white relative overflow-hidden bg-gradient-to-r from-[#48B6F8] via-[#43AFF5] to-[#38A5EF]'
        }
        id="hero-search-area"
      >
        {activeTab !== 'filter' && (
          <>
            <div className="absolute -top-28 left-[34%] h-[520px] w-64 -rotate-12 bg-white/10"></div>
            <div className="absolute -right-28 top-12 h-72 w-72 rounded-full border-[58px] border-white/90"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(255,255,255,0.16),transparent_30%)]"></div>
          </>
        )}
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex justify-center ${activeTab === 'filter' ? '' : 'md:justify-end'}`}>
          <div className={`w-full text-center ${activeTab === 'filter' ? 'max-w-[1000px]' : 'max-w-[620px] md:mr-32'}`}>
          
          {activeTab !== 'filter' && (
            <h2 className="text-center font-sans text-[28px] font-light leading-[32px] tracking-normal text-[#1E1E1E]">
              Tìm học bổng phù hợp với bạn
            </h2>
          )}
          {/* Large Consolidated Search Bar */}
          <form 
            onSubmit={handleHeroSearchSubmit}
            className={`${activeTab === 'filter' ? 'mt-0 border border-white/70 shadow-xl shadow-[#12385D]/20' : 'mt-4 shadow-lg'} w-full bg-white p-0 rounded-[9px] flex flex-col md:h-10 md:flex-row items-center gap-0`}
            id="hero-search-form"
          >
            {/* Input Keyword */}
            <div className="flex-1 relative flex min-h-[40px] w-full items-center border-b border-slate-100 md:min-h-full md:border-b-0 md:border-r">
              <Search className="absolute left-3 w-4 h-4 text-[#181818]" />
              <input
                type="text"
                value={heroKeyword}
                onChange={(e) => setHeroKeyword(e.target.value)}
                placeholder="Tên học bổng, trường học, ngành học..."
                className="h-10 md:h-full w-full bg-white text-[#181818] placeholder:text-[#181818] text-[14px] leading-5 pl-9 pr-3 py-1 rounded-[8px] focus:outline-none"
                id="hero-search-keyword"
              />
            </div>

            {/* Select Academic Program */}
            <div className="w-full md:w-48 relative flex min-h-[40px] items-center md:min-h-full">
              <GraduationCap className="absolute left-3 w-4 h-4 text-[#181818]" />
              <select
                value={heroLevel}
                onChange={(e) => setHeroLevel(e.target.value)}
                className="h-10 md:h-full w-full bg-white text-[#181818] text-[14px] leading-5 pl-9 pr-7 py-1 rounded-[8px] focus:outline-none appearance-none cursor-pointer font-normal"
                id="hero-search-level"
              >
                <option value="">Chương trình học</option>
                <option value="Đại học">Đại học</option>
                <option value="Thạc sĩ">Thạc sĩ</option>
                <option value="Tiến sĩ">Tiến sĩ</option>
                <option value="Cao đẳng">Cao đẳng</option>
                <option value="Trao đổi ngắn hạn">Trao đổi ngắn hạn</option>
              </select>
              <div className="absolute right-3.5 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-500"></div>
            </div>

          </form>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1.5fr_1fr_1fr] sm:gap-3" id="hero-search-filters">
            <label className="relative block">
              <span className="sr-only">Ngành học</span>
              <select
                value={heroMajor}
                onChange={(e) => setHeroMajor(e.target.value)}
                className="h-8 w-full appearance-none rounded-[9px] bg-white px-3 pr-9 text-[12px] text-slate-700 shadow-md shadow-[#12385D]/20 outline-none"
                id="hero-search-major"
              >
                <option value="">Ngành học</option>
                <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                <option value="Kinh tế">Kinh tế</option>
                <option value="Y dược">Y dược</option>
                <option value="Ngôn ngữ">Ngôn ngữ</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            </label>
            <label className="relative block">
              <span className="sr-only">Khu vực</span>
              <select
                value={heroRegion}
                onChange={(e) => setHeroRegion(e.target.value)}
                className="h-8 w-full appearance-none rounded-[9px] bg-white px-3 pr-9 text-[12px] text-slate-700 shadow-md shadow-[#12385D]/20 outline-none"
                id="hero-search-region"
              >
                <option value="">Khu vực</option>
                <option value="Miền Bắc">Miền Bắc</option>
                <option value="Miền Trung">Miền Trung</option>
                <option value="Miền Nam">Miền Nam</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            </label>
            <label className="relative block">
              <span className="sr-only">Loại học bổng</span>
              <select
                value={heroScholarshipType}
                onChange={(e) => setHeroScholarshipType(e.target.value)}
                className="h-8 w-full appearance-none rounded-[9px] bg-white px-3 pr-9 text-[12px] text-slate-700 shadow-md shadow-[#12385D]/20 outline-none"
                id="hero-search-scholarship-type"
              >
                <option value="">Loại học bổng</option>
                <option value="Toàn phần">Toàn phần</option>
                <option value="Bán phần">Bán phần</option>
                <option value="Tài trợ doanh nghiệp">Tài trợ doanh nghiệp</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            </label>
          </div>
          </div>

        </div>
      </section>

      {activeTab === 'home' && <StatsBar />}

      {/* MAIN LAYOUT CONDITIONAL RENDERING */}
      <main className="flex-1" id="main-content-layout">
        
        {activeTab === 'home' && (
          <div className="flex flex-col gap-14 py-10" id="view-home">

            <ScholarshipPartnersCarousel />

            {/* Custom Filter Bar + Scholarship List Grid */}
            <section className="w-full bg-[#F8FAFC] border-y border-slate-200/60 py-12" id="home-scholarships-full-section">
              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <ScholarshipList
                  savedIds={savedScholarshipIds}
                  onToggleSave={handleToggleSave}
                />
              </div>
            </section>

            <GreenBadgePromo onExplore={openScholarshipFilterPage} />

            {/* Informational Link Section */}
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-6" id="section-by-major">
              <div className="grid grid-cols-1 gap-x-16 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: 'Về chúng tôi',
                    description: 'Chúng tôi là một tổ chức phi lợi nhuận hoạt động dựa trên sứ mệnh kết nối sinh viên với thành công trong học đại học.'
                  },
                  {
                    title: 'Thành viên',
                    description: 'Hơn 6.000 tổ chức và cơ quan thành viên đang thúc đẩy sứ mệnh của College Board.'
                  },
                  {
                    title: 'Phòng tin tức',
                    description: 'Hãy đọc các thông cáo báo chí và thông báo để xem có gì mới tại College Board.'
                  },
                  {
                    title: 'Nghiên cứu',
                    description: 'Nghiên cứu đẳng cấp thế giới của chúng tôi là nền tảng cho sự đổi mới liên tục trong các chương trình của chúng tôi.'
                  },
                  {
                    title: 'Sự kiện',
                    description: 'Các sự kiện của chúng tôi cung cấp cơ hội học tập chuyên nghiệp và kết nối mạng lưới cho các nhà giáo dục.'
                  },
                  {
                    title: 'Nghề nghiệp',
                    description: 'Khám phá các cơ hội nghề nghiệp tại College Board và gia nhập đội ngũ của chúng tôi.'
                  }
                ].map((item) => (
                  <article key={item.title} className="border-t-2 border-[#1A1A1A] pt-4">
                    <h3 className="font-sans text-[28px] font-normal leading-[34px] text-black">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-[480px] text-[17px] font-normal leading-[29px] text-black">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <ReasonsSection
              onCreateProfile={() => {
                setAuthMode('register');
                setShowAuthModal(true);
              }}
            />

            <SuccessStories
              onExplore={() => {
                setAuthMode('register');
                setShowAuthModal(true);
              }}
            />

            <PartnersSection />

          </div>
        )}

        {activeTab === 'filter' && (
          <ScholarshipFilterPage searchRequest={filterSearchRequest} onFeedback={triggerFeedback} />
        )}

        {activeTab === 'saved' && (
          <section className="bg-slate-50 py-10 min-h-[600px]" id="view-saved">
            <div className="max-w-4xl mx-auto px-4">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div>
                  <h2 className="font-sans font-extrabold text-xl text-slate-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                    Học bổng đã lưu của bạn
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Nơi lưu giữ các cơ hội học thuật bạn đang quan tâm.</p>
                </div>
                <button
                  onClick={openScholarshipFilterPage}
                  className="text-xs font-bold text-[#2C6EAF] hover:underline"
                >
                  Khám phá thêm học bổng &rarr;
                </button>
              </div>

              {/* Saved list */}
              <div className="flex flex-col gap-4">
                {savedScholarshipIds.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl text-center border border-slate-100 shadow-xs max-w-md mx-auto w-full">
                    <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-sans font-bold text-base text-slate-800">Chưa lưu học bổng nào</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Hãy duyệt qua danh sách học bổng và bấm vào biểu tượng trái tim để lưu lại các tin tuyển sinh hấp dẫn nhất.
                    </p>
                    <button
                      onClick={openScholarshipFilterPage}
                      className="mt-5 bg-[#2C6EAF] hover:bg-[#1E5084] text-white text-xs font-bold py-2.5 px-5 rounded-lg cursor-pointer"
                    >
                      Duyệt học bổng ngay
                    </button>
                  </div>
                ) : (
                  SCHOLARSHIPS_DATA.filter(s => savedScholarshipIds.includes(s.id)).map(scholarship => (
                    <article
                      key={scholarship.id}
                      className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#2C6EAF]">
                            {scholarship.valueType === 'Full' ? 'Học bổng Toàn phần' : 'Học bổng Bán phần'}
                          </p>
                          <h3 className="mt-2 text-base font-bold leading-snug text-slate-900">
                            {scholarship.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">{scholarship.partnerName}</p>
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                            {scholarship.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSave(scholarship.id)}
                          className="rounded-full bg-rose-50 p-2 text-rose-500"
                          aria-label="Bỏ lưu học bổng"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <span className="text-xs font-semibold text-slate-600">Hạn nộp: {scholarship.deadline}</span>
                        <button
                          type="button"
                          onClick={() => handleViewDetails(scholarship.id)}
                          className="rounded-lg bg-[#2C6EAF] px-4 py-2 text-xs font-bold text-white hover:bg-[#1E5084]"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>

            </div>
          </section>
        )}

        {activeTab === 'applications' && (
          <section className="bg-slate-50 py-10 min-h-[600px]" id="view-applications">
            <div className="max-w-4xl mx-auto px-4">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div>
                  <h2 className="font-sans font-extrabold text-xl text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#2C6EAF]" />
                    Hồ sơ ứng tuyển trực tuyến
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Theo dõi thời gian thực tiến độ xét tuyển của các đối tác.</p>
                </div>
                <button
                  onClick={openScholarshipFilterPage}
                  className="text-xs font-bold text-[#2C6EAF] hover:underline"
                >
                  Khám phá thêm cơ hội &rarr;
                </button>
              </div>

              {appliedScholarships.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center border border-slate-100 shadow-xs max-w-md mx-auto w-full">
                  <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-sans font-bold text-base text-slate-800">Chưa nộp đơn ứng tuyển nào</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Bạn có thể nộp đơn trực tiếp và đính kèm CV, bảng điểm tại trang xem chi tiết học bổng chỉ trong 2 phút!
                  </p>
                  <button
                    onClick={openScholarshipFilterPage}
                    className="mt-5 bg-[#2C6EAF] hover:bg-[#1E5084] text-white text-xs font-bold py-2.5 px-5 rounded-lg cursor-pointer"
                  >
                    Xem danh sách học bổng
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appliedScholarships.map(record => {
                    const scholarshipInfo = SCHOLARSHIPS_DATA.find(s => s.id === record.scholarshipId);
                    if (!scholarshipInfo) return null;

                    return (
                      <div key={record.scholarshipId} className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between" id={`app-record-${record.scholarshipId}`}>
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-[#F4F8FC] border border-[#DCEAF6] rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                {scholarshipInfo.partnerLogo && (
                                  scholarshipInfo.partnerLogo.startsWith('http') || 
                                  scholarshipInfo.partnerLogo.startsWith('/') || 
                                  scholarshipInfo.partnerLogo.includes('.')
                                ) ? (
                                  <img 
                                    src={scholarshipInfo.partnerLogo} 
                                    alt={scholarshipInfo.partnerName} 
                                    className="w-full h-full object-contain p-0.5 rounded"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <span className="text-xs font-extrabold text-[#2C6EAF]">
                                    {scholarshipInfo.partnerName
                                      .replace(/Trường|Đại học|Học viện|Phân hiệu|University/g, '')
                                      .trim()
                                      .split(' ')
                                      .map(w => w[0])
                                      .filter(Boolean)
                                      .join('')
                                      .toUpperCase()
                                      .substring(0, 3)}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h4 className="font-sans font-bold text-sm text-slate-900 line-clamp-1">{scholarshipInfo.title}</h4>
                                <p className="text-[10px] text-slate-400 font-medium">{scholarshipInfo.partnerName}</p>
                              </div>
                            </div>
                            <span className="bg-[#EAF2F9] text-[#12385D] text-[9px] font-bold px-2 py-0.5 rounded shrink-0 border border-[#2C6EAF]/20">
                              ĐANG THẨM ĐỊNH
                            </span>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600 mb-4">
                            <div className="flex justify-between">
                              <span>Sĩ tử ứng tuyển:</span>
                              <span className="font-bold text-slate-800">{record.applicantName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Ngày nộp:</span>
                              <span className="font-semibold text-slate-800">{record.appliedAt}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Điểm số GPA:</span>
                              <span className="font-semibold text-slate-800">GPA {record.gpa}/10</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-slate-50 pt-3 mt-auto">
                          <button
                            onClick={() => handleViewDetails(record.scholarshipId)}
                            className="flex-1 bg-[#F4F8FC] text-[#2C6EAF] hover:bg-[#EAF2F9] text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer text-center"
                          >
                            Chi tiết học bổng
                          </button>
                          <button
                            onClick={() => handleCancelApplication(record.scholarshipId)}
                            className="p-2 text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-rose-100"
                            title="Rút hồ sơ ứng tuyển"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </section>
        )}

      </main>

      <FooterBackground />

      {/* Detailed Info Modal & Online Application Portal overlay */}
      <AnimatePresence>
        {selectedScholarshipId && selectedScholarship && (
          <ScholarshipDetailModal
            scholarship={selectedScholarship}
            onClose={() => setSelectedScholarshipId(null)}
            onApplySuccess={handleApplySuccess}
            hasApplied={appliedScholarships.some(item => item.scholarshipId === selectedScholarshipId)}
          />
        )}
      </AnimatePresence>

      {/* Registration, OTP verification and sign-in modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            initialMode={authMode}
            presentation={authPresentation}
            onClose={() => {
              setShowAuthModal(false);
              setAuthPresentation('modal');
            }}
            onAuthenticated={handleAuthSuccess}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
