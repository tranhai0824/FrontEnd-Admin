# Báo cáo chức năng TopScholar Admin

> Cập nhật: 27/07/2026  
> Phạm vi: `apps/admin`, các API quản trị trong `apps/api` và schema hỗ trợ trong `packages/database`.  
> Admin local: `http://localhost:3001/admin`  
> Swagger: `http://localhost:4000/docs`

## 1. Tổng quan kỹ thuật

| Thành phần | Hiện trạng |
|---|---|
| Frontend admin | Next.js 14.2.35 App Router, React 18.3.1, TypeScript |
| Giao diện | Tailwind CSS, Radix UI, lucide-react, recharts |
| Màu chính | `#0866FF` cho light/dark mode |
| Data fetching | TanStack Query + API client dùng chung |
| Form | React Hook Form, Zod và validation phía API |
| Backend | NestJS 10 |
| Database | PostgreSQL + Prisma |
| Queue/cache | BullMQ + Redis |
| Email | Nodemailer thông qua `MailService` |
| Lưu trữ | S3-compatible, signed URL hạn ngắn |
| Tài liệu API | Swagger tại `/docs` |
| Migration hiện tại | 9 migration đã áp dụng |

Các file nền tảng:

- `apps/admin/src/lib/auth-client.ts`: đăng nhập, gọi API và tự refresh access token.
- `apps/admin/src/middleware.ts`: chuyển hướng UX từ `/admin/*` về `/login` khi thiếu refresh cookie.
- `apps/admin/src/components/shared/data-table.tsx`: bảng dùng chung.
- `packages/shared/src/permissions.ts`: vai trò và ma trận quyền.
- `apps/api/src/common/auth/permissions.guard.ts`: xác thực/phân quyền backend.
- `packages/database/prisma/schema.prisma`: schema dữ liệu.

## 2. Đăng nhập, phiên và bảo mật

### Chức năng

- Trang đăng nhập quản trị riêng tại `/login`.
- Đăng nhập bằng email/mật khẩu thật, mật khẩu kiểm tra bằng Argon2.
- Chỉ chấp nhận các vai trò quản trị:
  - `SUPER_ADMIN`
  - `ADMIN`
  - `MODERATOR`
  - `SUPPORT`
- Access token ngắn hạn.
- Refresh token lưu hash trong PostgreSQL và truyền bằng cookie `httpOnly`.
- Refresh token rotation trong Prisma transaction.
- Chặn tái sử dụng refresh token cũ và ghi AuditLog.
- Logout thu hồi refresh token thật.
- Rate limit đăng nhập và hash IP/email trước khi ghi audit.
- API client tự refresh khi request nhận HTTP 401.
- Middleware giữ URL đích bằng tham số `?next=`.
- Backend guard mặc định đóng endpoint `/api/v1/admin/*` nếu endpoint không khai quyền.
- Không đọc danh tính/vai trò từ `x-user-id` hoặc `x-user-role`.
- Không trả về `passwordHash`, token hash hoặc OTP.

### Quản lý bảo mật cá nhân

Tại `/admin/settings/profile`:

- Đổi mật khẩu.
- Đổi mật khẩu sẽ thu hồi các phiên cũ.
- Thiết lập, bật và tắt TOTP 2FA.
- Hiển thị QR thiết lập 2FA.
- Xem các phiên đang mở.
- Thu hồi từng phiên.
- Xem lịch sử đăng nhập.

## 3. Vai trò và phân quyền

| Vai trò | Phạm vi chính |
|---|---|
| `SUPER_ADMIN` | Toàn bộ quyền, quản lý đội ngũ và xóa vĩnh viễn |
| `ADMIN` | Toàn bộ nghiệp vụ vận hành, không quản lý quyền cao nhất |
| `MODERATOR` | Dashboard, kiểm duyệt học bổng và KYC |
| `SUPPORT` | Dashboard, đọc user/hồ sơ, xử lý tư vấn và thông báo |

Các nhóm quyền backend:

