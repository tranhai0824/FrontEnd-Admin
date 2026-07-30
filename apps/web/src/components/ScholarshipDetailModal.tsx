import React, { useState, useRef } from 'react';
import { Scholarship, ApplicationForm } from '../types';
import { X, Calendar, MapPin, Tag, Award, CheckCircle, FileText, Upload, ChevronRight, GraduationCap, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScholarshipDetailModalProps {
  scholarship: Scholarship | null;
  onClose: () => void;
  onApplySuccess: (scholarshipId: string, formData: ApplicationForm) => void;
  hasApplied: boolean;
}

export default function ScholarshipDetailModal({
  scholarship,
  onClose,
  onApplySuccess,
  hasApplied
}: ScholarshipDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'apply'>('details');
  const [imgError, setImgError] = useState(false);
  const [formData, setFormData] = useState<ApplicationForm>({
    fullName: '',
    email: '',
    phone: '',
    gpa: '',
    ielts: '',
    statementOfPurpose: '',
    cvFileName: ''
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ApplicationForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!scholarship) return null;

  const isUrl = scholarship.partnerLogo && (
    scholarship.partnerLogo.startsWith('http') || 
    scholarship.partnerLogo.startsWith('/') || 
    scholarship.partnerLogo.includes('.')
  );

  const renderLogo = () => {
    if (isUrl && !imgError) {
      return (
        <img
          src={scholarship.partnerLogo}
          alt={scholarship.partnerName}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-1 rounded-xl"
          referrerPolicy="no-referrer"
        />
      );
    }

    const initials = scholarship.partnerName
      .replace(/Trường|Đại học|Học viện|Phân hiệu|University/g, '')
      .trim()
      .split(' ')
      .map(w => w[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .substring(0, 3);

    return (
      <span className="font-sans font-extrabold text-[#2C6EAF] text-sm md:text-base leading-none tracking-wider">
        {initials || 'UNI'}
      </span>
    );
  };

  const formatDeadline = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof ApplicationForm]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Các hàm xử lý kéo thả
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileSelectBtn = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    // Chỉ chấp nhận PDF hoặc Doc/Docx
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setFormErrors(prev => ({ ...prev, cvFileName: 'Định dạng file không hợp lệ. Vui lòng nộp file PDF, DOC hoặc DOCX' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // Giới hạn 10MB
      setFormErrors(prev => ({ ...prev, cvFileName: 'Kích thước file tối đa là 10MB' }));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setFormErrors(prev => ({ ...prev, cvFileName: '' }));

    // Mô phỏng thanh tiến trình tải lên
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setFormData(curr => ({ ...curr, cvFileName: file.name }));
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, cvFileName: '' }));
    setUploadProgress(0);
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof ApplicationForm, string>> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email liên hệ';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không đúng định dạng';
    }
    if (!formData.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
    
    if (!formData.gpa.trim()) {
      errors.gpa = 'Vui lòng nhập điểm GPA';
    } else {
      const gpaNum = parseFloat(formData.gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
        errors.gpa = 'GPA phải là số thực từ 0.0 đến 10.0';
      }
    }

    if (formData.ielts.trim()) {
      const ieltsNum = parseFloat(formData.ielts);
      if (isNaN(ieltsNum) || ieltsNum < 0 || ieltsNum > 9.0) {
        errors.ielts = 'IELTS phải từ 0.0 đến 9.0';
      }
    }

    if (!formData.cvFileName) {
      errors.cvFileName = 'Vui lòng tải lên hồ sơ CV/Học bạ của bạn';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Mô phỏng yêu cầu gửi lên máy chủ
    setTimeout(() => {
      setIsSubmitting(false);
      onApplySuccess(scholarship.id, formData);
    }, 1500);
  };

  const isFull = scholarship.valueType === 'Full';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id={`modal-scholarship-detail-${scholarship.id}`}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-3xl transform overflow-hidden rounded-[12px] bg-white text-left shadow-2xl transition-all flex flex-col max-h-[90vh]"
        >
          {/* Top Bar with close and tabs */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 mr-2 transition-colors cursor-pointer md:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    activeTab === 'details'
                      ? 'bg-white text-[#2C6EAF] shadow-xs border border-slate-100'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  id="tab-btn-details"
                >
                  Thông tin học bổng
                </button>
                <button
                  onClick={() => setActiveTab('apply')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    activeTab === 'apply'
                      ? 'bg-white text-[#2C6EAF] shadow-xs border border-slate-100'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  id="tab-btn-apply"
                >
                  {hasApplied ? 'Trạng thái ứng tuyển' : 'Nộp hồ sơ trực tuyến'}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              id="btn-close-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="overflow-y-auto flex-1 p-6">
            {activeTab === 'details' ? (
              <div className="flex flex-col gap-6" id="details-tab-content">
                {/* Intro Header */}
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-14 h-14 bg-[#F4F8FC] border border-[#DCEAF6] rounded-xl text-3xl shrink-0 overflow-hidden">
                    {renderLogo()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isFull 
                          ? 'bg-[#EAF2F9] text-[#2C6EAF] border border-[#2C6EAF]/20' 
                          : 'bg-[#EAF2F9]/30 text-slate-600 border border-slate-150'
                      }`}>
                        {isFull ? 'Toàn phần' : 'Bán phần'}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-md">
                        {scholarship.level}
                      </span>
                    </div>
                    <h2 className="font-sans font-bold text-lg md:text-xl text-slate-900 leading-tight">
                      {scholarship.title}
                    </h2>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">{scholarship.partnerName}</p>
                  </div>
                </div>

                {/* Grid Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Trị giá</span>
                    <span className={`text-sm font-bold ${isFull ? 'text-[#2C6EAF]' : 'text-slate-700'}`}>
                      {scholarship.valueType === 'Full' ? '100% Học bổng' : 'Một phần'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Khu vực</span>
                    <span className="text-sm font-bold text-slate-700">{scholarship.region}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Bậc học</span>
                    <span className="text-sm font-bold text-slate-700">{scholarship.level}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Hạn nộp</span>
                    <span className="text-sm font-bold text-slate-700">{formatDeadline(scholarship.deadline)}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-sans font-bold text-sm text-slate-900 border-l-3 border-[#2C6EAF] pl-2 leading-none">
                    Mô tả chung
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {scholarship.description}
                  </p>
                </div>

                {/* Tiêu chí */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-sans font-bold text-sm text-slate-900 border-l-3 border-[#2C6EAF] pl-2 leading-none">
                    Điều kiện ứng tuyển (Tiêu chí)
                  </h4>
                  <ul className="flex flex-col gap-2 pl-1">
                    {scholarship.criteria.map((crit, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-[#2C6EAF] shrink-0 mt-0.5" />
                        <span>{crit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lợi ích */}
                <div className="flex flex-col gap-3 bg-[#F4F8FC] p-4 rounded-xl border border-slate-100">
                  <h4 className="font-sans font-bold text-sm text-slate-900 border-l-3 border-[#2C6EAF] pl-2 leading-none">
                    Quyền lợi của học bổng (Lợi ích)
                  </h4>
                  <ul className="flex flex-col gap-2 mt-1">
                    {scholarship.benefits.map((benefit, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2C6EAF] mt-1.5 shrink-0"></div>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Selection Steps */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-sans font-bold text-sm text-slate-900 border-l-3 border-[#2C6EAF] pl-2 leading-none">
                    Quy trình nộp hồ sơ & xét tuyển
                  </h4>
                  <div className="flex flex-col gap-3 mt-1 relative pl-4 border-l border-slate-150 ml-2">
                    {scholarship.steps.map((step, i) => (
                      <div key={i} className="relative group/step">
                        {/* Dot */}
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#2C6EAF] ring-4 ring-white transition-transform group-hover/step:scale-125"></div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400">Bước {i + 1}</span>
                          <span className="text-sm text-slate-600 leading-relaxed mt-0.5">{step}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Hạn chót ứng tuyển:</span>
                    <p className="text-sm font-bold text-slate-800">{formatDeadline(scholarship.deadline)}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('apply')}
                    className="bg-[#2C6EAF] hover:bg-[#1E5084] text-white font-semibold text-sm px-6 py-2.5 rounded-lg active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-blue-100"
                    id="btn-apply-modal-foot"
                  >
                    {hasApplied ? 'Kiểm tra hồ sơ đã nộp' : 'Nộp hồ sơ trực tuyến'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6" id="apply-tab-content">
                {hasApplied ? (
                  /* Success/Applied State */
                  <div className="py-8 px-4 text-center max-w-md mx-auto flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="font-sans font-bold text-lg text-slate-900">
                      Hồ sơ đã được gửi thành công!
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                      Cảm ơn bạn đã nộp đơn cho <span className="font-semibold text-slate-700">{scholarship.title}</span> qua hệ thống của chúng tôi. Hồ sơ của bạn đang được hội đồng sơ tuyển của đối tác thẩm định.
                    </p>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 w-full mt-6 text-left flex flex-col gap-2.5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin nộp đơn</h4>
                      <div className="text-xs text-slate-600 flex justify-between">
                        <span>Họ và tên:</span>
                        <span className="font-semibold text-slate-900">{formData.fullName || 'Nguyễn Văn A'}</span>
                      </div>
                      <div className="text-xs text-slate-600 flex justify-between">
                        <span>Email liên hệ:</span>
                        <span className="font-semibold text-slate-900">{formData.email || 'student@domain.com'}</span>
                      </div>
                      <div className="text-xs text-slate-600 flex justify-between">
                        <span>Điểm số GPA:</span>
                        <span className="font-semibold text-slate-900">{formData.gpa || '9.0'}/10</span>
                      </div>
                      <div className="text-xs text-slate-600 flex justify-between">
                        <span>File đính kèm:</span>
                        <span className="font-semibold text-[#2C6EAF] flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {formData.cvFileName || 'Ho_so_ung_tuyen.pdf'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex justify-between items-center border-t border-slate-100 pt-2 mt-1">
                        <span>Trạng thái:</span>
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          ĐANG THẨM ĐỊNH SƠ KHẢO
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('details')}
                      className="mt-6 text-sm font-semibold text-[#2C6EAF] hover:text-[#1E5084] cursor-pointer flex items-center gap-1"
                    >
                      &larr; Trở lại trang chi tiết học bổng
                    </button>
                  </div>
                ) : (
                  /* Form Input State */
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                      <h3 className="font-sans font-bold text-base text-slate-900 mb-1">
                        Cổng ứng tuyển trực tuyến
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Hồ sơ của bạn sẽ được mã hóa an toàn và chuyển trực tiếp tới Văn phòng Tuyển sinh / Quản lý học bổng của <span className="font-semibold text-slate-700">{scholarship.partnerName}</span>.
                      </p>
                    </div>

                    {/* Full Name & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">Họ và tên sinh viên <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Ví dụ: Nguyễn Văn A"
                          className={`w-full bg-slate-50 border rounded-[8px] px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C6EAF] transition-all ${
                            formErrors.fullName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
                          }`}
                          id="input-fullname"
                        />
                        {formErrors.fullName && <span className="text-[11px] text-rose-500">{formErrors.fullName}</span>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">Email nhận thông báo kết quả <span className="text-rose-500">*</span></label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="email@example.com"
                          className={`w-full bg-slate-50 border rounded-[8px] px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C6EAF] transition-all ${
                            formErrors.email ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
                          }`}
                          id="input-email"
                        />
                        {formErrors.email && <span className="text-[11px] text-rose-500">{formErrors.email}</span>}
                      </div>
                    </div>

                    {/* Phone & GPA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">Số điện thoại liên hệ <span className="text-rose-500">*</span></label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Số di động của bạn"
                          className={`w-full bg-slate-50 border rounded-[8px] px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C6EAF] transition-all ${
                            formErrors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
                          }`}
                          id="input-phone"
                        />
                        {formErrors.phone && <span className="text-[11px] text-rose-500">{formErrors.phone}</span>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">Điểm số GPA tích lũy <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          name="gpa"
                          value={formData.gpa}
                          onChange={handleInputChange}
                          placeholder="Thang 10 (Ví dụ: 8.5)"
                          className={`w-full bg-slate-50 border rounded-[8px] px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C6EAF] transition-all ${
                            formErrors.gpa ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
                          }`}
                          id="input-gpa"
                        />
                        {formErrors.gpa && <span className="text-[11px] text-rose-500">{formErrors.gpa}</span>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">Điểm IELTS / TOEFL (Nếu có)</label>
                        <input
                          type="text"
                          name="ielts"
                          value={formData.ielts}
                          onChange={handleInputChange}
                          placeholder="Ví dụ: 7.5"
                          className={`w-full bg-slate-50 border rounded-[8px] px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C6EAF] transition-all ${
                            formErrors.ielts ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
                          }`}
                          id="input-ielts"
                        />
                        {formErrors.ielts && <span className="text-[11px] text-rose-500">{formErrors.ielts}</span>}
                      </div>
                    </div>

                    {/* Statement of purpose */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Thư bày tỏ nguyện vọng / bài luận cá nhân</label>
                      <textarea
                        name="statementOfPurpose"
                        value={formData.statementOfPurpose}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Hãy viết khoảng 150-300 từ giới thiệu bản thân và lý do vì sao bạn xứng đáng nhận suất học bổng này..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C6EAF] transition-all resize-none"
                      ></textarea>
                    </div>

                    {/* Drag-and-drop File Upload for CV */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Hồ sơ lý lịch CV & Học bạ (Gộp chung thành 1 file) <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-400">PDF, DOC, DOCX tối đa 10MB</span>
                      </label>

                      {formData.cvFileName ? (
                        /* Uploaded file preview */
                        <div className="bg-[#F4F8FC] p-4 rounded-xl border border-[#DCEAF6] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#EAF2F9] text-[#2C6EAF] flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate max-w-[250px] sm:max-w-[380px]">
                                {formData.cvFileName}
                              </p>
                              <p className="text-[10px] text-[#2C6EAF] font-medium flex items-center gap-1 mt-0.5">
                                <CheckCircle className="w-3 h-3" /> Đã đính kèm thành công
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-1 bg-white hover:bg-rose-50 rounded-md border border-rose-100 cursor-pointer"
                          >
                            Xóa file
                          </button>
                        </div>
                      ) : (
                        /* Upload Box */
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={handleFileSelectBtn}
                          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            isDragging
                              ? 'border-[#2C6EAF] bg-[#EAF2F9]/50'
                              : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                          />

                          {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-[#2C6EAF] animate-spin" />
                              <p className="text-xs font-semibold text-slate-700">Đang tải file lên... {uploadProgress}%</p>
                              <div className="w-40 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                <div className="bg-[#2C6EAF] h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-[#2C6EAF] mb-2" />
                              <p className="text-xs font-bold text-slate-700">Kéo thả file hồ sơ của bạn vào đây</p>
                              <p className="text-[11px] text-slate-400 mt-1">Hoặc nhấp chuột để duyệt file từ thiết bị</p>
                            </>
                          )}
                        </div>
                      )}

                      {formErrors.cvFileName && <span className="text-[11px] text-rose-500 mt-0.5">{formErrors.cvFileName}</span>}
                    </div>

                    {/* Submission button */}
                    <div className="flex items-center gap-4 border-t border-slate-100 pt-5 mt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className="text-slate-500 hover:text-slate-800 font-semibold text-xs py-2.5 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
                      >
                        Quay lại xem thông tin
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-[#2C6EAF] hover:bg-[#1E5084] text-white font-semibold text-sm py-2.5 px-5 rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-100 disabled:opacity-75 disabled:cursor-not-allowed"
                        id="btn-submit-application"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang nộp hồ sơ...</span>
                          </>
                        ) : (
                          <>
                            <span>Nộp đơn ứng tuyển ngay</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
