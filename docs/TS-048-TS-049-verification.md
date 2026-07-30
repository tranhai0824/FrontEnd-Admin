# TS-048 và TS-049 — Báo cáo kiểm chứng

Ngày kiểm chứng: 2026-07-27  
Môi trường: PostgreSQL `scholarship_dev` (container Docker thật), MinIO thật, API NestJS cổng 4000, Admin Next.js cổng 3001. Không dùng mock hoặc SQLite.

## Bước 1 — Tái hiện

### Lệnh đã chạy và output

```powershell
pnpm --filter @scholarship/database exec prisma migrate deploy
pnpm --filter @scholarship/database exec prisma migrate status
```

```text
9 migrations found in prisma/migrations
No pending migrations to apply.
Database schema is up to date!
```

Seed được chạy trực tiếp bằng script repository vì package Prisma chưa khai báo `prisma.seed`:

```powershell
$env:DATABASE_URL = '<PostgreSQL development URL>'
node prisma/seed.mjs
```

```text
Seed Giai đoạn 2 hoàn tất
```

Curl/HTTP tương đương PowerShell, sử dụng access token nhận từ `POST /api/v1/auth/login` (token và mật khẩu không được ghi vào báo cáo):

```powershell
GET http://localhost:4000/api/v1/admin/partners
Authorization: Bearer <access-token>
```

Kết quả **trước sửa**:

```text
HTTP 200
{"items":[],"counts":{"VERIFIED":2},"pagination":{"page":1,"pageSize":20,"total":0,"pageCount":1}}
```

API log không có exception; database thật có hai tổ chức `VERIFIED`. Browser ban đầu có `ChunkLoadError` vì Admin đang chạy bundle cũ sau khi thay source; sau build/restart bundle mới, không còn lỗi tải dữ liệu Partner.

### Kết luận nguyên nhân

TS-048 thuộc nhóm **query Prisma sai**: `PartnerAdminQueryDto.status` mặc định là `PENDING`, nên endpoint không có query string vẫn áp điều kiện `status=PENDING` và trả danh sách rỗng, trong khi seed chỉ có dữ liệu `VERIFIED`. Đây không phải thiếu migration, seed rỗng, serialize, RBAC hay lỗi UI.

## Bước 2 — Sửa và kiểm chứng TS-049

### Diff logic

```diff
// apps/api/src/modules/admin/dto/partner-admin-query.dto.ts
- status?: OrganizationStatus = OrganizationStatus.PENDING;
+ status?: OrganizationStatus;
```

Kết quả **sau sửa** của cùng request:

```text
HTTP 200
items: 2
pagination.total: 2
counts: { VERIFIED: 2 }
```

### Signed URL và PDF viewer KYC

Một PDF KYC kiểm thử được đưa vào MinIO thật (`scholarship-documents/kyc/ts049-verification.pdf`) và liên kết với tổ chức seed. Kết quả:

```text
ADMIN_DETAIL_STATUS=200
SIGNED_URL_EXPIRES_SECONDS=300
SIGNED_URL_DATE_PRESENT=True
SIGNED_PDF_STATUS=200
SIGNED_PDF_CONTENT_TYPE=application/pdf
SUPPORT_DETAIL_STATUS=403
```

- URL ký có TTL 300 giây; service giới hạn TTL trong khoảng 60–3600 giây.
- URL chỉ được tạo sau guard `@RequirePermissions(PERMISSIONS.ORGANIZATION_READ)`. SUPER_ADMIN/ADMIN/MODERATOR có quyền này; SUPPORT bị xác nhận trả `403` trước khi nhận dữ liệu tài liệu.
- Viewer dùng iframe cho `application/pdf`. Browser đã xác nhận iframe `ts049-kyc-verification.pdf` được tạo, có signed URL MinIO và render từ file PDF trả `200 application/pdf`.

## Bước 3 — UX Partner

### Diff UI

```diff
// apps/admin/src/components/shared/data-table.tsx
+ loadingVariant?: "pacman" | "skeleton";
+ onRetry?: () => void;
+ skeleton table rows when loadingVariant === "skeleton"
+ error EmptyState action: button "Thử lại"

// apps/admin/src/features/partners/partner-management.tsx
+ loadingVariant="skeleton"
+ onRetry={() => void partners.refetch()}
+ emptyTitle và emptyDescription riêng cho đối tác
```

Các trạng thái đã kiểm thử trực tiếp trên `/admin/partners`:

| Trạng thái | Kết quả |
| --- | --- |
| Loading | Bảng hiển thị 5 hàng skeleton, không phải spinner trắng và không thay đổi layout. |
| Empty | `?status=PENDING` hiển thị “Chưa có đối tác ở trạng thái này” cùng mô tả hướng dẫn. |
| Error | Tắt API có chủ đích: hiển thị “Không tải được dữ liệu” và nút “Thử lại”. |
| Retry | Khởi động lại API, bấm “Thử lại”: hàng “Quỹ học bổng TopScholar” xuất hiện; nút lỗi biến mất. |
| Success | `?status=VERIFIED` hiển thị 2 tổ chức, badge “Đã xác minh 2”. |

## Bước 4 — Tệp đã thay đổi

1. `apps/api/src/modules/admin/dto/partner-admin-query.dto.ts` — bỏ bộ lọc `PENDING` ngầm của API list Partner.
2. `apps/admin/src/components/shared/data-table.tsx` — thêm biến thể skeleton dùng chung và hành động Retry dùng chung cho lỗi bảng.
3. `apps/admin/src/features/partners/partner-management.tsx` — cấu hình màn Partner dùng skeleton, empty state mô tả rõ, Retry hoạt động.
4. `docs/TS-048-TS-049-verification.md` — báo cáo bằng chứng này.

## Build và tiến trình cuối

```text
pnpm --filter @scholarship-platform/admin typecheck     PASS
pnpm --filter @scholarship/api build                    PASS
pnpm --filter @scholarship-platform/admin build         PASS
```

Cuối phiên, API đang nghe cổng 4000 và Admin đang nghe cổng 3001. TS-048 đạt điều kiện DONE: API và UI cùng chạy thành công trên PostgreSQL thật.
