import { Scholarship } from '../types';

export const SCHOLARSHIPS_DATA: Scholarship[] = [
  {
    id: 'vnua-agritech-2026',
    title: 'Học bổng Toàn phần Ươm mầm Tài năng Nông nghiệp Công nghệ cao',
    partnerName: 'Học viện Nông nghiệp Việt Nam',
    partnerLogo: '/images/Hoc_Vien_Nong_Nghiep_Viet_Nam.webp',
    description: 'Học bổng dành cho sinh viên có định hướng học tập, nghiên cứu và phát triển trong lĩnh vực nông nghiệp công nghệ cao tại Học viện Nông nghiệp Việt Nam.',
    majors: ['Nông nghiệp'],
    level: 'Đại học',
    valueType: 'Full',
    valueDetail: 'Học bổng Toàn phần 100% học phí và khoản trợ cấp học tập theo chính sách chương trình.',
    region: 'Hà Nội',
    deadline: '2026-07-15',
    isPopular: true,
    isNew: true,
    criteria: [
      'Có thành tích học tập tốt và định hướng rõ ràng với ngành nông nghiệp công nghệ cao.',
      'Ưu tiên ứng viên có hoạt động nghiên cứu, dự án học thuật hoặc hoạt động cộng đồng liên quan.',
      'Hoàn thiện hồ sơ ứng tuyển theo yêu cầu của chương trình học bổng.'
    ],
    benefits: [
      'Tài trợ học phí theo diện học bổng toàn phần.',
      'Nhận khoản trợ cấp học tập và hỗ trợ phát triển năng lực chuyên môn.',
      'Có cơ hội tham gia các hoạt động nghiên cứu, thực tập và kết nối chuyên gia trong lĩnh vực nông nghiệp.'
    ],
    steps: [
      'Điền thông tin ứng tuyển học bổng trực tuyến.',
      'Tải lên hồ sơ học tập, CV và các minh chứng liên quan.',
      'Theo dõi kết quả xét duyệt từ Học viện Nông nghiệp Việt Nam.'
    ]
  }
];