- `dashboard.read`
- `admin.manage`
- `scholarship.approve`
- `scholarship.write`
- `user.read`
- `user.suspend`
- `user.delete`
- `organization.read`
- `organization.review`
- `application.read`
- `application.review`
- `settings.write`
- `consulting.reply`
- `content.manage`
- `notification.read`
- `trash.manage`
- `system.read`
- `report.manage`
- `audit.read`

## 4. DataTable dùng chung

`DataTable` hiện hỗ trợ:

- Loading skeleton.
- Empty state.
- Error state.
- Sort theo cột.
- Phân trang server-side.
- Hiển thị filter chip và xóa từng bộ lọc.
- Chọn từng dòng hoặc toàn bộ dòng đang hiển thị.
- Bulk action.
- Xuất CSV; nếu đang chọn dòng thì chỉ xuất các dòng được chọn.
- Footer tổng số bản ghi.
- Các màn hình chính ghi bộ lọc/phân trang vào URL để reload hoặc chia sẻ liên kết.

## 5. Dashboard vận hành

Route: `/admin`

### “Cần bạn xử lý”

Khối này được đặt trên KPI:

- Học bổng chờ duyệt.
- Học bổng chờ quá 24 giờ và 72 giờ.
- Đối tác chờ KYC.
- Ticket tư vấn chưa trả lời.
- Ticket quá SLA.
- Hồ sơ cần can thiệp.
- Job thất bại.
- Báo cáo vi phạm mới.
- Mỗi mục liên kết thẳng tới danh sách đã lọc.

### KPI và thống kê

- Bộ chọn 7/30/90 ngày.
- Khoảng ngày tùy chọn.
- Tổng người dùng và người dùng mới.
- Học bổng đang hiển thị.
- Hồ sơ nộp trong kỳ.
- Tổ chức đã xác minh.
- So sánh tăng/giảm với kỳ trước.
- Sparkline KPI.
- Biểu đồ người dùng mới theo ngày.
- Biểu đồ hồ sơ theo ngày.
- Phân bố hồ sơ theo trạng thái.
- Phân bố học bổng theo loại.
- Funnel: xem → lưu → bắt đầu nộp → nộp xong.
- Top học bổng theo lượt xem.
- Top học bổng theo số hồ sơ.
- Top tổ chức và tỷ lệ duyệt.
- Deadline trong 7 ngày tới.

Dữ liệu được tổng hợp bằng Prisma `count`, `groupBy` và SQL; không tải toàn bảng về frontend để tính.

## 6. Kiểm duyệt học bổng

Routes:

- `/admin/scholarships`
- `/admin/scholarships/[id]`

### Danh sách

- Tab theo trạng thái và số lượng thật.
- Tìm theo tiêu đề hoặc tổ chức.
- Phân trang/sort server-side.
- Hiển thị tổ chức và trạng thái xác minh.
- Loại, miền, giá trị, deadline, lượt xem, số hồ sơ.
- Ngày gửi duyệt và người kiểm duyệt.
- Cảnh báo SLA quá 24 giờ và 72 giờ.
- Chọn nhiều dòng.
- Duyệt/từ chối hàng loạt.

### Panel và chi tiết

- Xem trước nội dung học bổng.
- Checklist kiểm duyệt.
- So sánh phiên bản hiện tại với revision trước.
- Lịch sử kiểm duyệt/AuditLog.
- Danh sách hồ sơ đã nộp.
- Ghi chú nội bộ.

### Hành động

- Duyệt.
- Từ chối kèm lý do.
- Yêu cầu chỉnh sửa.
- Gỡ học bổng đã đăng.
- Sửa trực tiếp.
- Gán người kiểm duyệt.
- Ghim/bỏ ghim nổi bật.
- Phím `A` duyệt, `R` từ chối, `J/K` chuyển bản ghi, `Esc` đóng panel.
- Quyết định gửi email + notification và ghi AuditLog.

## 7. Đối tác và KYC

Routes:

- `/admin/partners`
- `/admin/partners/[id]`

### Chức năng

