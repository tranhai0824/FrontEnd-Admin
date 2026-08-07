import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  Search,
  SlidersHorizontal,
  Star,
  X
} from 'lucide-react';
import UniversityCard, { type UniversityCardProps } from './UniversityCard';

type SupportType = 'toan_phan' | 'hoc_phi' | 'ban_phan' | 'gia_tri_cu_the';
type ResultsTab = 'scholarships' | 'universities' | 'programs';

interface FilterScholarship {
  id: string;
  title: string;
  university: string;
  country: string;
  rating: number;
  reviewsCount: number;
  fieldsOfStudy: string[];
  level: string;
  duration: string;
  financialSupportType: SupportType;
  financialSupportValue: string;
  financialValueNumeric: number;
  gpaRequirement: number;
  ieltsRequirement: number;
  description: string;
  deadline: string;
  isHot: boolean;
}

interface FilterState {
  searchQuery: string;
  fieldsOfStudy: string[];
  countries: string[];
  financialSupportTypes: string[];
  levels: string[];
  minIelts: number;
  minGpa: number;
  universities: string[];
  durations: string[];
}

export interface ScholarshipSearchRequest {
  keyword?: string;
  level?: string;
  major?: string;
  region?: string;
  scholarshipType?: string;
}

interface ScholarshipFilterPageProps {
  searchRequest?: ScholarshipSearchRequest;
  onFeedback?: (message: string) => void;
}

interface ProgramResult {
  id: string;
  initials: string;
  university: string;
  location: string;
  rating: string;
  reviews: number;
  title: string;
  level: string;
  description: string;
  duration: string;
  tuition: string;
  intake: string;
  requirements: string[];
  scholarships: string;
}

const PROGRAM_RESULTS: ProgramResult[] = [
  {
    id: 'ptit-data-science', initials: 'PT', university: 'Học viện Công nghệ Bưu chính Viễn thông', location: 'Hà Nội, Việt Nam', rating: '4.6', reviews: 128,
    title: 'Thạc sĩ Khoa học dữ liệu', level: 'Thạc sĩ',
    description: 'Chương trình tập trung vào phân tích dữ liệu, trí tuệ nhân tạo và các dự án ứng dụng cùng doanh nghiệp công nghệ.',
    duration: '2 năm · Bán thời gian', tuition: '42 triệu đồng / năm', intake: 'Tháng 9/2026',
    requirements: ['Tốt nghiệp đại học', 'GPA từ 2.5/4.0', 'Tiếng Anh B1'], scholarships: '8 học bổng áp dụng cho chương trình này'
  },
  {
    id: 'neu-business', initials: 'NE', university: 'Đại học Kinh tế Quốc dân', location: 'Hà Nội, Việt Nam', rating: '4.5', reviews: 94,
    title: 'Cử nhân Quản trị Kinh doanh', level: 'Cử nhân',
    description: 'Trang bị kiến thức quản trị hiện đại, kỹ năng lãnh đạo và cơ hội thực tập tại mạng lưới doanh nghiệp đối tác.',
    duration: '4 năm · Toàn thời gian', tuition: '36 triệu đồng / năm', intake: 'Tháng 9/2026',
    requirements: ['Tốt nghiệp THPT', 'Điểm xét tuyển phù hợp', 'Tiếng Anh đầu vào'], scholarships: '12 học bổng áp dụng cho chương trình này'
  },
  {
    id: 'hust-it', initials: 'BK', university: 'Đại học Bách khoa Hà Nội', location: 'Hà Nội, Việt Nam', rating: '4.7', reviews: 156,
    title: 'Thạc sĩ Công nghệ thông tin', level: 'Thạc sĩ',
    description: 'Chương trình nâng cao dành cho người học muốn phát triển chuyên môn về kỹ thuật phần mềm và hệ thống thông minh.',
    duration: '2 năm · Toàn thời gian', tuition: '48 triệu đồng / năm', intake: 'Tháng 2/2027',
    requirements: ['Tốt nghiệp ngành phù hợp', 'GPA từ 2.8/4.0', 'Phỏng vấn đầu vào'], scholarships: '6 học bổng áp dụng cho chương trình này'
  },
  {
    id: 'fpt-design', initials: 'FU', university: 'Đại học FPT', location: 'Hà Nội, Việt Nam', rating: '4.4', reviews: 83,
    title: 'Cử nhân Thiết kế đồ họa', level: 'Cử nhân',
    description: 'Học theo dự án thực tế, phát triển tư duy thiết kế và xây dựng hồ sơ năng lực cho ngành công nghiệp sáng tạo.',
    duration: '4 năm · Toàn thời gian', tuition: '58 triệu đồng / năm', intake: 'Tháng 9/2026',
    requirements: ['Tốt nghiệp THPT', 'Portfolio hoặc bài thi năng khiếu', 'Phỏng vấn'], scholarships: '10 học bổng áp dụng cho chương trình này'
  }
];

