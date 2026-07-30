# Báo cáo GĐ1C — Bước 1 đến 4

Phạm vi lượt này dừng đúng sau Bước 4 theo prompt. Bước 5–8 chưa thực hiện
trong lượt này.

## Bước 1 — Guard mặc định đóng

- `PermissionsGuard` được đăng ký bằng `APP_GUARD` trong `app.module.ts`.
- Mọi request tới `/api/v1/admin/*` thiếu `@RequirePermissions(...)` bị từ
  chối `403`, kể cả token `SUPER_ADMIN`.
- `@Public()` được gắn cho `/health` và bốn route `/api/v1/auth/*`.
- Repo hiện không có controller scholarship công khai hoặc Swagger/docs route,
  nên không có handler tương ứng để gắn `@Public()`.
- Test HTTP endpoint admin không có decorator + token SUPER_ADMIN: thực tế `403`.

### Toàn bộ endpoint admin production hiện có

| Method | Path | Quyền yêu cầu | Vai trò được phép | Đã có guard |
|---|---|---|---|---|
| GET | `/api/v1/admin/audit-logs` | `audit.read` | `SUPER_ADMIN`, `ADMIN` | Có — `APP_GUARD` + decorator |
| GET | `/api/v1/admin/users` | `user.read` | `SUPER_ADMIN`, `ADMIN` | Có — `APP_GUARD` + decorator |
| DELETE | `/api/v1/admin/users/:id` | `user.suspend` | `SUPER_ADMIN`, `ADMIN` | Có — `APP_GUARD` + decorator |
| POST | `/api/v1/admin/users/bulk-delete` | `user.suspend` | `SUPER_ADMIN`, `ADMIN` | Có — `APP_GUARD` + decorator |

## Bước 2 — Ma trận test RBAC

Các ca dưới đây chạy qua HTTP trên Nest test application, dùng
`PermissionsGuard` và JWT thật:

| Role | Method | Path | Kỳ vọng | Thực tế |
|---|---|---|---:|---:|
| MODERATOR | PATCH | `/api/v1/admin/rbac-test/settings` (`settings.write`) | 403 | 403 |
| SUPPORT | POST | `/api/v1/admin/rbac-test/scholarships/approve` (`scholarship.approve`) | 403 | 403 |
| ADMIN | POST | `/api/v1/admin/rbac-test/administrators/manage` (`admin.manage`) | 403 | 403 |
| SUPER_ADMIN | PATCH/POST/GET | settings, scholarship approval, admin management, audit | 2xx cả 4 | 200/201/201/200 |
| CANDIDATE | GET | `/api/v1/admin/audit-logs` | 403 | 403 |

Thiết kế: `admin.manage` chỉ dành cho `SUPER_ADMIN`. `ADMIN` không được phép
quản lý hoặc nâng quyền quản trị viên khác.

## Bước 3 — Grep bắt buộc

Máy Windows không cài GNU `grep`; chạy lệnh tương đương bằng ripgrep trên toàn
bộ file `.ts`/`.tsx`, loại thư mục dependency/build.

```text
--- x-user-id
(0 matches)
--- x-user-role
(0 matches)
```

Không có API nào dùng hai header này để xác định danh tính hoặc vai trò.

## Bước 4 — Rate limit `/auth/login`

- Redis key riêng theo IP và email đã hash.
- Ngưỡng: 5 lần thất bại trong 900 giây.
- Lần thứ 6 trả `429` và `Retry-After`.
- Khi bị chặn, PostgreSQL ghi `ADMIN_LOGIN_RATE_LIMITED` vào `AuditLog`, kèm
  `accountKeyHash`, `ipHash` và thời gian retry; không lưu email/IP thô.
- Đăng nhập thành công xóa bộ đếm của IP và email.

```text
Attempt Status RetryAfter
------- ------ ----------
1       401
2       401
3       401
4       401
5       401
6       429    900
```

Kiểm tra PostgreSQL:

```text
ADMIN_LOGIN_RATE_LIMITED|AdminLogin|900
```

## Kiểm tra cuối

- API build: PASS
- API lint: PASS
- API Jest: 22/22 PASS
- Admin typecheck: PASS
- Admin lint: PASS
- Admin production build: PASS
- Prisma: 3 migrations, database schema up-to-date
- `http://localhost:3001/login`: HTTP 200

Browser connector vẫn lỗi `failed to write kernel assets`; Bước 1–4 chủ yếu là
API và test HTTP nên không có thao tác UI cần bấm xác minh trong lượt này.