- Tab: chờ xác minh, đã xác minh, từ chối, yêu cầu bổ sung, đình chỉ.
- Tìm theo tên tổ chức hoặc mã số thuế.
- Hiển thị người đại diện, ngày gửi, số giấy tờ, số học bổng và người xử lý.
- Chi tiết tổ chức, website, thành viên, học bổng và lịch sử KYC.
- Ghi chú nội bộ.
- Cảnh báo trùng mã số thuế hoặc tên chuẩn hóa.
- Xem PDF/ảnh pháp lý ngay trong trang bằng signed URL.
- Phóng to và xoay ảnh.
- Duyệt.
- Từ chối kèm lý do.
- Yêu cầu bổ sung giấy tờ.
- Đình chỉ tổ chức và ẩn học bổng của tổ chức.
- Gửi email/notification và ghi AuditLog.
- Backend chặn tổ chức chưa xác minh đăng học bổng.

## 8. Người dùng

Routes:

- `/admin/users`
- `/admin/users/[id]`

### Danh sách

- Tìm email, tên, số điện thoại.
- Lọc vai trò, trạng thái và khoảng ngày.
- Sort/phân trang server-side.
- Chọn nhiều dòng và bulk action.
- Xuất CSV danh sách hiện tại.

### Chi tiết và hành động

- Thông tin tổng quan.
- Hồ sơ học tập.
- Hồ sơ ứng tuyển.
- Tổ chức liên quan.
- Phiên và lịch sử đăng nhập.
- Audit log liên quan.
- Ghi chú nội bộ.
- Khóa/mở tài khoản kèm lý do.
- Đổi vai trò.
- Buộc đăng xuất mọi phiên.
- Gửi lại email xác minh.
- Gửi link đặt lại mật khẩu.
- Xóa mềm.

### Ràng buộc an toàn

- Không tự khóa/xóa chính mình.
- Không tự hạ vai trò chính mình.
- Không xóa/hạ vai trò `SUPER_ADMIN` cuối cùng.
- Tách riêng quyền khóa và quyền xóa.
- Chỉ tài khoản đủ quyền được quản lý admin khác.

## 9. Hồ sơ ứng tuyển

Route: `/admin/applications`

- Tìm ứng viên hoặc học bổng.
- Lọc theo học bổng, tổ chức, trạng thái, ngày nộp và GPA.
- Phân trang server-side.
- Xem thông tin ứng viên và thư động lực.
- Xem tài liệu bằng signed URL.
- Timeline trạng thái với người thực hiện và thời gian.
- Admin đổi trạng thái phải nhập lý do.
- Thông báo cho ứng viên và đối tác khi trạng thái thay đổi.
- Ghi AuditLog.
- Cảnh báo nộp quá nhiều hồ sơ trong thời gian ngắn.
- Cảnh báo tài liệu trùng hash giữa các hồ sơ.

## 10. Tư vấn

Route: `/admin/consulting`

- Hàng đợi ticket server-side.
- Trạng thái: `OPEN`, `IN_PROGRESS`, `WAITING`, `RESOLVED`, `CLOSED`.
- Mức ưu tiên và SLA.
- Tìm kiếm và lọc.
- Gán ticket cho chính mình hoặc người khác.
- Thread tin nhắn hai chiều.
- Ghi chú nội bộ không gửi cho khách.
- Đổi trạng thái và mức ưu tiên.
- Mẫu trả lời sẵn, chèn bằng một lần bấm.
- Gửi email khi nhân viên trả lời.
- Ghi AuditLog.

## 11. CMS và nội dung

### Bài viết

Route: `/admin/content/posts`

- Danh sách bài viết và trạng thái.
- Tạo/sửa bài viết.
- Slug tiếng Việt không dấu.
- Tiêu đề, tóm tắt, nội dung, ảnh bìa, tags, danh mục.
- Rich-text: đậm, nghiêng, heading, danh sách, liên kết, ảnh, trích dẫn và code.
- Tự lưu bản nháp.
- Xem trước HTML.
- Xuất bản, lưu nháp, hẹn giờ hoặc lưu trữ.
- SEO title và SEO description.
- Mỗi lần sửa tạo revision trước khi cập nhật.

### Banner

Route: `/admin/content/banners`