const COUNTRIES = ['Hoa Kỳ', 'Anh Quốc', 'Úc', 'Singapore', 'Canada', 'Nhật Bản', 'Đức', 'Hà Lan'];

const FIELDS_OF_STUDY = [
  'Công nghệ thông tin & Khoa học máy tính',
  'Kinh doanh & Quản lý',
  'Kỹ thuật & Công nghệ',
  'Y tế & Y sinh',
  'Nghệ thuật & Thiết kế',
  'Khoa học xã hội & Nhân văn'
];

const FINANCIAL_SUPPORT_TYPES = [
  { key: 'toan_phan', label: 'Toàn phần (Học phí + Sinh hoạt phí)' },
  { key: 'hoc_phi', label: '100% Học phí' },
  { key: 'ban_phan', label: 'Bán phần (30% - 50%)' },
  { key: 'gia_tri_cu_the', label: 'Mức cố định / trợ cấp' }
];

const LEVELS = ['Cử nhân', 'Thạc sĩ', 'Tiến sĩ'];
const DURATIONS = ['9 tháng', '1 năm', '2 năm', '3 năm', '4 năm'];

const UNIVERSITY_RESULTS: UniversityCardProps[] = [
  {
    universityName: 'Học viện Nông nghiệp Việt Nam',
    location: 'Hà Nội, Việt Nam',
    attendance: 'Học trực tuyến / Học tại trường',
    masterCount: 45,
    intake: 'Tháng 9/2026',
    scholarshipCount: 48,
    rating: 4.3,
    reviewCount: 56,
    globalRanking: 'Top 0,5%',
    logoUrl: '/images/Hoc_Vien_Nong_Nghiep_Viet_Nam.webp',
    websiteUrl: 'https://vnua.edu.vn/'
  },
  {
    universityName: 'Đại học Cornell',
    location: 'Ithaca, Hoa Kỳ',
    attendance: 'Học tại trường',
    masterCount: 62,
    intake: 'Tháng 8/2026',
    scholarshipCount: 32,
    rating: 4.2,
    reviewCount: 42,
    globalRanking: 'Top 1%',
    websiteUrl: 'https://www.cornell.edu/'
  },
  {
    universityName: 'Đại học Sydney',
    location: 'Sydney, Úc',
    attendance: 'Học trực tiếp / Kết hợp',
    masterCount: 58,
    intake: 'Tháng 2/2027',
    scholarshipCount: 40,
    rating: 4.7,
    reviewCount: 95,
    globalRanking: 'Top 2%',
    websiteUrl: 'https://www.sydney.edu.au/'
  }
];

