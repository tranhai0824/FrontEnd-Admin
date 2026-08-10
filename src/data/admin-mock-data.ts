import type {
  ApplicationRecord,
  DashboardData,
  PaymentRecord,
  ScholarshipRecord,
  UserRecord,
} from "@/types/domain";

const iso = (day: number) => new Date(`2026-07-${String(day).padStart(2, "0")}T08:30:00+07:00`).toISOString();

const candidateNames = [
  "Nguyễn Minh Anh",
  "Trần Quốc Bảo",
  "Lê Hoàng Yến",
  "Phạm Gia Huy",
  "Vũ Khánh Linh",
  "Đỗ Đức Minh",
  "Bùi Thanh Hà",
  "Ngô Tuấn Kiệt",
];

export const usersMock: UserRecord[] = Array.from({ length: 28 }, (_, index) => ({
  id: `USR-${String(index + 1).padStart(4, "0")}`,
  name: candidateNames[index % candidateNames.length],
  email: `${candidateNames[index % candidateNames.length].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll("đ", "d").replaceAll(" ", ".")}${index + 1}@example.vn`,
  role: index % 9 === 0 ? "admin" : index % 5 === 0 ? "partner" : "candidate",
  status: index % 11 === 0 ? "blocked" : index % 7 === 0 ? "pending" : "active",
  joinedAt: iso(((index * 3) % 9) + 1),
  lastActiveAt: iso((index % 9) + 1),
}));

const scholarshipNames = [
  "Ươm mầm tài năng công nghệ 2026",
  "Nữ sinh dẫn đầu tương lai",
  "Học giả trẻ nông nghiệp số",
  "Viettel Digital Talent",
  "Fulbright Future Leaders",
  "Tiếp sức đến trường",
];

const partnerNames = [
  "Học viện Nông nghiệp Việt Nam",
  "Đại học VinUni",
  "Tập đoàn Viettel",
  "Quỹ VietSeeds",
  "Đại học Fulbright Việt Nam",
  "Quỹ Vừ A Dính",
];

export const scholarshipsMock: ScholarshipRecord[] = Array.from({ length: 18 }, (_, index) => ({
  id: `SCH-${String(index + 1).padStart(4, "0")}`,
  title: scholarshipNames[index % scholarshipNames.length],
  partnerName: partnerNames[index % partnerNames.length],
  type: index % 3 === 0 ? "full" : index % 3 === 1 ? "partial" : "grant",
  status: index % 7 === 0 ? "draft" : index % 5 === 0 ? "pending" : index % 8 === 0 ? "closed" : "published",
  applications: 32 + index * 13,
  amount: 12_000_000 + index * 5_000_000,
  deadline: new Date(`2026-${index % 2 === 0 ? "08" : "09"}-${String((index % 20) + 5).padStart(2, "0")}T23:59:00+07:00`).toISOString(),
  createdAt: iso((index % 9) + 1),
}));

export const applicationsMock: ApplicationRecord[] = Array.from({ length: 22 }, (_, index) => ({
  id: `APP-${String(index + 1).padStart(4, "0")}`,
  candidateName: candidateNames[index % candidateNames.length],
  candidateEmail: `candidate${index + 1}@example.vn`,
  scholarshipTitle: scholarshipNames[index % scholarshipNames.length],
  status: (["submitted", "reviewing", "shortlisted", "accepted", "rejected"] as const)[index % 5],
  submittedAt: iso((index % 9) + 1),
  score: 68 + (index % 29),
}));

export const paymentsMock: PaymentRecord[] = Array.from({ length: 16 }, (_, index) => ({
  id: `PAY-${String(index + 1).padStart(4, "0")}`,
  reference: `INV-2026-${String(index + 101).padStart(4, "0")}`,
  partnerName: partnerNames[index % partnerNames.length],
  amount: 1_500_000 + index * 350_000,
  status: index % 9 === 0 ? "failed" : index % 5 === 0 ? "pending" : "paid",
  createdAt: iso((index % 9) + 1),
}));

export const dashboardMock: DashboardData = {
  stats: {
    candidates: 12_486,
    partners: 326,
    scholarships: 738,
    applications: 28_493,
    revenue: 1_842_500_000,
    pendingReviews: 47,
  },
  growth: {
    candidates: 12.4,
    partners: 7.8,
    scholarships: 9.6,
    applications: 18.2,
    revenue: 14.1,
    pendingReviews: -6.3,
  },
  trend: [
    { month: "T1", applications: 2700, scholarships: 72 },
    { month: "T2", applications: 3100, scholarships: 78 },
    { month: "T3", applications: 3600, scholarships: 91 },
    { month: "T4", applications: 4200, scholarships: 104 },
    { month: "T5", applications: 5100, scholarships: 118 },
    { month: "T6", applications: 5900, scholarships: 126 },
    { month: "T7", applications: 6400, scholarships: 149 },
  ],
  scholarshipDistribution: [
    { name: "Toàn phần", value: 32 },
    { name: "Bán phần", value: 43 },
    { name: "Trợ cấp", value: 25 },
  ],
  recentApplications: applicationsMock.slice(0, 5),
  pendingPartners: [],
};
