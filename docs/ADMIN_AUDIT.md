# Kiểm kê hiện trạng `apps/admin`

> Phạm vi: chỉ đọc code tại `F:/Resources/AI_Projects/Test/apps/admin`. Không sửa mã nguồn, không migration/seed. Kiểm tra ngày 26/07/2026.

## A — Tổng quan kỹ thuật

| Hạng mục | Kết quả và bằng chứng |
|---|---|
| Đường dẫn/package | `apps/admin`; package `@scholarship-platform/admin` — `apps/admin/package.json:2`. |
| Framework | Next.js `14.2.35`, App Router tại `src/app`; React `^18`, TypeScript `^5.8.3` — `apps/admin/package.json`, `apps/admin/src/app`. Không thấy `pages/`. |
| UI | Radix Avatar/Dialog/Dropdown/Label/Select/Separator/Tooltip; `class-variance-authority`, `clsx`, `tailwind-merge`; `lucide-react ^0.515.0` — `package.json`. |
| Bảng/chart/state/data/form/date | Không có thư viện bảng, form, validation, state, data-fetching hay date chuyên dụng. Chart dùng `recharts ^2.15.3`; state là React `useState/useMemo`; ngày dùng `Intl.DateTimeFormat` trong `src/lib/utils.ts`. |
| Khác | `next-themes`, React/DOM, TypeScript/types, ESLint, PostCSS, Tailwind và `tailwindcss-animate` — `package.json`. |
| Style/theme | Tailwind — `tailwind.config.ts`, `postcss.config.mjs`. CSS variables/token và `.dark` — `src/app/globals.css:5-55`; dark mode `class` — `tailwind.config.ts:4`. |
| Gọi dữ liệu | Không tìm thấy `fetch`, axios, SWR, React Query, server action hoặc API client trong `src`. Các feature import `@/data/admin-mock-data` — ví dụ `src/features/dashboard/dashboard-overview.tsx:9`, `src/features/users/user-management.tsx:40`. |
| State | Chỉ local React state (`useState`, `useMemo`); không có Context/Zustand/Redux store. `AppProviders` chỉ bọc theme/tooltip — `src/providers/app-providers.tsx`. |
| Environment | `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL` — `apps/admin/.env.example`. Không thấy `process.env` khác trong `src`. Giá trị secret không được in. |

### Kiểm tra lệnh

- Typecheck: **FAIL** (`exit 2`). Lỗi `TS2786` với icon Lucide `X`, `ChevronRight`, `Check`, `Circle`, `ChevronDown`, `ChevronUp` tại `src/components/ui/dialog.tsx:22`, `dropdown-menu.tsx:15,31,35`, `select.tsx:14,20,24,44`, `sheet.tsx:33`; thêm lỗi `React.ReactNode` tại `src/providers/app-providers.tsx:10`. Đây là lỗi type React/Lucide đang cài.
- Build: **FAIL** (`exit 1`) tại bước type-check với lỗi đầu tiên `src/components/ui/dialog.tsx:22` như trên.
- Lint: **PASS**, `next lint` trả `exit 0`, không có warning/error.
- Không chạy migration, seed hoặc lệnh ghi dữ liệu.

## B — Cây route/màn hình

| URL | File | Màn hình | Nguồn dữ liệu | Hoàn thiện | Ghi chú |
|---|---|---|---|---:|---|
| `/` | `src/app/page.tsx` | Redirect về `/admin` | Hardcode route | 100% | Không có UI riêng. |
| `/admin` | `src/app/admin/page.tsx` → `features/dashboard/dashboard-overview.tsx` | KPI, biểu đồ, hồ sơ gần đây, việc cần xử lý | **MOCK** (`dashboardMock`) | 60% UI | Không gọi backend; số liệu hardcode trong `src/data/admin-mock-data.ts:81`. |
| `/admin/users` | `src/app/admin/users/page.tsx` → `features/users/user-management.tsx` | Danh sách/lọc người dùng, dialog thêm, khóa/mở khóa UI | **MOCK** (`usersMock`) | 60% UI | Phân trang client-side; nút tạo chỉ đóng dialog. |
| `/admin/scholarships` | `src/app/admin/scholarships/page.tsx` → `features/scholarships/scholarship-management.tsx` | Danh sách/lọc/tạo học bổng UI | **MOCK** (`scholarshipsMock`) | 55% UI | Nút lưu chỉ đóng dialog; badge `18` là hardcode trong `navigation.ts`. |
| `/admin/applications` | `src/app/admin/applications/page.tsx` → `features/applications/application-management.tsx` | Lọc và bảng đơn ứng tuyển | **MOCK** (`applicationsMock`) | 50% UI | Xuất báo cáo/Xem chưa có logic. |
| `/admin/payments` | `src/app/admin/payments/page.tsx` → `features/payments/payment-management.tsx` | KPI và bảng giao dịch | **MOCK** (`paymentsMock`) | 45% UI | Backend payment không được admin gọi; nút chi tiết/xuất chưa có logic. |
| `/admin/settings` | `src/app/admin/settings/page.tsx` → `features/settings/settings-page.tsx` | Khung cài đặt | **HARDCODE/khung** | 30% UI | Không thấy gọi API/lưu dữ liệu. |

