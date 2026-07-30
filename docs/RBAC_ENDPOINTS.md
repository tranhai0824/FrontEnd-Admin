# Ma trận RBAC Admin

Mọi route bắt đầu bằng `/api/v1/admin` được `PermissionsGuard` bảo vệ toàn cục.
Endpoint admin không khai báo `@RequirePermissions(...)` bị từ chối theo cơ chế mặc định đóng.

| Method | Path | Quyền yêu cầu | Vai trò được phép |
|---|---|---|---|
| GET | `/api/v1/admin/dashboard` | `dashboard.read` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `SUPPORT` |
| GET | `/api/v1/admin/audit-logs` | `audit.read` | `SUPER_ADMIN`, `ADMIN` |
| GET | `/api/v1/admin/users` | `user.read` | `SUPER_ADMIN`, `ADMIN`, `SUPPORT` |
| DELETE | `/api/v1/admin/users/:id` | `user.delete` | `SUPER_ADMIN`, `ADMIN` |
| POST | `/api/v1/admin/users/bulk-delete` | `user.delete` | `SUPER_ADMIN`, `ADMIN` |
| GET | `/api/v1/admin/scholarships` | `scholarship.approve` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR` |
| GET | `/api/v1/admin/scholarships/:id` | `scholarship.approve` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR` |
| POST | `/api/v1/admin/scholarships/:id/decision` | `scholarship.approve` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR` |
| GET | `/api/v1/admin/partners` | `organization.read` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR` |
| GET | `/api/v1/admin/partners/:id` | `organization.read` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR` |
| POST | `/api/v1/admin/partners/:id/decision` | `organization.review` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR` |

Các endpoint `/api/v1/auth/*` và `/health` được đánh dấu public rõ ràng, có validation và
quy tắc xác thực riêng. Middleware frontend chỉ phục vụ điều hướng; backend guard mới là lớp
bảo mật có thẩm quyền.
