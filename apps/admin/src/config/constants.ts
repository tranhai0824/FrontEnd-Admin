import type {
  ApplicationStatus,
  EntityStatus,
  PaymentStatus,
  ScholarshipStatus,
} from "@/types/domain";

export const ENTITY_STATUS_LABELS: Record<EntityStatus, string> = {
  active: "Đang hoạt động",
  inactive: "Ngừng hoạt động",
  pending: "Chờ duyệt",
  blocked: "Đã khóa",
};

export const SCHOLARSHIP_STATUS_LABELS: Record<ScholarshipStatus, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  published: "Đang hiển thị",
  closed: "Đã đóng",
  rejected: "Từ chối",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Đã nộp",
  reviewing: "Đang xét duyệt",
  shortlisted: "Vào vòng trong",
  accepted: "Được nhận",
  rejected: "Từ chối",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Đã thanh toán",
  pending: "Đang xử lý",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
};

export const ROLE_LABELS = {
  admin: "Quản trị viên",
  candidate: "Ứng viên",
  partner: "Đối tác",
} as const;