const FILTER_SCHOLARSHIPS: FilterScholarship[] = [
  {
    id: 'sch-1',
    title: 'Học bổng Toàn phần ASEAN',
    university: 'Đại học Quốc gia Singapore (NUS)',
    country: 'Singapore',
    rating: 4.9,
    reviewsCount: 142,
    fieldsOfStudy: ['Công nghệ thông tin & Khoa học máy tính', 'Kinh doanh & Quản lý'],
    level: 'Cử nhân',
    duration: '4 năm',
    financialSupportType: 'toan_phan',
    financialSupportValue: '100% học phí + Sinh hoạt phí 5.800 SGD/năm',
    financialValueNumeric: 45000,
    gpaRequirement: 3.8,
    ieltsRequirement: 7.0,
    description: 'Học bổng danh giá dành cho công dân ASEAN có thành tích học tập xuất sắc, ứng tuyển vào chương trình cử nhân chính quy tại NUS.',
    deadline: '15/12/2026',
    isHot: true
  },
  {
    id: 'sch-2',
    title: 'Fulbright Vietnamese Student Program',
    university: 'Các trường Đại học hàng đầu Hoa Kỳ',
    country: 'Hoa Kỳ',
    rating: 5.0,
    reviewsCount: 230,
    fieldsOfStudy: ['Khoa học xã hội & Nhân văn', 'Kinh doanh & Quản lý'],
    level: 'Thạc sĩ',
    duration: '2 năm',
    financialSupportType: 'toan_phan',
    financialSupportValue: 'Toàn phần học phí + sinh hoạt phí + vé máy bay',
    financialValueNumeric: 75000,
    gpaRequirement: 3.5,
    ieltsRequirement: 6.5,
    description: 'Chương trình học bổng của Chính phủ Hoa Kỳ nhằm tăng cường trao đổi học thuật và phát triển năng lực lãnh đạo.',
    deadline: '15/04/2026',
    isHot: true
  },
  {
    id: 'sch-3',
    title: 'Chevening Scholarships',
    university: 'Tất cả các Đại học tại Anh Quốc',
    country: 'Anh Quốc',
    rating: 4.8,
    reviewsCount: 188,
    fieldsOfStudy: ['Khoa học xã hội & Nhân văn', 'Y tế & Y sinh'],
    level: 'Thạc sĩ',
    duration: '1 năm',
    financialSupportType: 'toan_phan',
    financialSupportValue: 'Học phí tối đa £22.000 + sinh hoạt phí',
    financialValueNumeric: 60000,
    gpaRequirement: 3.3,
    ieltsRequirement: 6.5,
    description: 'Học bổng toàn cầu của Chính phủ Anh dành cho các nhà lãnh đạo tương lai học Thạc sĩ một năm tại Anh.',
    deadline: '05/11/2026',
    isHot: true
  },
  {
    id: 'sch-4',
    title: "Vice-Chancellor's International Scholarships",
    university: 'Đại học Sydney',
    country: 'Úc',
    rating: 4.7,
    reviewsCount: 95,
    fieldsOfStudy: ['Công nghệ thông tin & Khoa học máy tính', 'Kỹ thuật & Công nghệ'],
    level: 'Cử nhân',
    duration: '3 năm',
    financialSupportType: 'ban_phan',
    financialSupportValue: 'Hỗ trợ lên tới 40.000 AUD',
    financialValueNumeric: 28000,
    gpaRequirement: 3.7,
    ieltsRequirement: 6.5,
    description: 'Học bổng dựa trên thành tích học thuật xuất sắc của sinh viên quốc tế khi đăng ký chương trình tại Đại học Sydney.',
    deadline: '30/09/2026',
    isHot: false
  },
  {
    id: 'sch-5',
    title: 'Lester B. Pearson International Scholarships',
    university: 'Đại học Toronto',
    country: 'Canada',
    rating: 4.9,
    reviewsCount: 110,
    fieldsOfStudy: ['Công nghệ thông tin & Khoa học máy tính', 'Khoa học xã hội & Nhân văn'],
    level: 'Cử nhân',
    duration: '4 năm',
    financialSupportType: 'toan_phan',
    financialSupportValue: '100% học phí, sách vở, sinh hoạt và ký túc xá',
    financialValueNumeric: 65000,
    gpaRequirement: 3.9,
    ieltsRequirement: 7.0,
    description: 'Học bổng toàn diện của Đại học Toronto dành cho sinh viên quốc tế xuất sắc có đóng góp tích cực cho cộng đồng.',
    deadline: '15/01/2027',
    isHot: true
  },
  {
    id: 'sch-6',
    title: 'MEXT University Recommendation Scholarship',
    university: 'Đại học Tokyo',
    country: 'Nhật Bản',
    rating: 4.8,
    reviewsCount: 164,
    fieldsOfStudy: ['Kỹ thuật & Công nghệ', 'Y tế & Y sinh'],
    level: 'Tiến sĩ',
    duration: '3 năm',
    financialSupportType: 'toan_phan',
    financialSupportValue: 'Toàn bộ học phí + 145.000 JPY/tháng',
    financialValueNumeric: 52000,
    gpaRequirement: 3.4,
    ieltsRequirement: 6.5,
    description: 'Học bổng chính phủ Nhật Bản cho ứng viên nghiên cứu có định hướng học thuật rõ ràng và hồ sơ nổi bật.',
    deadline: '10/10/2026',
    isHot: false
  }
];

const emptyFilters: FilterState = {
  searchQuery: '',
  fieldsOfStudy: [],
  countries: [],
  financialSupportTypes: [],
  levels: [],
  minIelts: 0,
  minGpa: 0,
  universities: [],
  durations: []
};

const HERO_LEVEL_MAP: Record<string, string> = {
  'Đại học': 'Cử nhân',
  'Thạc sĩ': 'Thạc sĩ',
  'Tiến sĩ': 'Tiến sĩ'
};

const HERO_MAJOR_MAP: Record<string, string> = {
  'Công nghệ thông tin': 'Công nghệ thông tin & Khoa học máy tính',
  'Kinh tế': 'Kinh doanh & Quản lý',
  'Y dược': 'Y tế & Y sinh',
  'Ngôn ngữ': 'Khoa học xã hội & Nhân văn'
};

