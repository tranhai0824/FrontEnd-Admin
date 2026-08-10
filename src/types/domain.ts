export type UserRole = "candidate" | "partner" | "admin";

export type EntityStatus = "active" | "inactive" | "pending" | "blocked";
export type ScholarshipStatus = "draft" | "pending" | "published" | "closed" | "rejected";
export type ApplicationStatus = "submitted" | "reviewing" | "shortlisted" | "accepted" | "rejected";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type PartnerType = "university" | "business" | "organization";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: EntityStatus;
  joinedAt: string;
  lastActiveAt: string;
}

export interface PartnerRecord {
  id: string;
  name: string;
  type: PartnerType;
  contactName: string;
  email: string;
  status: EntityStatus;
  scholarships: number;
  joinedAt: string;
}

export interface ScholarshipRecord {
  id: string;
  title: string;
  partnerName: string;
  type: "full" | "partial" | "grant";
  status: ScholarshipStatus;
  applications: number;
  amount: number;
  deadline: string;
  createdAt: string;
}

export interface ApplicationRecord {
  id: string;
  candidateName: string;
  candidateEmail: string;
  scholarshipTitle: string;
  status: ApplicationStatus;
  submittedAt: string;
  score: number;
}

export interface PaymentRecord {
  id: string;
  reference: string;
  partnerName: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface DashboardStats {
  candidates: number;
  partners: number;
  scholarships: number;
  applications: number;
  revenue: number;
  pendingReviews: number;
}

export interface TrendPoint {
  month: string;
  applications: number;
  scholarships: number;
}

export interface DistributionPoint {
  name: string;
  value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  growth: Record<keyof DashboardStats, number>;
  trend: TrendPoint[];
  scholarshipDistribution: DistributionPoint[];
  recentApplications: ApplicationRecord[];
  pendingPartners: PartnerRecord[];
}

export interface EventRecord {
  id: string;
  title: string;
  organizer: string;
  startsAt: string;
  registrations: number;
  status: "scheduled" | "live" | "completed";
}

export interface NotificationRecord {
  id: string;
  title: string;
  audience: "all" | "candidate" | "partner";
  channel: "email" | "in_app" | "both";
  status: "draft" | "scheduled" | "sent";
  sentAt?: string;
}
