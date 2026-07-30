# Báo cáo triển khai Trung tâm cấu hình TopScholar

Cập nhật: 27/07/2026

## 1. Phạm vi đã triển khai

- 11 nhóm cấu hình.
- 200 tham số có metadata thống nhất: key, nhãn, nhóm, kiểu dữ liệu, mặc định, giới hạn và mức P0/P1/P2.
- Trang tổng quan: `/admin/settings`.
- Route chi tiết:

| Nhóm | Route | Số tham số |
|---|---|---:|
| Thương hiệu & pháp lý | `/admin/settings/general` | 26 |
| Bản địa hóa | `/admin/settings/localization` | 12 |
| Tài khoản & đăng ký | `/admin/settings/accounts` | 16 |
| Bảo mật & phiên | `/admin/settings/security` | 26 |
| Tải lên & lưu trữ | `/admin/settings/storage` | 23 |
| Học bổng & kiểm duyệt | `/admin/settings/scholarships` | 22 |
| Hồ sơ ứng tuyển | `/admin/settings/applications` | 14 |
| Tổ chức & KYC | `/admin/settings/kyc` | 8 |
| Tư vấn & hỗ trợ | `/admin/settings/support` | 10 |
| Email & thông báo | `/admin/settings/notifications` | 24 |
| SEO & Analytics | `/admin/settings/seo` | 19 |

## 2. Backend

### API

- `GET /api/v1/admin/settings/system?group={group}`
  - Trả giá trị typed theo nhóm.
  - Tự bổ sung mặc định cho key chưa lưu.
  - Không trả nội dung secret.
  - Trả `secretConfigured` để UI biết secret đã tồn tại.
- `PUT /api/v1/admin/settings/system`
  - Chỉ nhận key có trong catalog.
  - Kiểm tra kiểu, min/max, email, URL, màu, select, list và JSON.
  - Chỉ cập nhật các trường bị thay đổi.
  - Hỗ trợ xóa secret có chủ đích qua `clearSecrets`.
  - Ghi `ADMIN_SETTINGS_UPDATED` vào AuditLog.
  - Xóa cache Redis `settings:all`.
- `POST /api/v1/admin/settings/system/test-email`
  - Gửi email kiểm tra qua cấu hình runtime.
  - Chỉ ghi domain người nhận vào AuditLog, không ghi đầy đủ địa chỉ.

### Bảo mật

- Endpoint dùng `settings.write`; guard admin mặc định đóng vẫn có hiệu lực.
- Secret không được trả về frontend.
- Secret lưu bằng AES-256-GCM, định dạng `enc:v1`.
- Production bắt buộc có `SETTINGS_ENCRYPTION_KEY`.
- Development có thể fallback sang `AUDIT_HMAC_SECRET` để không chặn môi trường local.
- Key lạ và giá trị sai kiểu trả HTTP 400 kèm lỗi theo field.

## 3. Giao diện

- Trang hub hiển thị số tham số và số P0 của từng nhóm.
- Điều hướng nhanh giữa 11 nhóm.
- Chia card theo P0/P1/P2.
- Component nhập tự sinh theo metadata:
  - text, textarea, number;
  - boolean;
  - select;
  - list mỗi dòng;
  - JSON editor;
  - email, URL, color;
  - secret có trạng thái `Đã cấu hình`, hỗ trợ thay thế/xóa.
- Chỉ bật nút Lưu khi có thay đổi.
- Chặn lưu nếu JSON hoặc kiểu dữ liệu không hợp lệ.
- Toast thành công/thất bại.
- Trang Email & thông báo có nút gửi email kiểm tra.

## 4. Cấu hình đã được nối vào runtime

| Cấu hình | Hành vi runtime |
|---|---|
| `registration.enabled` | Tắt đăng ký mới tại API |
| `login.maxFailures`, `login.lockMinutes` | Điều khiển khóa đăng nhập qua Redis |
| `cors.origins` | Được đọc khi API khởi động |
| `signedUrl.downloadTtlSeconds` | Điều khiển TTL URL tải tài liệu |
| `mail.*` | SMTP, sender, reply-to, BCC, credential mã hóa |
| `mail.sandboxEnabled`, `mail.sandboxRecipient` | Redirect email staging, thêm nhãn SANDBOX |
| `scholarship.warningYellowHours`, `scholarship.warningRedHours` | Dashboard và màu SLA danh sách kiểm duyệt |
| `scholarship.reviewChecklist` | Checklist kiểm duyệt lấy từ cấu hình |
| `scholarship.maxFeatured` | Backend chặn vượt số học bổng nổi bật |

