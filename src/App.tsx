import React, { useState, useEffect, FormEvent } from 'react';
import { SCHOLARSHIPS_DATA } from './data/scholarships';
import { ApplicationForm } from './types';
import ScholarshipDetailModal from './components/ScholarshipDetailModal';
import ScholarshipList from './components/ScholarshipList';
import ScholarshipFilterPage from './components/ScholarshipFilterPage';
import AuthModal, { AuthenticatedUser } from './components/AuthModal';
import heroBackground from './assets/images/bgr.png';
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
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Compass,
  Laptop,
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
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  // Trạng thái menu thả xuống chính
  const [activeMenuDropdown, setActiveMenuDropdown] = useState<'schools_majors' | 'abroad' | 'funding' | 'apply' | 'advising' | null>(null);

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

  // Trạng thái phiên người dùng
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; avatar: string } | null>(() => {
    return null;
  });
  const [showAccountDropdown, setShowAccountDropdown] = useState<boolean>(false);

  const openScholarshipFilterPage = () => {
    setActiveMenuDropdown(null);
    setActiveTab('filter');
    window.history.pushState({}, '', '/hoc-bong');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setHeroKeyword('');
    setHeroRegion('');
    setHeroLevel('');
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
    openScholarshipFilterPage();
    
    const searchMsg = heroKeyword 
      ? `Đã tìm kiếm: "${heroKeyword}"` 
      : 'Đã tìm kiếm tất cả học bổng';
    const levelMsg = heroLevel ? ` chương trình ${heroLevel}` : '';
    triggerFeedback(`${searchMsg}${levelMsg}!`);
  };

  // Xử lý khi bấm thẻ khu vực
  const handleCountryCardClick = (countryName: string, regionValue: string) => {
    setHeroRegion(regionValue);
    setHeroKeyword('');
    openScholarshipFilterPage();
    triggerFeedback(`Đang hiển thị các cơ hội học bổng khu vực ${regionValue} (${countryName})`);
  };

  // Xử lý khi bấm thẻ ngành học
  const handleMajorCardClick = (majorName: string) => {
    setHeroKeyword('');
    setHeroRegion('');
    openScholarshipFilterPage();
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
                          setActiveMenuDropdown(null);
                          setActiveTab('home');
                          setTimeout(() => {
                            const el = document.getElementById('partnerships-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Trường Đại Học liên kết
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuDropdown(null);
                          setActiveTab('home');
                          setTimeout(() => {
                            const el = document.getElementById('section-by-major');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Ngành học được quan tâm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openScholarshipFilterPage();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Tất cả trường & ngành
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Học bổng theo miền */}
            <div className="relative">
              <button 
                onClick={() => setActiveMenuDropdown(activeMenuDropdown === 'abroad' ? null : 'abroad')}
                className={`flex items-center gap-1 py-1 cursor-pointer transition-colors duration-200 ${activeMenuDropdown === 'abroad' ? 'text-[#2C6EAF]' : 'hover:text-[#2B6CB0]'}`}
                id="nav-tab-abroad"
              >
                <span>Học bổng theo miền</span>
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
                      className="absolute left-0 mt-2.5 w-52 bg-white rounded-xl border border-slate-100 shadow-xl py-1.5 z-50 origin-top-left"
                    >
                      {[
                        { label: 'Miền Bắc', value: 'Miền Bắc' },
                        { label: 'Miền Nam', value: 'Miền Nam' },
                        { label: 'Toàn bộ khu vực', value: '' }
                      ].map((reg) => (
                        <button
                          key={reg.label}
                          type="button"
                          onClick={() => {
                            setHeroRegion('');
                            openScholarshipFilterPage();
                            triggerFeedback(reg.value ? `Đang hiển thị học bổng khu vực: ${reg.label}` : 'Đang hiển thị toàn bộ học bổng');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                        >
                          {reg.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Học bổng tài trợ */}
            <div className="relative">
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
            <div className="relative">
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
                      className="absolute right-0 md:left-0 mt-2.5 w-56 bg-white rounded-xl border border-slate-100 shadow-xl py-1.5 z-50 origin-top-right md:origin-top-left"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuDropdown(null);
                          triggerFeedback('Yêu cầu đặt lịch Tư vấn 1-1 thành công! Tư vấn viên của TopScholar sẽ liên hệ bạn.');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Đăng ký Tư vấn 1-1 chuyên sâu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuDropdown(null);
                          triggerFeedback('Bắt đầu đánh giá hồ sơ trực tuyến. Vui lòng nhập đầy đủ thông tin GPA & Chứng chỉ ngoại ngữ!');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-normal text-slate-700 hover:bg-[#F4F8FC] hover:text-[#2C6EAF] transition-colors cursor-pointer"
                      >
                        Đánh giá năng lực hồ sơ (AI)
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </nav>

          {/* Right Header Controls (Right-aligned personal items group) */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Yêu thích (icon trái tim ❤️) */}
            <button 
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`p-2 rounded-full border transition-all cursor-pointer relative ${
                activeTab === 'saved'
                  ? 'bg-[#F4F8FC] border-[#DCEAF6] text-[#2C6EAF]'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-[#2C6EAF] hover:bg-slate-50'
              }`}
              title="Học bổng yêu thích"
              id="nav-tab-saved"
            >
              <Heart className={`w-5 h-5 ${savedScholarshipIds.length > 0 ? 'fill-[#2C6EAF] text-[#2C6EAF]' : ''}`} />
              {savedScholarshipIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#2C6EAF] text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold leading-none">
                  {savedScholarshipIds.length}
                </span>
              )}
            </button>

            {/* Hồ sơ (icon file) */}
            <button 
              type="button"
              onClick={() => setActiveTab('applications')}
              className={`p-2 rounded-full border transition-all cursor-pointer relative ${
                activeTab === 'applications'
                  ? 'bg-[#F4F8FC] border-[#DCEAF6] text-[#2C6EAF]'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-[#2C6EAF] hover:bg-slate-50'
              }`}
              title="Hồ sơ ứng tuyển"
              id="nav-tab-applications"
            >
              <FileText className="w-5 h-5" />
              {appliedScholarships.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#2C6EAF] text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold leading-none">
                  {appliedScholarships.length}
                </span>
              )}
            </button>
            
            {/* Account dropdown */}
            <div className="relative z-50 flex items-center" id="account-dropdown-container">
              <button
                onClick={() => {
                  if (currentUser) {
                    setShowAccountDropdown(!showAccountDropdown);
                  } else {
                    setShowAccountDropdown(false);
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-50 border border-slate-200/80 transition-all cursor-pointer focus:outline-none"
                id="btn-account-toggle"
              >
                {currentUser ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-5.5 h-5.5 rounded-full object-cover border border-slate-100"
                  />
                ) : (
                  <User className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className="text-xs font-bold text-slate-800">
                  {currentUser ? currentUser.name : 'Tài khoản'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
      </header>

      {/* Hero Search Section - Rendered on Home & Search for consistency */}
      <section 
        className={
          activeTab === 'filter'
            ? 'border-b border-[#DCEAF6] bg-[#2C6EAF] py-2 md:py-2 relative overflow-hidden'
            : 'min-h-[300px] pt-16 pb-20 md:min-h-[340px] md:pt-[96px] md:pb-24 text-white relative overflow-hidden bg-cover bg-center'
        }
        style={activeTab === 'filter' ? undefined : { backgroundImage: `url(${heroBackground})` }}
        id="hero-search-area"
      >
        {activeTab !== 'filter' && (
          <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
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
          </div>

        </div>
      </section>

      {/* MAIN LAYOUT CONDITIONAL RENDERING */}
      <main className="flex-1" id="main-content-layout">
        
        {activeTab === 'home' && (
          <div className="flex flex-col gap-14 py-10" id="view-home">

            {/* Custom Filter Bar + Scholarship List Grid */}
            <section className="w-full bg-[#F8FAFC] border-y border-slate-200/60 py-12" id="home-scholarships-full-section">
              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <ScholarshipList
                  savedIds={savedScholarshipIds}
                  onToggleSave={handleToggleSave}
                />
              </div>
            </section>

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

          </div>
        )}

        {activeTab === 'filter' && (
          <ScholarshipFilterPage />
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

      {/* Trust Partnership Section */}
      <section className="bg-[#F4F8FC] border-t border-slate-100 py-10" id="partnerships-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] text-[#12385D] font-bold uppercase tracking-widest mb-4">Các Tổ Chức & Đại Học Đồng Hành Cung Cấp Học Bổng</p>
          <div className="flex flex-wrap items-center justify-center gap-y-4 gap-x-8 md:gap-x-12 opacity-80 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">🇺🇸 Fulbright Commission</span>
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">🇯🇵 MEXT Japan</span>
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">🇬🇧 British Council</span>
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">🇮🇪 Irish Aid</span>
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">🇪🇺 Erasmus+ EU</span>
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">🇻🇳 VinUniversity</span>
          </div>
        </div>
      </section>

      {/* Modern Detailed Footer */}
      <footer className="bg-[#00446B] text-slate-200 border-t border-[#2C6EAF]/20 py-12" id="site-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
            
            {/* Column 1 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#2C6EAF] flex items-center justify-center text-white shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-sans font-bold text-white text-base">TopScholar</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                Hệ thống tìm kiếm, kết nối và nộp hồ sơ xét tuyển học bổng trực tuyến chính quy, bảo vệ quyền lợi của sĩ tử Việt Nam.
              </p>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Chương trình hot</h4>
              <ul className="flex flex-col gap-2 text-xs">
                <li className="hover:text-white cursor-pointer" onClick={() => handleCountryCardClick('Đại học Kinh tế TP.HCM', 'Miền Nam')}>Học bổng UEH Excellence</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleCountryCardClick('Đại học Bách khoa Hà Nội', 'Miền Bắc')}>Học bổng Tài năng HUST</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleCountryCardClick('Đại học Ngoại thương', 'Miền Bắc')}>Học bổng Ngoại thương FTU</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleCountryCardClick('VinUniversity', 'Miền Bắc')}>Học bổng Tài năng VinUni</li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Tài liệu tham khảo</h4>
              <ul className="flex flex-col gap-2 text-xs">
                <li className="hover:text-white cursor-pointer" onClick={() => handlePlaceholderAlert('Cẩm nang viết bài luận cá nhân')}>Cách viết bài luận cá nhân hiệu quả</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handlePlaceholderAlert('Bí quyết phỏng vấn Đại sứ quán')}>Bí quyết phỏng vấn Đại sứ quán</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handlePlaceholderAlert('Quy đổi điểm hệ GPA')}>Bảng quy đổi điểm GPA chuẩn</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handlePlaceholderAlert('Tìm kiếm thư giới thiệu')}>Xin thư giới thiệu tinh tế</li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="flex flex-col gap-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Kết nối với chúng tôi</h4>
              <p className="text-xs text-slate-500">Hỗ trợ khẩn cấp sĩ tử 24/7 từ ban cố vấn học thuật.</p>
              <div className="flex flex-col gap-2 text-xs">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#2C6EAF]" /> Đường dây nóng: 1900 6725</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#2C6EAF]" /> Hỗ trợ: scholarship@topcv-style.vn</span>
                <span className="flex items-center gap-1.5"><Map className="w-3.5 h-3.5 text-[#2C6EAF]" /> Tòa nhà TopCV, Cầu Giấy, Hà Nội</span>
              </div>
            </div>

          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Nền tảng TopScholar. Hệ thống đồng hành học bổng uy tín phong cách TopCV. Phát triển bằng công cụ dựng giao diện.</p>
            <div className="flex gap-4">
              <span className="hover:text-white cursor-pointer">Chính sách bảo mật</span>
              <span className="hover:text-white cursor-pointer">Điều khoản sử dụng</span>
            </div>
          </div>
        </div>
      </footer>

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
            onClose={() => setShowAuthModal(false)}
            onAuthenticated={handleAuthSuccess}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
