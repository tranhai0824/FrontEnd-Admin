import React, { useState, useEffect, useRef } from 'react';
import { MOCK_SCHOLARSHIPS, ScholarshipItem, formatDate, isExpiringSoon } from '../data/mockScholarships';
import FilterBar from './FilterBar';
import HomeScholarshipCard from './HomeScholarshipCard';
import Pagination from './Pagination';
import {
  Inbox,
  X,
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  CheckCircle,
  FileText,
  Upload,
  Loader2
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const STORAGE_KEY = 'home_mock_scholarships_vnua_24_cards_v4';
const APPLIED_STORAGE_KEY = 'local_applied_scholarship_ids_v2';
const PAGE_SIZE = 6;

interface ScholarshipListProps {
  onViewDetails?: (scholarship: ScholarshipItem) => void;
  savedIds?: string[];
  onToggleSave?: (id: string) => void;
}

export default function ScholarshipList({
  onViewDetails,
  savedIds = [],
  onToggleSave
}: ScholarshipListProps) {
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return MOCK_SCHOLARSHIPS;
      }
    }
    return MOCK_SCHOLARSHIPS;
  });

  const [selectedCategory, setSelectedCategory] = useState('Toàn phần');
  const [selectedChip, setSelectedChip] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeModalScholarship, setActiveModalScholarship] = useState<ScholarshipItem | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'apply'>('details');
  const [appliedList, setAppliedList] = useState<string[]>(() => {
    const stored = localStorage.getItem(APPLIED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gpa, setGpa] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scholarships));
  }, [scholarships]);

  useEffect(() => {
    localStorage.setItem(APPLIED_STORAGE_KEY, JSON.stringify(appliedList));
  }, [appliedList]);

  useEffect(() => {
    if (savedIds.length === 0) return;
    setScholarships((prev) =>
      prev.map((item) => ({ ...item, isFavorite: item.isFavorite || savedIds.includes(item.id) }))
    );
  }, [savedIds]);

  const handleToggleFavorite = (id: string) => {
    setScholarships((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
    onToggleSave?.(id);
  };

  const filteredScholarships = scholarships.filter((sch) => {
    if (selectedChip === 'Tất cả') return true;

    switch (selectedCategory) {
      case 'Toàn phần':
        if (selectedChip === 'Toàn phần') return sch.amount === 'Toàn phần';
        if (selectedChip === 'Bán phần') return sch.amount !== 'Toàn phần';
        return true;
      case 'Lĩnh vực':
        return sch.field.toLowerCase() === selectedChip.toLowerCase();
      case 'Địa điểm':
        return sch.location.toLowerCase() === selectedChip.toLowerCase();
      case 'Cấp học':
        return sch.level.toLowerCase() === selectedChip.toLowerCase();
      case 'Du học':
        return sch.isDuHoc.toLowerCase() === selectedChip.toLowerCase();
      default:
        return true;
    }
  });

  const totalPages = Math.ceil(filteredScholarships.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedScholarships = filteredScholarships.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedChip]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    setCurrentPage(page);
    window.requestAnimationFrame(() => {
      listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const resetFilters = () => {
    setSelectedCategory('Toàn phần');
    setSelectedChip('Tất cả');
    setCurrentPage(1);
  };

  const openDetailsModal = (scholarship: ScholarshipItem) => {
    onViewDetails?.(scholarship);
    setActiveModalScholarship(scholarship);
    setModalTab('details');
    setShowSuccessPage(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setGpa('');
    setCvFile(null);
    setFormErrors({});
  };

  const closeDetailsModal = () => {
    setActiveModalScholarship(null);
  };

  const simulateFileUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setCvFile(file);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 20;
      });
    }, 100);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) simulateFileUpload(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) simulateFileUpload(files[0]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên của bạn';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Vui lòng nhập email hợp lệ';
    if (!phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';

    const gpaVal = parseFloat(gpa);
    if (!gpa.trim() || isNaN(gpaVal) || gpaVal < 0 || gpaVal > 4.0) {
      errors.gpa = 'GPA không hợp lệ (hệ 4.0, ví dụ: 3.6)';
    }

    if (!cvFile) errors.cvFile = 'Vui lòng tải lên hồ sơ CV ứng tuyển';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessPage(true);
      if (activeModalScholarship) {
        setAppliedList((prev) =>
          prev.includes(activeModalScholarship.id) ? prev : [...prev, activeModalScholarship.id]
        );
      }
    }, 900);
  };

  return (
    <div className="w-full" id="section-home-scholarship-list">
      <FilterBar
        selectedCategory={selectedCategory}
        setSelectedCategory={(category) => {
          setSelectedCategory(category);
          setCurrentPage(1);
        }}
        selectedChip={selectedChip}
        setSelectedChip={(chip) => {
          setSelectedChip(chip);
          setCurrentPage(1);
        }}
        visibleCount={filteredScholarships.length}
        totalCount={scholarships.length}
      />

      <div ref={listTopRef} className="min-h-[300px] scroll-mt-24">
        <AnimatePresence mode="popLayout">
          {filteredScholarships.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5"
              id="home-scholarships-grid-view"
            >
              {paginatedScholarships.map((scholarship) => (
                <HomeScholarshipCard
                  key={scholarship.id}
                  scholarship={scholarship}
                  onToggleFavorite={handleToggleFavorite}
                  onViewDetails={openDetailsModal}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80"
              id="empty-scholarships-state"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200/50">
                <Inbox className="w-8 h-8" />
              </div>
              <h4 className="font-sans font-extrabold text-slate-800 text-base mb-1.5">
                Không tìm thấy học bổng phù hợp
              </h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-5">
                Hãy thử thay đổi danh mục lọc hoặc xoá bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#2C6EAF] hover:bg-[#1E5084] active:scale-95 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2C6EAF]/40"
              >
                Xóa tất cả bộ lọc
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {filteredScholarships.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <AnimatePresence>
        {activeModalScholarship && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden my-8 flex flex-col focus:outline-none max-h-[90vh]"
              id="scholarship-detail-modal-root"
              tabIndex={-1}
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-start justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={activeModalScholarship.sponsorLogo}
                      alt={activeModalScholarship.sponsorName}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-extrabold text-[#2C6EAF] uppercase tracking-wider mb-1">
                      {activeModalScholarship.sponsorName}
                    </span>
                    <h3 className="font-sans font-extrabold text-slate-900 text-base md:text-lg leading-snug">
                      {activeModalScholarship.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDetailsModal}
                  className="w-11 h-11 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2C6EAF]"
                  aria-label="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="border-b border-slate-100 flex px-6 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setModalTab('details')}
                  className={`py-3.5 px-4 text-xs font-bold border-b-2 -mb-px transition-all cursor-pointer focus:outline-none ${
                    modalTab === 'details'
                      ? 'border-[#2C6EAF] text-[#2C6EAF]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Thông tin chi tiết
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('apply')}
                  className={`py-3.5 px-4 text-xs font-bold border-b-2 -mb-px transition-all cursor-pointer focus:outline-none ${
                    modalTab === 'apply'
                      ? 'border-[#2C6EAF] text-[#2C6EAF]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Nộp đơn trực tuyến
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[55vh] bg-[#F8FAFC]/40 flex-1">
                {modalTab === 'details' ? (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Trị giá</span>
                        <span className="text-sm font-extrabold text-emerald-600 mt-1">
                          {activeModalScholarship.amount === 'Toàn phần' ? '100% Học phí' : activeModalScholarship.amount}
                        </span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Hạn nộp</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                          {formatDate(activeModalScholarship.deadline)}
                          {isExpiringSoon(activeModalScholarship.deadline) && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          )}
                        </span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Địa điểm</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-1">{activeModalScholarship.location}</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Cấp học</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-1">{activeModalScholarship.level}</span>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col gap-4">
                      <div>
                        <h4 className="font-sans font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-[#2C6EAF]" />
                          Quyền lợi học bổng
                        </h4>
                        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-1.5">
                          <li>Miễn giảm học phí học kỳ hoặc hỗ trợ toàn phần học phí chuyên ngành.</li>
                          <li>Cơ hội tham gia nghiên cứu khoa học cùng các chuyên gia hàng đầu.</li>
                          <li>Ưu tiên thực tập tại các đơn vị đối tác liên kết.</li>
                        </ul>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <h4 className="font-sans font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-2">
                          <GraduationCap className="w-4 h-4 text-[#2C6EAF]" />
                          Điều kiện xét tuyển
                        </h4>
                        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-1.5">
                          <li>GPA đạt từ 3.2/4.0 trở lên hoặc tương đương.</li>
                          <li>Có chứng chỉ ngoại ngữ phù hợp với yêu cầu chương trình.</li>
                          <li>Tích cực tham gia hoạt động ngoại khóa hoặc nghiên cứu học thuật.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : showSuccessPage || appliedList.includes(activeModalScholarship.id) ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 bg-white rounded-xl border border-slate-100 p-8 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h4 className="font-sans font-extrabold text-slate-800 text-base mb-1.5">
                      Nộp hồ sơ ứng tuyển thành công!
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-6">
                      Hồ sơ của bạn đã được lưu trên hệ thống demo và chuyển tới hội đồng tuyển sinh của <strong>{activeModalScholarship.sponsorName}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={closeDetailsModal}
                      className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
                    >
                      Hoàn thành
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">Họ và tên <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Nguyễn Văn A"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2C6EAF]/30 focus:border-[#2C6EAF] transition-all"
                        />
                        {formErrors.fullName && <p className="text-[10px] text-rose-500 font-bold">{formErrors.fullName}</p>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">Email <span className="text-rose-500">*</span></label>
                        <input
                          type="email"
                          placeholder="nguyenvana@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2C6EAF]/30 focus:border-[#2C6EAF] transition-all"
                        />
                        {formErrors.email && <p className="text-[10px] text-rose-500 font-bold">{formErrors.email}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">Số điện thoại <span className="text-rose-500">*</span></label>
                        <input
                          type="tel"
                          placeholder="0987xxxxxx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2C6EAF]/30 focus:border-[#2C6EAF] transition-all"
                        />
                        {formErrors.phone && <p className="text-[10px] text-rose-500 font-bold">{formErrors.phone}</p>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">GPA hệ 4.0 <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Ví dụ: 3.65"
                          value={gpa}
                          onChange={(e) => setGpa(e.target.value)}
                          className="px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2C6EAF]/30 focus:border-[#2C6EAF] transition-all"
                        />
                        {formErrors.gpa && <p className="text-[10px] text-rose-500 font-bold">{formErrors.gpa}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Tải lên hồ sơ CV <span className="text-rose-500">*</span></label>
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                          isDragging
                            ? 'border-[#2C6EAF] bg-[#F4F8FC]/60'
                            : cvFile
                              ? 'border-emerald-200 bg-emerald-50/10'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                        />

                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-7 h-7 text-[#2C6EAF] animate-spin" />
                            <span className="text-xs text-slate-500 font-bold">Đang tải lên: {uploadProgress}%</span>
                          </div>
                        ) : cvFile ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800">{cvFile.name}</p>
                              <p className="text-[10px] text-slate-400">{(cvFile.size / 1024).toFixed(1)} KB - Tải lên thành công</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="w-7 h-7 text-slate-400 mb-2" />
                            <p className="text-xs font-bold text-slate-700">Kéo thả file CV hoặc click để duyệt file</p>
                            <p className="text-[10px] text-slate-400 mt-1">Chấp nhận .pdf, .doc, .docx</p>
                          </div>
                        )}
                      </div>
                      {formErrors.cvFile && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.cvFile}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="w-full mt-2 bg-[#2C6EAF] hover:bg-[#1E5084] disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2C6EAF]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang xác thực thông tin...</span>
                        </>
                      ) : (
                        <span>Xác nhận nộp đơn ứng tuyển</span>
                      )}
                    </button>
                  </form>
                )}
              </div>

              <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold text-slate-400">TopScholar Trực Tuyến</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeDetailsModal}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                  >
                    Đóng cửa sổ
                  </button>
                  {modalTab === 'details' && !appliedList.includes(activeModalScholarship.id) && (
                    <button
                      type="button"
                      onClick={() => setModalTab('apply')}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#2C6EAF] hover:bg-[#1E5084] rounded-lg cursor-pointer"
                    >
                      Nộp hồ sơ ngay
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