- Ảnh desktop/mobile riêng.
- Liên kết.
- Bật/tắt.
- Khoảng thời gian hiển thị.
- Xem trước ảnh.
- Kéo-thả đổi thứ tự.
- Backend lưu thứ tự trong Prisma transaction.

### Học bổng nổi bật

Route: `/admin/content/featured`

- Chọn/bỏ chọn học bổng đã xuất bản.
- Kéo-thả đổi thứ tự ưu tiên.
- Lưu `featuredOrder` trong PostgreSQL.

### Trang tĩnh

Route: `/admin/content/pages`

- Sửa nội dung Giới thiệu, Liên hệ, FAQ, Điều khoản và Bảo mật.
- Trạng thái draft/published/archived.
- Nội dung lưu database, không hardcode trong frontend.

## 12. Cài đặt

### Danh mục

Route: `/admin/settings/taxonomies`

- Ngành học, miền, quốc gia, loại học bổng, loại tài liệu và bậc học.
- Quan hệ cha-con.
- Thêm/sửa/xóa.
- Đổi thứ tự.
- Gộp danh mục và chuyển tham chiếu trong transaction.
- Chặn xóa khi đang được dùng.
- Hiển thị số bản ghi đang sử dụng.
- Đồng bộ taxonomy `MAJOR` với model `Major`.

### Mẫu email

Route: `/admin/settings/emails`

- Sửa tiêu đề và nội dung.
- Hiển thị biến template được phép.
- Bật/tắt từng mẫu.
- Xem trước.
- Gửi thử tới email tùy chọn.
- Ghi lịch sử/AuditLog.

### Tham số hệ thống

Route: `/admin/settings/system`

- Giới hạn dung lượng file.
- Số tài liệu tối đa mỗi hồ sơ.
- Số ngày nhắc deadline.
- Bật/tắt đăng ký mới.
- Bật/tắt tự duyệt cho tổ chức tin cậy.
- Chế độ bảo trì và thông điệp.
- Lưu `SystemSetting`.
- Invalidate cache Redis khi thay đổi.

### Đội ngũ quản trị

Route: `/admin/settings/team`

- Mời quản trị viên qua email.
- Gán vai trò.
- Đổi vai trò.
- Thu hồi quyền.
- Xem lần hoạt động cuối.
- Hiển thị ma trận quyền.
- Chỉ `SUPER_ADMIN` có toàn quyền quản lý đội ngũ.

## 13. Audit log

Route: `/admin/audit-logs`

- Lọc người thực hiện.
- Lọc hành động.
- Lọc loại/mã thực thể.
- Lọc khoảng thời gian.
- Lọc IP hash.
- Xem metadata trước/sau.
- Xuất CSV.
- Hỗ trợ liên kết tới log đã lọc theo thực thể.
- API chỉ có `GET`; không có endpoint sửa hoặc xóa audit log.

## 14. Thông báo

Route: `/admin/notifications`

- Danh sách thông báo vận hành thật.
- Loại và mức ưu tiên.
- Đánh dấu từng thông báo đã đọc.
- Đọc tất cả.
- Badge chuông dùng số chưa đọc thật.
- Cấu hình nhận email theo từng loại thông báo.

## 15. Thùng rác

Route: `/admin/trash`

- Tập hợp bản ghi đã xóa mềm.
- Hỗ trợ user, tổ chức, học bổng, hồ sơ, ticket, bài viết và banner.
- Phục hồi.
- Xóa vĩnh viễn chỉ với quyền phù hợp.
- Ghi AuditLog cho phục hồi/xóa.
- Cron tự dọn bản ghi quá 90 ngày lúc 03:00 hàng ngày.

## 16. Báo cáo vi phạm

Route: `/admin/reports`

- Hàng đợi báo cáo từ người dùng.
- Hiển thị lý do, chi tiết, đối tượng, người báo và trạng thái.
- Gán người xử lý.
- Giải quyết hoặc bỏ qua.
- Ghi kết quả và AuditLog.

## 17. Hệ thống

### Health

Route: `/admin/system/health`

