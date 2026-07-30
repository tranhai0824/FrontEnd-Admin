# Kết quả xác minh GĐ1B-2

Ngày kiểm tra: 27/07/2026  
Môi trường: PostgreSQL Docker `scholarship-platform-postgres-1`, Redis Docker,
API `localhost:4000`, Admin `localhost:3001`.

## Auth thật

| Ca | Kỳ vọng | Kết quả |
|---|---|---|
| Admin đăng nhập bằng Argon2/DB thật | `201`, refresh cookie `HttpOnly; Path=/` | PASS |
| Sai mật khẩu | `401` | PASS |
| Candidate đăng nhập Admin | `401` | PASS |
| Refresh hợp lệ | `201`, refresh token được đổi trong transaction | PASS |
| Dùng lại refresh token cũ | `401` | PASS |
| Logout rồi refresh | logout `201`, refresh `401` | PASS |
| RBAC audit log | ADMIN `200`, MODERATOR `403` | PASS |

`ADMIN_REFRESH_REUSE_BLOCKED` được ghi thật vào bảng `AuditLog`.

Giới hạn: Browser connector của Codex không khởi tạo được do lỗi runtime
`failed to write kernel assets`. Các ca trên được chạy qua HTTP cookie session
thật tới API/PostgreSQL, không được ghi nhận là kiểm thử UI bằng Chrome.

## Server-side pagination

Kiểm tra `GET /api/v1/admin/users?page=1&pageSize=2`:

- HTTP `200`
- `items = 2`
- `pageSize = 2`
- `total = 5`, lấy từ Prisma `count()`
- `pageCount = 3`
- ID trang 1 và trang 2 không trùng nhau
- Lọc `role=MODERATOR` trả `total = 1`

## Build và test

- API build: PASS
- API lint: PASS
- API Jest: 16/16 PASS
- Admin typecheck/lint: PASS
- Admin production build: PASS
- `/login`: HTTP 200
- `/admin/users` chưa có cookie: redirect 307
- `/admin/users?role=MODERATOR&page=1` có cookie: HTTP 200