### Link chết

- Trong `src/config/navigation.ts`, các href hiện có (`/admin`, `/admin/users`, `/admin/scholarships`, `/admin/applications`, `/admin/payments`, `/admin/settings`) đều có file route tương ứng.
- Không có mục `/partners`, `/consulting`, `/content`, `/audit-logs` trong sidebar hiện tại; vì vậy không phải link chết nhưng là màn hình yêu cầu chưa có trong menu/app.

## C — Kiểm kê component

### Component dùng chung

| Component | File | Chức năng | Dùng ở | Props type |
|---|---|---|---|---|
| `AdminShell` | `src/components/layout/admin-shell.tsx` | Khung sidebar/topbar, mobile sheet | Admin layout | Có interface props rõ ràng |
| `SidebarContent` | `src/components/layout/sidebar-content.tsx` | Điều hướng/thu gọn sidebar | `AdminShell` | Có |
| `Topbar` | `src/components/layout/topbar.tsx` | Tìm kiếm, thông báo, account menu | `AdminShell` | Có |
| `PageHeader` | `src/components/shared/page-header.tsx` | Tiêu đề/mô tả/action | Các feature | Có |
| `StatusBadge` | `src/components/shared/status-badge.tsx` | Nhãn trạng thái | users/scholarships/applications/payments | Có |
| `TableToolbar` | `src/components/shared/table-toolbar.tsx` | Ô tìm kiếm + filter trạng thái | Có file, mức dùng hạn chế | Có |
| `Brand`, `ThemeToggle` | `src/components/layout/brand.tsx`, `theme-toggle.tsx` | Nhận diện/chuyển theme | Layout | Có |

### Component theo tính năng

- Dashboard: `DashboardOverview`, `StatCard`, `TrendChart`, `DistributionChart` — `src/features/dashboard/*`.
- Users: `UserManagement` — `src/features/users/user-management.tsx`.
- Scholarships: `ScholarshipManagement` — `src/features/scholarships/scholarship-management.tsx`.
- Applications: `ApplicationManagement` — `src/features/applications/application-management.tsx`.
- Payments: `PaymentManagement` — `src/features/payments/payment-management.tsx`.
- Settings: `SettingsPage` — `src/features/settings/settings-page.tsx`.

### Primitive UI

| Primitive | Trạng thái | Bằng chứng |
|---|---|---|
| Button/Input/Select/Dialog/Badge/Card/Dropdown/Sheet/Skeleton/Textarea/Avatar/Tooltip/Label/Separator | Có | `src/components/ui/*.tsx` |
| Table | Có nhưng sơ sài | `src/components/ui/table.tsx`; không có sort/filter/server pagination/selection. |
| Tabs/Pagination | Không có primitive riêng | Chỉ nút phân trang thủ công trong `user-management.tsx:105`. |
| Toast/DatePicker/FileUpload/EmptyState/Breadcrumb/Chart | Chart có; còn lại không có primitive riêng | Chart ở `features/dashboard`; không tìm thấy file primitive tương ứng. |
| Sidebar | Có nhưng là component layout, không primitive UI | `src/components/layout/sidebar-content.tsx`. |

### DataTable dùng chung và trùng lặp

- Không có DataTable dùng chung. Mỗi feature tự dựng `<Table>` và tự lọc bằng `useMemo`.
- Có phân trang client-side chỉ ở users; không server-side, không chọn nhiều dòng, bulk action, ẩn cột, CSV thực tế.
- Trùng lặp cấu trúc bảng/toolbar rõ ở `user-management.tsx:81-106`, `scholarship-management.tsx:28-36`, `application-management.tsx:20`, `payment-management.tsx:25-38`.

## D — Xác thực và phân quyền

- Không có trang `/login` trong `src/app`; chỉ có `page.tsx` redirect và các route `/admin/*`.
- Không tìm thấy JWT, cookie, localStorage/sessionStorage, refresh token, middleware hoặc route guard trong `apps/admin/src`.
- `rg` toàn bộ `apps/admin/src` không tìm thấy `x-user-id` hoặc `x-user-role`.
- Không tìm thấy hardcode tài khoản, mật khẩu hay token trong `apps/admin/src`.
- Topbar có mục “Đăng xuất” nhưng là `DropdownMenuItem` không có handler — `src/components/layout/topbar.tsx:36`.
- Vì không có auth layer, mọi route admin hiện được render không cần đăng nhập và không có kiểm tra role.

## E — Dữ liệu giả và kết nối API

### Mock/fake/sample/placeholder