- Kiểm tra PostgreSQL và độ trễ.
- Kiểm tra Redis và độ trễ.
- Kiểm tra cấu hình object storage.
- Tổng dung lượng metadata tài liệu.
- Tổng số object/tài liệu.
- Phiên bản ứng dụng.
- Uptime.
- Tự làm mới mỗi 30 giây.

### Jobs

Route: `/admin/system/jobs`

- Số job waiting/active/failed/delayed/completed.
- Xem tên, trạng thái, số lần chạy và lỗi.
- Retry từng job hoặc nhiều job.
- Không trả payload OTP ra giao diện.
- Hiển thị cron dọn thùng rác.
- Hiển thị cron gửi báo cáo định kỳ.

### Email đã gửi

Route: `/admin/system/emails-sent`

- Người nhận, loại, tiêu đề, trạng thái và lỗi.
- Thời điểm gửi.
- Gửi lại email.
- Ghi trạng thái thành công/thất bại.

## 18. Analytics

Route: `/admin/analytics`

- Thống kê user theo vai trò.
- Học bổng theo trạng thái.
- Hồ sơ theo trạng thái.
- Cohort tháng đăng ký → đã nộp hồ sơ.
- Tỷ lệ chuyển đổi cohort.
- Tỷ lệ duyệt học bổng theo tổ chức.
- Top học bổng theo lượt xem, hồ sơ và lượt lưu.
- Nguồn traffic từ `AnalyticsEvent`.
- Xuất CSV.
- Tạo lịch báo cáo email:
  - Hàng ngày.
  - Hàng tuần.
  - Hàng tháng.
- Xóa lịch báo cáo.
- Cron mỗi giờ xử lý lịch đến hạn.
- Kết quả gửi được ghi vào sổ email.

## 19. Các model dữ liệu vận hành chính

- `User`
- `Profile`
- `Organization`
- `OrganizationMember`
- `OrganizationDocument`
- `Scholarship`
- `ScholarshipRevision`
- `Major`
- `ScholarshipMajor`
- `SavedScholarship`
- `Application`
- `ApplicationDocument`
- `ApplicationStatusHistory`
- `ConsultRequest`
- `ConsultMessage`
- `Post`
- `PostRevision`
- `Banner`
- `StaticPage`
- `Taxonomy`
- `SystemSetting`
- `EmailTemplate`
- `Notification`
- `NotificationPreference`
- `AdminNote`
- `AuditLog`
- `AbuseReport`
- `EmailDelivery`
- `AnalyticsEvent`
- `ReportSchedule`

## 20. Phần hoãn lại

- `/admin/payments` vẫn còn source code mock để dùng ở giai đoạn Monetization.
- Payments đã bị ẩn khỏi sidebar/navigation.
- Chat trực tiếp, A/B testing và gợi ý AI chưa triển khai theo đặc tả.

## 21. Trạng thái kiểm chứng gần nhất

| Kiểm tra | Kết quả |
|---|---|
| API build | PASS |
| API lint | PASS |
| API Jest | 24/24 PASS, 5 test suite |
| Admin typecheck | PASS |
| Admin lint/build | PASS; 31 route được sinh |
| Prisma | 9 migration, schema up to date |
| Seed PostgreSQL | PASS |
| PostgreSQL health | `up` |
| Redis health | `up` |
| Login production | PASS |
| Analytics production | PASS |
| Reorder banner/featured | PASS |
| Tạo/xóa lịch báo cáo | PASS |
| Admin HTTP | `200` |

### Giới hạn bằng chứng

- Chưa ghi nhận kiểm thử tương tác tự động bằng Chrome do browser connector của Codex lỗi hạ tầng `os error 3`.
- Đã thay bằng typecheck/build production và HTTP session/cookie thật trên PostgreSQL/Redis thật.
- Lint còn cảnh báo khuyến nghị thay một số thẻ `<img>` bằng `next/image`; cảnh báo không chặn build.

## 22. Tài khoản dev

```text
Email: tuanhai3224@gmail.com
Mật khẩu: Admin@123456
```

Không dùng tài khoản/mật khẩu seed này trong production.