const HERO_SUPPORT_MAP: Record<string, SupportType> = {
  'Toàn phần': 'toan_phan',
  'Bán phần': 'ban_phan',
  'Tài trợ doanh nghiệp': 'gia_tri_cu_the'
};

function searchRequestToFilters(request?: ScholarshipSearchRequest): FilterState {
  if (!request) return emptyFilters;

  return {
    ...emptyFilters,
    searchQuery: request.keyword?.trim() || '',
    fieldsOfStudy: request.major && HERO_MAJOR_MAP[request.major] ? [HERO_MAJOR_MAP[request.major]] : [],
    levels: request.level && HERO_LEVEL_MAP[request.level] ? [HERO_LEVEL_MAP[request.level]] : [],
    financialSupportTypes: request.scholarshipType && HERO_SUPPORT_MAP[request.scholarshipType]
      ? [HERO_SUPPORT_MAP[request.scholarshipType]]
      : []
  };
}

function filtersToSearchParams(filters: FilterState, activeTab: ResultsTab, sortBy: string) {
  const params = new URLSearchParams();
  if (filters.searchQuery) params.set('q', filters.searchQuery);
  if (filters.fieldsOfStudy.length) params.set('field', filters.fieldsOfStudy.join(','));
  if (filters.countries.length) params.set('country', filters.countries.join(','));
  if (filters.financialSupportTypes.length) params.set('support', filters.financialSupportTypes.join(','));
  if (filters.levels.length) params.set('level', filters.levels.join(','));
  if (filters.minGpa > 0) params.set('gpa', String(filters.minGpa));
  if (filters.minIelts > 0) params.set('ielts', String(filters.minIelts));
  if (activeTab !== 'scholarships') params.set('tab', activeTab);
  if (sortBy !== 'default') params.set('sort', sortBy);
  return params;
}

function filtersFromSearchParams(): { filters: FilterState; activeTab: ResultsTab; sortBy: string } {
  const params = new URLSearchParams(window.location.search);
  const split = (key: string) => params.get(key)?.split(',').filter(Boolean) || [];
  const tab = params.get('tab');
  return {
    filters: {
      ...emptyFilters,
      searchQuery: params.get('q') || '',
      fieldsOfStudy: split('field').filter((item) => FIELDS_OF_STUDY.includes(item)),
      countries: split('country').filter((item) => COUNTRIES.includes(item)),
      financialSupportTypes: split('support').filter((item) => FINANCIAL_SUPPORT_TYPES.some((support) => support.key === item)),
      levels: split('level').filter((item) => LEVELS.includes(item)),
      minGpa: Number(params.get('gpa')) || 0,
      minIelts: Number(params.get('ielts')) || 0
    },
    activeTab: tab === 'universities' || tab === 'programs' ? tab : 'scholarships',
    sortBy: params.get('sort') || 'default'
  };
}

function parseDate(dateStr: string) {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}