| File | Màn hình sử dụng |
|---|---|
| `src/data/admin-mock-data.ts:22` | `usersMock` → `/admin/users`. |
| `src/data/admin-mock-data.ts:50` | `scholarshipsMock` → `/admin/scholarships`. |
| `src/data/admin-mock-data.ts:62` | `applicationsMock` → `/admin/applications`. |
| `src/data/admin-mock-data.ts:72` | `paymentsMock` → `/admin/payments`. |
| `src/data/admin-mock-data.ts:81` | `dashboardMock` → `/admin`. |
| `src/features/users/user-management.tsx:117` | Dialog tạo user ghi rõ “minh họa giao diện”. |
| `src/features/scholarships/scholarship-management.tsx:39` | Dialog ghi rõ thông tin “minh họa giao diện”. |

### Endpoint backend admin đang gọi

- Không xác định được endpoint nào đang được gọi: không có `fetch`, axios, API client hoặc URL API trong `apps/admin/src`.

### UI có nhưng chưa có API tương ứng được admin dùng

- KPI/dashboard, users, scholarships, applications, payments, settings, xuất CSV/báo cáo, khóa user, tạo user, tạo/lưu học bổng, xem chi tiết đều chưa có kết nối API trong admin.

### Backend có nhưng admin chưa dùng

- Backend có route public/partner/admin scholarship và application dưới `apps/api/src/modules/scholarships` và `apps/api/src/modules/applications`, cùng users/organizations/notifications; không có file admin client nào sử dụng chúng.
- Việc backend có endpoint cụ thể nào ngoài các controller hiện tại không được admin gọi là kết luận trực tiếp từ việc không có lớp gọi API trong `apps/admin/src`; không suy đoán thêm.

## F — Chất lượng và UX

- Loading: không thấy trạng thái loading cho dữ liệu mạng; `Skeleton` tồn tại ở `src/components/ui/skeleton.tsx` nhưng không thấy dùng trong feature.
- Empty: users có dòng “Không tìm thấy…” khi filter rỗng; không có EmptyState dùng chung.
- Error: không có error boundary/toast/retry cho API; vì không có API nên không có xử lý lỗi mạng.
- Form validation: không có zod/yup/react-hook-form; form hiện là input uncontrolled/không submit backend.
- Ngôn ngữ: nhãn chính tiếng Việt, một số metadata/heading tiếng Anh như `System operations` — `src/features/dashboard/dashboard-overview.tsx`; không có i18n.
- Responsive: có Tailwind breakpoint `sm/md/lg`, mobile menu dùng `Sheet` — `admin-shell.tsx`, nhưng chưa có kiểm thử tự động.
- Tests: không tìm thấy test/spec của admin ngoài artifact/log và `tsconfig.tsbuildinfo`; số test admin xác định được: **0**.
- TODO/FIXME/HACK/chưa làm/tạm: `rg` không tìm thấy literal TODO/FIXME/HACK/chưa làm/tạm; các bằng chứng mock/placeholder được liệt kê ở phần E.
- Comment-out lớn/code chết: không tìm thấy comment-out lớn qua rà soát file `src`; không xác định được code chết một cách chắc chắn chỉ bằng grep.

## G — Đánh giá

### 5 khoảng trống lớn nhất

1. Không có auth/login/JWT/route guard/role enforcement.
2. 100% dữ liệu nghiệp vụ của dashboard và 4 bảng chính là mock, không có API client.
3. Không có backend admin operations: KYC/partners, moderation, audit, settings, CMS, consulting.
4. Không có DataTable production-ready: server pagination, sort/filter URL, bulk action, CSV, column control.
5. Build/typecheck hiện fail do xung đột kiểu React/Lucide; không có test admin.

### 3 vấn đề bảo mật đáng lo

1. Tất cả `/admin/*` truy cập được không cần đăng nhập/role vì không có middleware/guard — bằng chứng `src/app/admin/*`, không có `middleware.ts`/login.
2. Nút “Đăng xuất” không thực hiện revoke token/session vì không có auth/token layer — `src/components/layout/topbar.tsx:36`.
3. Không có backend client/auth boundary nên khi nối API, quyền không thể được tin cậy ở UI; hiện không có cơ chế chống truy cập trực tiếp vào route admin.

### Ước lượng hoàn thiện thật

- **Khoảng 45–60% UI mock**, **0% tích hợp dữ liệu thật/auth admin**.
- Căn cứ: 6 route UI có file và render được; dashboard/users/scholarships/applications/payments dùng mock; settings là khung; 0 endpoint được gọi; build/typecheck fail. Đây là ước lượng theo phạm vi UI hiện có, không phải chỉ số production readiness.

### Việc nên sửa trước tiên

- Xây auth admin thật (login JWT, httpOnly refresh cookie, access token memory, middleware/role ADMIN, logout revoke) trước khi nối các mutation. Nếu nối API trước, toàn bộ thao tác vận hành sẽ thiếu ranh giới bảo mật.

