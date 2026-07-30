# TopScholar — Tổng quan và tiến trình dự án

> Cập nhật: 26/07/2026  
> Thư mục dự án: `F:\Resources\AI_Projects\Test`  
> Trạng thái: Prototype chức năng / MVP đang phát triển

## 1. Tổng quan

TopScholar là nền tảng hỗ trợ người dùng Việt Nam tìm kiếm, lọc, lưu và nộp hồ sơ học bổng. Hệ thống dự kiến phục vụ ba nhóm:

- Ứng viên tìm kiếm và nộp học bổng.
- Tổ chức/đối tác đăng và quản lý chương trình.
- Quản trị viên quản lý người dùng, học bổng, hồ sơ và vận hành hệ thống.

## 2. Kiến trúc hiện tại

Dự án được tổ chức dạng monorepo:

- `apps/web`: Website người dùng, React 19 + Vite 6 + Tailwind CSS.
- `apps/admin`: Trang quản trị, Next.js 14 + React 18 + Tailwind + Radix UI.
- `apps/api`: Backend NestJS 10.
- `packages/database`: Prisma ORM + PostgreSQL.
- `packages/shared`: Mã/type dùng chung.
- `packages/config`: Cấu hình TypeScript, ESLint, Tailwind và Prettier dùng chung.

Hạ tầng backend đã chuẩn bị:

- PostgreSQL qua Prisma.
- Redis và BullMQ cho rate limit, OTP và hàng đợi.
- JWT/Passport cho xác thực.
- Argon2 cho băm mật khẩu.
- SMTP/Nodemailer cho email.
- S3-compatible storage cho file.
- Firebase Authentication cho đăng nhập bằng số điện thoại trên web.

## 3. Những phần đã có

### Website người dùng

- Trang chủ và giao diện responsive.
- Danh sách 24 học bổng mẫu.
- Tìm kiếm và bộ lọc học bổng.
- Thẻ học bổng, chi tiết học bổng và phân trang.
- Lưu học bổng trên trình duyệt.
- Form nộp hồ sơ học bổng.
- Trung tâm thông báo.
- Modal đăng nhập/đăng ký.
- Đăng nhập số điện thoại bằng Firebase Phone Auth và reCAPTCHA.
- Xử lý OTP kiểm thử Firebase.
- Build production thành công.

### Trang quản trị

- Dashboard tổng quan và biểu đồ.
- Quản lý người dùng.
- Quản lý học bổng.
- Quản lý hồ sơ ứng tuyển.
- Quản lý thanh toán.
- Trang cài đặt.
- Layout, sidebar, topbar, dark mode và bộ UI component.

### Backend/API

- Khung NestJS và cấu hình môi trường.
- Module đăng ký tài khoản được triển khai tương đối sâu.
- Kiểm tra dữ liệu đăng ký.
- Rate limit theo IP/tài khoản.
- OTP, resend throttle và giới hạn số lần nhập.
- Băm mật khẩu Argon2.
- Redis lưu trạng thái đăng ký.
- Queue gửi OTP.
- Audit log có che thông tin nhạy cảm.
- Test cho dịch vụ đăng ký.
- Khung module cho users, scholarships, applications, organizations, consulting, notifications, files và admin.

### Cơ sở dữ liệu

Đã có các model:

- `User`
- `RefreshToken`
- `AuditLog`
- `SystemSetting`

Đã có role:

- `CANDIDATE`
- `BUSINESS`
- `ADMIN`

## 4. Trạng thái tích hợp Firebase

- Các biến `VITE_FIREBASE_*` đã được cấu hình.
- `apps/web` đã được sửa để đọc `.env.local` từ thư mục gốc monorepo.
- Phone Authentication đã bật.
- Việt Nam đã được thêm vào chính sách khu vực SMS.
- Số điện thoại kiểm thử `+84 986 365 758` dùng OTP cố định `320812`; Firebase không gửi SMS thật cho số kiểm thử.
- Đã sửa lỗi reCAPTCHA bị render nhiều lần.

Lưu ý:

- Cần dùng domain HTTPS hợp lệ khi triển khai thật.
- Cần kiểm tra hạn mức/chi phí trước khi gửi SMS thật.
- Không được giữ OTP demo hoặc số kiểm thử trong luồng production.

## 5. Phần còn thiếu hoặc chưa kết nối

### Website

- Danh sách học bổng vẫn lấy từ mock data/localStorage.
- Lưu học bổng và nộp hồ sơ chưa đồng bộ database.
- Đăng nhập email/mật khẩu hiện chủ yếu là giao diện/demo.
- Hồ sơ cá nhân và cài đặt tài khoản còn placeholder.
- Chưa có session thống nhất giữa Firebase và backend.
- Chưa có upload tài liệu thật.

### Admin

- Các màn hình đang dùng mock data.
- Thao tác tạo/sửa/xóa chưa gọi backend thật.
- Chưa có đăng nhập và phân quyền admin hoàn chỉnh.

### Backend