## 5. Phần mới là control-plane, chưa có enforcement đầy đủ

Các tham số sau đã lưu/validate/hiển thị đầy đủ nhưng nghiệp vụ tương ứng cần sprint riêng để áp dụng hoàn toàn:

- 2FA bắt buộc theo role, recovery code và step-up authentication.
- Lịch sử mật khẩu, HIBP, idle timeout và giới hạn phiên đồng thời.
- Antivirus/magic bytes, quota, watermark và xử lý ảnh.
- Tiêu chí tổ chức tin cậy, auto-assign và escalation.
- Hạn mức hồ sơ, deadline reminder array, plagiarism và GPA conversion.
- KYC document policy, tái xác minh và risk score.
- SLA support theo giờ làm việc, auto-assign và CSAT.
- Notification channel matrix ngoài email.
- Xuất `robots.txt`, sitemap, canonical và analytics sang frontend public.

Không ghi nhận các mục này là đã bảo vệ nghiệp vụ chỉ vì đã có trường cấu hình.

## 6. Kiểm thử

- Shared catalog build: PASS.
- API build/lint: PASS.
- Admin typecheck/lint/build: PASS; còn 3 cảnh báo `<img>` có sẵn, không chặn build.
- Jest: 29/29 PASS, 6 test suite.
- Test mới cho settings:
  - trả default theo nhóm;
  - chặn key lạ/giá trị sai kiểu;
  - lưu typed value;
  - mã hóa và che secret;
  - xóa secret an toàn.
- HTTP thật:
  - đăng nhập SUPER_ADMIN: PASS;
  - GET đủ 11/11 nhóm: PASS;
  - tổng số trường trả về: 200/200, đúng số lượng catalog;
  - PUT và đọc lại: PASS;
  - key lạ: HTTP 400;
  - secret trả về rỗng: PASS;
  - 11/11 route `/admin/settings/{group}`: HTTP 200;
  - endpoint gửi email thử: PASS;
  - MailHog nhận email thử: PASS.

### Giới hạn xác minh

- Đã xác minh bằng production build, HTTP session thật, PostgreSQL/Redis/MailHog local thật.
- Không ghi nhận kiểm thử tương tác trực quan bằng browser automation: connector trình duyệt local lỗi khởi tạo runtime (`failed to write kernel assets`, OS error 3).
- Lỗi connector không ảnh hưởng kết quả build và HTTP, nhưng thao tác nhập/lưu từng control trên Chrome vẫn nên được thực hiện thêm khi connector hoạt động lại.

## 7. File chính

- `packages/shared/src/system-settings.ts`
- `apps/api/src/infrastructure/settings/system-settings.service.ts`
- `apps/api/src/infrastructure/settings/settings.module.ts`
- `apps/api/src/infrastructure/settings/system-settings.service.spec.ts`
- `apps/api/src/modules/admin/admin-operations.controller.ts`
- `apps/admin/src/features/settings/system-settings-workspace.tsx`
- `apps/admin/src/app/admin/settings/[section]/page.tsx`

## 8. Biến môi trường

```env
SETTINGS_ENCRYPTION_KEY=<ít nhất 32 byte ngẫu nhiên>
```

Tạo bằng:

```bash
openssl rand -base64 32
```

## 9. Bố cục truy cập từ tài khoản

- Thẻ cuối sidebar hiển thị tài khoản quản trị thật: avatar, tên/email và vai trò.
- Bấm thẻ tài khoản mở cửa sổ cài đặt ngay trên trang hiện tại.
- Mục `Cài đặt` trong menu tài khoản trên topbar mở cùng cửa sổ.
- Cửa sổ cài đặt dùng bố cục:
  - danh mục cấu hình ở cột trái;
  - nội dung và nút lưu ở cột phải;
  - danh mục chuyển thành thanh cuộn ngang trên màn hình nhỏ.
- Các route `/admin/settings` và `/admin/settings/{group}` cũng dùng bố cục hai cột:
  - sidebar 260px ở desktop;
  - active item dùng nền primary nhạt và chữ primary;
  - sidebar cuộn độc lập khi danh mục dài;
  - mobile dùng menu ngang cuộn gọn phía trên content;
  - lỗi tải dữ liệu chỉ hiển thị trong content, không chiếm sidebar.
- Đã bỏ `Cấu hình nền tảng` và `Tài khoản của tôi` khỏi menu điều hướng chính để tránh trùng điểm truy cập.
- Các URL `/admin/settings/*` cũ vẫn được giữ để tương thích với bookmark và liên kết trực tiếp.
