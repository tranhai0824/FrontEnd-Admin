import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
const DEV_PASSWORD = "Admin@123456";

async function upsertUser({ email, fullName, role }) {
  const passwordHash = await argon2.hash(DEV_PASSWORD, { type: argon2.argon2id });
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role,
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    update: {
      passwordHash,
      role,
      status: "ACTIVE",
      deletedAt: null,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, fullName },
    update: { fullName },
  });
  return user;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Không được chạy seed tài khoản mẫu trong production");
  }

  const admin = await upsertUser({
    email: "tuanhai3224@gmail.com",
    fullName: "Tuấn Hải",
    role: "SUPER_ADMIN",
  });
  const partner = await upsertUser({
    email: "partner@topscholar.local",
    fullName: "Đối tác mẫu",
    role: "PARTNER",
  });
  const candidate = await upsertUser({
    email: "candidate@topscholar.local",
    fullName: "Ứng viên mẫu",
    role: "CANDIDATE",
  });
  await prisma.refreshToken.updateMany({
    where: { userId: { in: [admin.id, partner.id, candidate.id] }, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await prisma.profile.update({
    where: { userId: candidate.id },
    data: { gpa: 3.65, educationLevel: "Đại học", country: "Việt Nam" },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "quy-hoc-bong-topscholar" },
    create: {
      name: "Quỹ học bổng TopScholar",
      normalizedName: "quy hoc bong topscholar",
      slug: "quy-hoc-bong-topscholar",
      type: "FOUNDATION",
      taxCode: "DEV-TOPSCHOLAR-001",
      website: "https://topscholar.local",
      representativeName: "Đối tác mẫu",
      verified: true,
      status: "VERIFIED",
      submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      verifiedAt: new Date(),
      reviewerId: admin.id,
    },
    update: {
      verified: true,
      status: "VERIFIED",
      deletedAt: null,
      reviewerId: admin.id,
    },
  });
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: partner.id } },
    create: { organizationId: organization.id, userId: partner.id, isOwner: true, role: "OWNER" },
    update: { isOwner: true, role: "OWNER" },
  });

  const scholarship = await prisma.scholarship.upsert({
    where: { slug: "hoc-bong-tai-nang-topscholar-2026" },
    create: {
      organizationId: organization.id,
      createdById: partner.id,
      title: "Học bổng Tài năng TopScholar 2026",
      slug: "hoc-bong-tai-nang-topscholar-2026",
      summary: "Hỗ trợ sinh viên có thành tích học tập và hoạt động cộng đồng nổi bật.",
      description: "<h2>Học bổng Tài năng</h2><p>Chương trình hỗ trợ toàn phần cho ứng viên xuất sắc.</p>",
      country: "Việt Nam",
      region: "Châu Á",
      field: "Công nghệ thông tin",
      degreeLevel: "Đại học",
      type: "FULL",
      amount: "100.000.000 VNĐ",
      eligibility: { minimumGpa: 3.2 },
      requiredDocuments: ["CV", "TRANSCRIPT"],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "PUBLISHED",
      submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      publishedAt: new Date(),
      reviewerId: admin.id,
      viewCount: 128,
      isFeatured: true,
      featuredOrder: 0,
    },
    update: {
      organizationId: organization.id,
      createdById: partner.id,
      status: "PUBLISHED",
      deletedAt: null,
      reviewerId: admin.id,
      isFeatured: true,
      featuredOrder: 0,
    },
  });

  await prisma.analyticsEvent.createMany({
    data: [
      {
        id: "00000000-0000-4000-8000-000000000201",
        userId: candidate.id,
        scholarshipId: scholarship.id,
        eventType: "SCHOLARSHIP_VIEW",
        source: "google",
        sessionId: "seed-session-google",
      },
      {
        id: "00000000-0000-4000-8000-000000000202",
        userId: candidate.id,
        scholarshipId: scholarship.id,
        eventType: "SCHOLARSHIP_SAVE",
        source: "direct",
        sessionId: "seed-session-direct",
      },
      {
        id: "00000000-0000-4000-8000-000000000203",
        userId: candidate.id,
        scholarshipId: scholarship.id,
        eventType: "APPLICATION_STARTED",
        source: "facebook",
        sessionId: "seed-session-facebook",
      },
      {
        id: "00000000-0000-4000-8000-000000000204",
        userId: candidate.id,
        scholarshipId: scholarship.id,
        eventType: "APPLICATION_SUBMITTED",
        source: "google",
        sessionId: "seed-session-google",
      },
    ],
    skipDuplicates: true,
  });

  const application = await prisma.application.upsert({
    where: { candidateId_scholarshipId: { candidateId: candidate.id, scholarshipId: scholarship.id } },
    create: {
      candidateId: candidate.id,
      scholarshipId: scholarship.id,
      status: "SUBMITTED",
      coverLetter: "Tôi mong muốn phát triển các sản phẩm giáo dục có tác động tích cực.",
      submittedAt: new Date(),
    },
    update: { deletedAt: null },
  });
  const history = await prisma.applicationStatusHistory.count({ where: { applicationId: application.id } });
  if (!history) {
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        changedById: candidate.id,
        note: "Dữ liệu mẫu Giai đoạn 2",
      },
    });
  }

  const taxonomies = [
    ["COUNTRY", "Việt Nam", "viet-nam"],
    ["REGION", "Châu Á", "chau-a"],
    ["SCHOLARSHIP_TYPE", "Toàn phần", "toan-phan"],
    ["DOCUMENT_TYPE", "Bảng điểm", "bang-diem"],
    ["EDUCATION_LEVEL", "Đại học", "dai-hoc"],
    ["MAJOR", "Công nghệ thông tin", "cong-nghe-thong-tin"],
  ];
  for (const [type, name, slug] of taxonomies) {
    await prisma.taxonomy.upsert({
      where: { type_slug: { type, slug } },
      create: { type, name, slug },
      update: { name, active: true },
    });
  }
  const major = await prisma.major.upsert({
    where: { slug: "cong-nghe-thong-tin" },
    create: { name: "Công nghệ thông tin", slug: "cong-nghe-thong-tin" },
    update: { name: "Công nghệ thông tin" },
  });
  await prisma.scholarshipMajor.upsert({
    where: { scholarshipId_majorId: { scholarshipId: scholarship.id, majorId: major.id } },
    create: { scholarshipId: scholarship.id, majorId: major.id },
    update: {},
  });

  await prisma.replyTemplate.upsert({
    where: { id: "00000000-0000-4000-8000-000000000101" },
    create: {
      id: "00000000-0000-4000-8000-000000000101",
      name: "Đã tiếp nhận",
      content: "TopScholar đã tiếp nhận yêu cầu của bạn và sẽ phản hồi trong thời gian sớm nhất.",
    },
    update: { active: true },
  });
  await prisma.emailTemplate.upsert({
    where: { key: "APPLICATION_STATUS_CHANGED" },
    create: {
      key: "APPLICATION_STATUS_CHANGED",
      subject: "Cập nhật hồ sơ {{scholarshipTitle}}",
      content: "Hồ sơ của bạn đã chuyển sang trạng thái {{status}}.",
      variables: ["scholarshipTitle", "status", "reason"],
    },
    update: {},
  });

  for (const [key, title, content] of [
    ["about", "Giới thiệu", "<h1>Về TopScholar</h1><p>Nền tảng kết nối cơ hội học bổng.</p>"],
    ["contact", "Liên hệ", "<h1>Liên hệ</h1><p>Hãy gửi yêu cầu tư vấn cho TopScholar.</p>"],
    ["faq", "Câu hỏi thường gặp", "<h1>FAQ</h1>"],
    ["terms", "Điều khoản", "<h1>Điều khoản sử dụng</h1>"],
    ["privacy", "Bảo mật", "<h1>Chính sách bảo mật</h1>"],
  ]) {
    await prisma.staticPage.upsert({
      where: { key },
      create: { key, title, content, status: "DRAFT" },
      update: {},
    });
  }
  await prisma.post.upsert({
    where: { slug: "huong-dan-san-hoc-bong" },
    create: {
      title: "Hướng dẫn săn học bổng hiệu quả",
      slug: "huong-dan-san-hoc-bong",
      excerpt: "Các bước chuẩn bị hồ sơ học bổng.",
      content: "<h2>Chuẩn bị sớm</h2><p>Xây dựng kế hoạch và hoàn thiện tài liệu theo từng mốc.</p>",
      tags: ["học bổng", "hướng dẫn"],
      category: "Cẩm nang",
      status: "DRAFT",
      authorId: admin.id,
    },
    update: {},
  });

  for (const [key, value] of [
    ["upload.maxFileSizeMb", "10"],
    ["application.maxDocuments", "10"],
    ["deadline.reminderDays", "7"],
    ["registration.enabled", "true"],
    ["scholarship.trustedAutoApprove", "false"],
    ["maintenance.enabled", "false"],
    ["maintenance.message", "\"Hệ thống đang bảo trì\""],
  ]) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }

  const consult = await prisma.consultRequest.findFirst({ where: { subject: "Tư vấn hồ sơ mẫu" } });
  if (!consult) {
    await prisma.consultRequest.create({
      data: {
        requesterId: candidate.id,
        subject: "Tư vấn hồ sơ mẫu",
        content: "Tôi cần hỗ trợ kiểm tra điều kiện học bổng.",
        scholarshipId: scholarship.id,
        priority: "NORMAL",
        slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: "SYSTEM",
      priority: "NORMAL",
      title: "Dữ liệu Giai đoạn 2 đã sẵn sàng",
      body: "Bạn có thể kiểm thử dashboard, hồ sơ, tư vấn và CMS bằng dữ liệu thật.",
      actionUrl: "/admin",
    },
  });

  console.log("Seed Giai đoạn 2 hoàn tất");
  console.log("Admin: tuanhai3224@gmail.com / Admin@123456");
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