- Ngoài `auth.controller`, các domain module chủ yếu mới là module rỗng.
- Chưa có API CRUD học bổng.
- Chưa có API hồ sơ ứng tuyển.
- Chưa có API tổ chức/đối tác.
- Chưa có API thông báo, tư vấn, file và admin.
- Chưa có luồng đăng nhập/refresh/logout hoàn chỉnh được kết nối với frontend.

### Database

Chưa có model cho:

- Scholarship
- Organization/University
- Application
- SavedScholarship
- Document/File
- Notification
- ConsultingRequest
- Payment

Chưa thấy migration/seed hoàn chỉnh cho dữ liệu nghiệp vụ.

### Vận hành

- Chưa có môi trường deploy production được xác nhận.
- Chưa có CI/CD.
- Chưa có test end-to-end.
- Chưa có monitoring/logging production.
- Thư mục hiện tại chưa phải Git repository.

## 6. Ước tính tiến độ

Các tỷ lệ dưới đây là ước tính theo mã nguồn hiện có, không phải số liệu sprint:

| Hạng mục | Tiến độ ước tính | Nhận xét |
|---|---:|---|
| UI website | 75% | Giao diện và luồng demo khá đầy đủ |
| Firebase Phone Auth | 85% | Test number hoạt động sau khi hoàn tất cấu hình; cần kiểm tra production |
| UI admin | 70% | Nhiều màn hình hoàn chỉnh nhưng dùng mock data |
| Backend authentication | 55% | Đăng ký/OTP tốt; login, refresh và tích hợp frontend còn thiếu |
| Backend nghiệp vụ | 10% | Phần lớn module mới là khung |
| Database nghiệp vụ | 20% | Mới có user, token, audit và setting |
| Tích hợp frontend–backend | 15% | Chưa thay mock data bằng API thật |
| Kiểm thử và vận hành | 15% | Có unit test auth; thiếu E2E, CI/CD và monitoring |
| **MVP tổng thể** | **khoảng 40%** | Prototype tốt, chưa sẵn sàng production |

## 7. Rủi ro chính

1. Giao diện tạo cảm giác gần hoàn chỉnh nhưng dữ liệu và thao tác chính vẫn là mock.
2. Firebase Auth và hệ thống tài khoản NestJS/PostgreSQL chưa có chiến lược liên kết rõ ràng.
3. Schema database chưa bao phủ nghiệp vụ học bổng.
4. Các module backend rỗng có thể làm chậm giai đoạn tích hợp.
5. Chưa có migration, seed, CI/CD và E2E để bảo vệ chất lượng.
6. SMS thật có giới hạn, chính sách vùng và chi phí.

## 8. Kế hoạch ưu tiên đề xuất

### Giai đoạn 1 — Hoàn thiện nền tảng dữ liệu

- Thiết kế schema Scholarship, Organization, Application, SavedScholarship và File.
- Tạo migration và seed dữ liệu mẫu.
- Chuẩn hóa biến môi trường cho web, API, database, Redis, SMTP và storage.
- Khởi tạo Git repository và quy trình branch/commit.

### Giai đoạn 2 — Hoàn thiện xác thực

- Chọn một nguồn danh tính chính: Firebase hoặc auth backend.
- Nếu dùng Firebase Phone Auth, backend phải xác minh Firebase ID token và ánh xạ sang `User`.
- Hoàn thiện login, refresh token, logout và phân quyền.
- Bảo vệ route admin.
- Loại bỏ OTP demo khỏi production.

### Giai đoạn 3 — Xây API nghiệp vụ

- CRUD tổ chức/trường.
- CRUD học bổng.
- Lưu/bỏ lưu học bổng.
- Tạo và theo dõi hồ sơ ứng tuyển.
- Upload và quản lý tài liệu.
- Notification và audit log.

### Giai đoạn 4 — Kết nối giao diện

- Thay mock scholarships bằng API.
- Kết nối form nộp hồ sơ với database.
- Kết nối toàn bộ admin với API.
- Thêm loading, empty state, retry và error handling thống nhất.

### Giai đoạn 5 — Kiểm thử và triển khai

- Unit test cho service nghiệp vụ.
- Integration test cho API + PostgreSQL + Redis.
- E2E cho đăng nhập, tìm kiếm, lưu và nộp hồ sơ.
- Deploy web, admin, API, PostgreSQL, Redis và storage.
- Thiết lập HTTPS, domain Firebase, logging, backup và monitoring.

## 9. Milestone đề xuất

- **M1 — Data foundation:** schema nghiệp vụ, migration và seed.
- **M2 — Authentication complete:** đăng nhập, session, phân quyền và admin guard.
- **M3 — Scholarship API:** tổ chức + học bổng + tìm kiếm/lọc.
- **M4 — Application flow:** lưu học bổng, nộp hồ sơ và upload file.
- **M5 — Admin integration:** quản trị bằng dữ liệu thật.
- **M6 — Production readiness:** test, bảo mật, deploy và monitoring.

## 10. Việc nên làm ngay

1. Chốt kiến trúc xác thực Firebase ↔ backend.
2. Mở rộng Prisma schema cho nghiệp vụ học bổng.
3. Xây API scholarship và thay mock data ở website.
4. Bảo vệ admin bằng role `ADMIN`.
5. Thiết lập Git và tạo backlog theo các milestone ở trên.

