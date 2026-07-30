export interface Scholarship {
  id: string;
  title: string;
  partnerName: string;
  partnerLogo: string;
  description: string;
  majors: string[];
  level: string; // Bậc học: "Cử nhân" | "Thạc sĩ" | "Tiến sĩ" | "Khác"
  valueType: 'Full' | 'Partial'; // Loại học bổng: "Full" | "Partial"
  valueDetail: string;
  region: string; // Khu vực: "Châu Á" | "Châu Âu" | "Châu Mỹ" | "Châu Úc" | "Trong nước"
  deadline: string; // Định dạng YYYY-MM-DD
  isPopular: boolean;
  isNew: boolean;
  criteria: string[];
  benefits: string[];
  steps: string[];
}

export interface FilterState {
  keyword: string;
  majors: string[];
  levels: string[];
  valueType: 'All' | 'Full' | 'Partial';
  region: string;
  deadlineBefore: string;
}

export interface ApplicationForm {
  fullName: string;
  email: string;
  phone: string;
  gpa: string;
  ielts: string;
  statementOfPurpose: string;
  cvFileName: string;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  scholarshipId?: string;
}
