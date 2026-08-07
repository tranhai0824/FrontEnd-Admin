export interface ScholarshipItem {
  id: string;
  title: string;
  sponsorName: string;
  sponsorLogo: string;
  amount: string;
  deadline: string;
  field: string;
  location: string;
  level: string;
  sponsorType: string;
  isDuHoc: string;
  isFavorite?: boolean;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export function isExpiringSoon(dateString: string): boolean {
  try {
    const deadlineDate = new Date(dateString);
    const today = new Date();
    deadlineDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays < 14;
  } catch {
    return false;
  }
}

const VNUA_LOGO = '/images/Hoc_Vien_Nong_Nghiep_Viet_Nam.webp';
const VNUA_SPONSOR = 'Học viện Nông nghiệp Việt Nam';

const scholarshipSeed = [
  ['sch-vnua-01', 'Nông nghiệp công nghệ cao', 'Toàn phần', '2026-07-15'],
  ['sch-vnua-02', 'Nhà khoa học trẻ Nông nghiệp số', 'Toàn phần', '2026-07-22'],
  ['sch-vnua-03', 'Kỹ sư Nông nghiệp bền vững', 'Toàn phần', '2026-08-05'],
  ['sch-vnua-04', 'Đổi mới sáng tạo trong Chăn nuôi', 'Toàn phần', '2026-08-18'],
  ['sch-vnua-05', 'Công nghệ Sinh học ứng dụng', 'Toàn phần', '2026-09-01'],
  ['sch-vnua-06', 'Quản trị Chuỗi cung ứng Nông sản', 'Toàn phần', '2026-09-14'],
  ['sch-vnua-07', 'Bảo vệ thực vật thông minh', 'Toàn phần', '2026-09-28'],
  ['sch-vnua-08', 'Phát triển Nông thôn xanh', 'Toàn phần', '2026-10-12'],
  ['sch-vnua-09', 'Học tập ngành Khoa học cây trồng', '15 triệu', '2026-07-30'],
  ['sch-vnua-10', 'Học tập ngành Thú y', '20 triệu', '2026-08-08'],
  ['sch-vnua-11', 'Sinh viên ngành Công nghệ thực phẩm', '12 triệu', '2026-08-16'],
  ['sch-vnua-12', 'Ngành Kinh tế Nông nghiệp', '25 triệu', '2026-08-24'],
  ['sch-vnua-13', 'Nghiên cứu Sinh học phân tử', '18 triệu', '2026-09-03'],
  ['sch-vnua-14', 'Ngành Môi trường', '10 triệu', '2026-09-10'],
  ['sch-vnua-15', 'Ngành Quản lý đất đai', '30 triệu', '2026-09-18'],
  ['sch-vnua-16', 'Sinh viên ngành Cơ điện nông nghiệp', '14 triệu', '2026-09-26'],
  ['sch-vnua-17', 'Ngành Nuôi trồng thủy sản', '16 triệu', '2026-10-04'],
  ['sch-vnua-18', 'Ngành Công nghệ sau thu hoạch', '22 triệu', '2026-10-11'],
  ['sch-vnua-19', 'Ngành Khoa học đất', '11 triệu', '2026-10-19'],
  ['sch-vnua-20', 'Sáng tạo Nông nghiệp xanh', '28 triệu', '2026-10-27'],
  ['sch-vnua-21', 'Ngành Kỹ thuật tài nguyên nước', '13 triệu', '2026-11-05'],
  ['sch-vnua-22', 'Ngành Logistics Nông nghiệp', '24 triệu', '2026-11-13'],
  ['sch-vnua-23', 'Sinh viên ngành Công nghệ rau hoa quả', '17 triệu', '2026-11-21'],
  ['sch-vnua-24', 'Ngành Kinh doanh Nông nghiệp', '19 triệu', '2026-11-30']
] as const;

export const MOCK_SCHOLARSHIPS: ScholarshipItem[] = scholarshipSeed.map(
  ([id, title, amount, deadline], index) => ({
    id,
    title,
    sponsorName: VNUA_SPONSOR,
    sponsorLogo: VNUA_LOGO,
    amount,
    deadline,
    field: 'Nông nghiệp',
    location: 'Hà Nội',
    level: 'Đại học',
    sponsorType: 'Trường học',
    isDuHoc: 'Trong nước',
    isFavorite: index === 1 || index === 9
  })
);