function initials(name: string) {
  return name
    .split(' ')
    .filter((word) => !['Đại', 'học', 'Trường', 'Cao', 'đẳng', 'tại', 'các'].includes(word))
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function updateList(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function AccordionSection({
  title,
  defaultOpen = false,
  children
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-200 p-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900"
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function CheckboxList({
  options,
  selected,
  onToggle
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
      {options.map((option) => (
        <label key={option} className="flex cursor-pointer items-start gap-2 text-xs text-slate-600 hover:text-slate-800">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => onToggle(option)}
            className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function FilterSidebar({
  filters,
  setFilters
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}) {
  const universities = Array.from(new Set(FILTER_SCHOLARSHIPS.map((item) => item.university)));

  return (
    <aside className="sticky top-24 overflow-hidden rounded-md border border-slate-200 bg-white divide-y divide-slate-200">
      <AccordionSection title="Lĩnh vực nghiên cứu" defaultOpen>
        <CheckboxList
          options={FIELDS_OF_STUDY}
          selected={filters.fieldsOfStudy}
          onToggle={(value) => setFilters((prev) => ({ ...prev, fieldsOfStudy: updateList(prev.fieldsOfStudy, value) }))}
        />
      </AccordionSection>

      <AccordionSection title="Vị trí" defaultOpen>
        <CheckboxList
          options={COUNTRIES}
          selected={filters.countries}
          onToggle={(value) => setFilters((prev) => ({ ...prev, countries: updateList(prev.countries, value) }))}
        />
      </AccordionSection>

      <AccordionSection title="Trường đại học">
        <CheckboxList
          options={universities}
          selected={filters.universities}
          onToggle={(value) => setFilters((prev) => ({ ...prev, universities: updateList(prev.universities, value) }))}
        />
      </AccordionSection>

      <AccordionSection title="Học phí / Học bổng" defaultOpen>
        <div className="space-y-2">
          {FINANCIAL_SUPPORT_TYPES.map((type) => (
            <label key={type.key} className="flex cursor-pointer items-start gap-2 text-xs text-slate-600 hover:text-slate-800">
              <input
                type="checkbox"
                checked={filters.financialSupportTypes.includes(type.key)}
                onChange={() =>
                  setFilters((prev) => ({
                    ...prev,
                    financialSupportTypes: updateList(prev.financialSupportTypes, type.key)
                  }))
                }
                className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Khoảng thời gian">
        <CheckboxList
          options={DURATIONS}
          selected={filters.durations}
          onToggle={(value) => setFilters((prev) => ({ ...prev, durations: updateList(prev.durations, value) }))}
        />
      </AccordionSection>

      <AccordionSection title="Loại bằng cấp" defaultOpen>
        <CheckboxList
          options={LEVELS}
          selected={filters.levels}
          onToggle={(value) => setFilters((prev) => ({ ...prev, levels: updateList(prev.levels, value) }))}
        />
      </AccordionSection>

      <AccordionSection title="Điều kiện học thuật">
        <div className="space-y-4">
          <label className="block text-xs font-medium text-slate-600">
            GPA tối thiểu: <span className="font-bold text-slate-900">{filters.minGpa.toFixed(1)}</span>
            <input
              type="range"
              min={0}
              max={4}
              step={0.1}
              value={filters.minGpa}
              onChange={(event) => setFilters((prev) => ({ ...prev, minGpa: Number(event.target.value) }))}
              className="mt-2 w-full accent-blue-600"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            IELTS tối thiểu: <span className="font-bold text-slate-900">{filters.minIelts.toFixed(1)}</span>
            <input
              type="range"
              min={0}
              max={9}
              step={0.5}
              value={filters.minIelts}
              onChange={(event) => setFilters((prev) => ({ ...prev, minIelts: Number(event.target.value) }))}
              className="mt-2 w-full accent-blue-600"
            />
          </label>
        </div>
      </AccordionSection>
    </aside>
  );
}

function ResultTabs({
  activeTab,
  onChange
}: {
  activeTab: ResultsTab;
  onChange: (tab: ResultsTab) => void;
}) {
  const tabs: Array<{ key: ResultsTab; label: string }> = [
    { key: 'scholarships', label: 'Học bổng' },
    { key: 'universities', label: 'Các trường đại học' },
    { key: 'programs', label: 'Chương trình' }
  ];

  return (
    <div className="flex max-w-full gap-4 overflow-x-auto pb-1 text-sm font-normal sm:gap-6 sm:text-base">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={
            activeTab === tab.key
              ? 'shrink-0 whitespace-nowrap border-b-2 border-blue-700 px-1 pb-3 font-bold text-blue-700'
              : 'shrink-0 whitespace-nowrap px-1 pb-3 text-slate-500 transition-colors hover:text-slate-800'
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ResultsToolbar({
  sortBy,
  setSortBy
}: {
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div className="flex items-center gap-4 self-start text-xs font-semibold text-slate-600 sm:self-auto">
      <button type="button" className="hover:text-blue-700">VND 🌐</button>
      <label className="relative flex items-center gap-1 pr-4 hover:text-blue-700">
        <span>Sắp xếp:</span>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="cursor-pointer appearance-none bg-transparent font-bold focus:outline-none"
        >
          <option value="default">Đề xuất</option>
          <option value="value_high">Học bổng cao nhất</option>
          <option value="rating_high">Đánh giá tốt nhất</option>
          <option value="deadline_near">Hạn nộp gần nhất</option>
          <option value="ielts_low">IELTS thấp nhất</option>
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-0 text-slate-400" />
      </label>
    </div>
  );
}

function ProgramResultCard({ program }: { program: ProgramResult }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF6FF] text-xs font-bold text-[#2072E1]">{program.initials}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{program.university} <span className="ml-1 text-xs text-amber-500">★</span> <span className="text-xs font-medium text-slate-600">{program.rating} ({program.reviews})</span></p>
            <p className="mt-1 text-xs text-slate-500">{program.location}</p>
          </div>
        </div>
        <button type="button" className="rounded-lg bg-[#F0F7FF] px-3 py-2 text-xs font-medium text-[#2072E1]">% Kiểm tra độ phù hợp</button>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{program.title} <span className="ml-2 rounded bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">{program.level}</span></h3>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{program.description}</p>
        </div>
        <Heart className="h-6 w-6 shrink-0 text-slate-400" strokeWidth={1.6} />
      </div>

      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-4">
        {[
          ['Cấp bằng', program.level], ['Thời lượng', program.duration], ['Học phí / năm', program.tuition], ['Kỳ nhập học', program.intake],
        ].map(([label, value]) => (
          <div key={label} className="border-b border-slate-200 p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {program.requirements.map((item) => <span key={item} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600">{item}</span>)}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-xs font-medium text-emerald-700">♙ {program.scholarships}</span>
        <button type="button" className="group inline-flex items-center gap-1 text-xs font-bold text-[#2072E1]">
          <span className="group-hover:underline">Xem chi tiết thông tin chương trình</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function ActiveFilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white py-1 pl-2.5 pr-1.5 text-xs font-medium text-slate-700 shadow-2xs">
      {label}
      <button type="button" onClick={onRemove} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
        <X size={12} />
      </button>
    </span>
  );
}

function ResultCard({
  scholarship,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
  onCheckFit
}: {
  scholarship: FilterScholarship;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onViewDetails: (scholarship: FilterScholarship) => void;
  onCheckFit: (scholarship: FilterScholarship) => void;
}) {
  return (
    <article className="relative rounded-md border border-slate-200 bg-white p-5 transition-all hover:shadow-md md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-blue-100 bg-blue-50 text-xs font-bold text-blue-800">
            {initials(scholarship.university)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-700">{scholarship.university}</span>
              <span className="text-xs font-semibold text-slate-800">{scholarship.rating.toFixed(1)}</span>
              <Star size={12} fill="currentColor" className="text-amber-500" />
              <span className="text-[10px] text-slate-400">({scholarship.reviewsCount})</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{scholarship.country}</p>
            {scholarship.isHot && <p className="mt-0.5 text-[10px] font-medium text-emerald-600">Thuộc top 0,5% toàn thế giới</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => onCheckFit(scholarship)} className="hidden rounded-sm bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 sm:flex">
            % Kiểm tra độ phù hợp
          </button>
          <button
            type="button"
            onClick={() => onToggleFavorite(scholarship.id)}
            className={`rounded-full p-1.5 transition-colors ${isFavorite ? 'text-rose-500' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            aria-label="Lưu học bổng"
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <h3 className="mt-4 text-base font-bold leading-snug text-slate-900 md:text-lg">
        {scholarship.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 md:text-sm">{scholarship.description}</p>

      <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-3 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-xs bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">{scholarship.level}</span>
          <span className="rounded-xs bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">Toàn thời gian</span>
          <span className="rounded-xs bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">Trong khuôn viên trường</span>
        </div>

        <div className="flex w-full items-center justify-between gap-4 text-xs md:w-auto md:justify-end">
          <div className="text-right font-medium text-slate-600">
            <span>{scholarship.duration}</span>
            <span className="mx-1.5">•</span>
            <span className="font-bold text-slate-900">{scholarship.financialSupportValue}</span>
          </div>
          <button type="button" onClick={() => onViewDetails(scholarship)} className="shrink-0 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700 hover:underline">
            Xem thông tin học bổng
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ScholarshipFilterPage({ searchRequest, onFeedback }: ScholarshipFilterPageProps) {
  const initialPageState = useMemo(() => filtersFromSearchParams(), []);
  const [filters, setFilters] = useState<FilterState>(initialPageState.filters);
  const [sortBy, setSortBy] = useState(initialPageState.sortBy);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem('scholarship_saved_ids');
    return stored ? JSON.parse(stored) : [];
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeResultsTab, setActiveResultsTab] = useState<ResultsTab>(initialPageState.activeTab);
  const [selectedScholarship, setSelectedScholarship] = useState<FilterScholarship | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;

  useEffect(() => {
    if (searchRequest) setFilters(searchRequestToFilters(searchRequest));
  }, [searchRequest]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeResultsTab, sortBy]);

  useEffect(() => {
    localStorage.setItem('scholarship_saved_ids', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const params = filtersToSearchParams(filters, activeResultsTab, sortBy);
    const query = params.toString();
    window.history.replaceState({}, '', `/hoc-bong${query ? `?${query}` : ''}`);
  }, [filters, activeResultsTab, sortBy]);

  const filteredScholarships = useMemo(() => {
    return FILTER_SCHOLARSHIPS.filter((scholarship) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const source = `${scholarship.title} ${scholarship.university} ${scholarship.country} ${scholarship.description} ${scholarship.fieldsOfStudy.join(' ')}`.toLowerCase();
        if (!source.includes(query)) return false;
      }
      if (filters.fieldsOfStudy.length && !scholarship.fieldsOfStudy.some((field) => filters.fieldsOfStudy.includes(field))) return false;
      if (filters.countries.length && !filters.countries.includes(scholarship.country)) return false;
      if (filters.financialSupportTypes.length && !filters.financialSupportTypes.includes(scholarship.financialSupportType)) return false;
      if (filters.levels.length && !filters.levels.includes(scholarship.level)) return false;
      if (filters.universities.length && !filters.universities.includes(scholarship.university)) return false;
      if (filters.durations.length && !filters.durations.includes(scholarship.duration)) return false;
      if (filters.minGpa > 0 && scholarship.gpaRequirement > filters.minGpa) return false;
      if (filters.minIelts > 0 && scholarship.ieltsRequirement > filters.minIelts) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'value_high') return b.financialValueNumeric - a.financialValueNumeric;
      if (sortBy === 'rating_high') return b.rating - a.rating;
      if (sortBy === 'deadline_near') return parseDate(a.deadline) - parseDate(b.deadline);
      if (sortBy === 'ielts_low') return a.ieltsRequirement - b.ieltsRequirement;
      return 0;
    });
  }, [filters, sortBy]);

  const activeFiltersCount =
    Number(Boolean(filters.searchQuery)) +
    Number(filters.minGpa > 0) +
    Number(filters.minIelts > 0) +
    filters.fieldsOfStudy.length +
    filters.countries.length +
    filters.financialSupportTypes.length +
    filters.levels.length +
    filters.universities.length +
    filters.durations.length;

  const pageCount = Math.max(1, Math.ceil(filteredScholarships.length / pageSize));
  const paginatedScholarships = filteredScholarships.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const removeFilterTag = (type: keyof FilterState, value?: string) => {
    setFilters((prev) => {
      if (type === 'searchQuery') return { ...prev, searchQuery: '' };
      if (type === 'minGpa' || type === 'minIelts') return { ...prev, [type]: 0 };
      return { ...prev, [type]: (prev[type] as string[]).filter((item) => item !== value) };
    });
  };

  const supportLabel = (key: string) => FINANCIAL_SUPPORT_TYPES.find((item) => item.key === key)?.label || key;
  const totalScholarships = filteredScholarships.length;
  const categoryName = filters.fieldsOfStudy[0] || 'tất cả ngành học';
  const lastUpdated = new Intl.DateTimeFormat('vi-VN').format(new Date());

  return (
    <section className="min-h-[600px] bg-[#F0F1F3] py-8" id="integrated-scholarship-filter-page">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-sans text-[14px] font-semibold leading-[22px] tracking-normal text-[#263A4D]">
            Đang mở <span className="text-[#5FAFFF]">{totalScholarships > 0 ? totalScholarships.toLocaleString('vi-VN') : '0'}</span> học bổng ngành <span className="text-[#5FAFFF]">{categoryName}</span> [Cập nhật <span className="text-[#5FAFFF]">{lastUpdated}</span>]
          </h1>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
          <div className="hidden lg:col-span-1 lg:block">
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>

          <div className="space-y-6 lg:col-span-3">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200/50 bg-slate-100 p-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 lg:hidden"
                >
                  <SlidersHorizontal size={14} />
                  Bộ lọc
                  {activeFiltersCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                <ResultTabs activeTab={activeResultsTab} onChange={setActiveResultsTab} />
              </div>
              <ResultsToolbar sortBy={sortBy} setSortBy={setSortBy} />
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/40 bg-slate-100/60 p-3">
                <span className="mr-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <Filter size={12} />
                  Bộ lọc đang chọn:
                </span>
                {filters.searchQuery && <ActiveFilterTag label={`"${filters.searchQuery}"`} onRemove={() => removeFilterTag('searchQuery')} />}
                {filters.fieldsOfStudy.map((item) => <ActiveFilterTag key={item} label={item} onRemove={() => removeFilterTag('fieldsOfStudy', item)} />)}
                {filters.countries.map((item) => <ActiveFilterTag key={item} label={item} onRemove={() => removeFilterTag('countries', item)} />)}
                {filters.financialSupportTypes.map((item) => <ActiveFilterTag key={item} label={supportLabel(item)} onRemove={() => removeFilterTag('financialSupportTypes', item)} />)}
                {filters.levels.map((item) => <ActiveFilterTag key={item} label={item} onRemove={() => removeFilterTag('levels', item)} />)}
                {filters.universities.map((item) => <ActiveFilterTag key={item} label={item} onRemove={() => removeFilterTag('universities', item)} />)}
                {filters.durations.map((item) => <ActiveFilterTag key={item} label={item} onRemove={() => removeFilterTag('durations', item)} />)}
                {filters.minGpa > 0 && <ActiveFilterTag label={`GPA ≥ ${filters.minGpa.toFixed(1)}`} onRemove={() => removeFilterTag('minGpa')} />}
                {filters.minIelts > 0 && <ActiveFilterTag label={`IELTS ≥ ${filters.minIelts}`} onRemove={() => removeFilterTag('minIelts')} />}
                <button type="button" onClick={() => setFilters(emptyFilters)} className="ml-auto text-xs font-bold text-blue-600 hover:underline">
                  Xóa tất cả
                </button>
              </div>
            )}

            <div className="space-y-4">
              {activeResultsTab === 'universities' ? (
                UNIVERSITY_RESULTS.map((university) => (
                  <UniversityCard key={university.universityName} {...university} />
                ))
              ) : activeResultsTab === 'programs' ? (
                PROGRAM_RESULTS.map((program) => <ProgramResultCard key={program.id} program={program} />)
              ) : filteredScholarships.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-12 text-center shadow-xs">
                  <Search className="mb-3 h-12 w-12 text-slate-300" />
                  <h3 className="text-base font-bold text-slate-800">Không tìm thấy học bổng phù hợp</h3>
                  <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-400">
                    Vui lòng tinh chỉnh lại từ khóa hoặc xóa lọc để hiển thị danh sách học bổng.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilters(emptyFilters)}
                    className="mt-5 rounded-lg bg-[#2C6EAF] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#1E5084]"
                  >
                    Xóa toàn bộ bộ lọc
                  </button>
                </div>
              ) : (
                paginatedScholarships.map((scholarship) => (
                  <ResultCard
                    key={scholarship.id}
                    scholarship={scholarship}
                    isFavorite={favorites.includes(scholarship.id)}
                    onToggleFavorite={(id) =>
                      setFavorites((prev) => {
                        const isSaved = prev.includes(id);
                        onFeedback?.(isSaved ? 'Đã bỏ lưu học bổng.' : 'Đã lưu học bổng vào danh sách quan tâm.');
                        return isSaved ? prev.filter((item) => item !== id) : [...prev, id];
                      })
                    }
                    onViewDetails={setSelectedScholarship}
                    onCheckFit={(scholarship) => onFeedback?.(`Bạn có thể bắt đầu kiểm tra độ phù hợp cho “${scholarship.title}”.`)}
                  />
                ))
              )}
            </div>

            {activeResultsTab === 'scholarships' && pageCount > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-slate-200 pb-8 pt-6">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${page === currentPage ? 'bg-[#2C6EAF] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {page}
                </button>
              ))}
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">
                <ChevronRight size={16} />
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[86vw] max-w-sm overflow-y-auto bg-slate-50 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Bộ lọc</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>
        </div>
      )}

      {selectedScholarship && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="scholarship-detail-title">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#2072E1]">{selectedScholarship.university} · {selectedScholarship.country}</p>
                <h2 id="scholarship-detail-title" className="mt-2 text-xl font-bold text-slate-900">{selectedScholarship.title}</h2>
              </div>
              <button type="button" onClick={() => setSelectedScholarship(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng chi tiết học bổng"><X size={20} /></button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{selectedScholarship.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div><dt className="text-slate-500">Hạn nộp</dt><dd className="mt-1 font-semibold text-slate-900">{selectedScholarship.deadline}</dd></div>
              <div><dt className="text-slate-500">Hỗ trợ</dt><dd className="mt-1 font-semibold text-slate-900">{selectedScholarship.financialSupportValue}</dd></div>
              <div><dt className="text-slate-500">GPA tối thiểu</dt><dd className="mt-1 font-semibold text-slate-900">{selectedScholarship.gpaRequirement.toFixed(1)}/4.0</dd></div>
              <div><dt className="text-slate-500">IELTS tối thiểu</dt><dd className="mt-1 font-semibold text-slate-900">{selectedScholarship.ieltsRequirement}</dd></div>
            </dl>
            <button type="button" onClick={() => { setSelectedScholarship(null); onFeedback?.('Đã mở luồng chuẩn bị hồ sơ cho học bổng này.'); }} className="mt-5 w-full rounded-lg bg-[#2072E1] px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">Chuẩn bị hồ sơ</button>
          </div>
        </div>
      )}
    </section>
  );
}
