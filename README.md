
# Scholarship Platform Admin

## Cấu hình backend

Trang quản trị sử dụng backend riêng, không dùng API public của website chính.

```env
ADMIN_API_URL=https://backendforadmin.vercel.app
NEXT_PUBLIC_ADMIN_API_URL=https://backendforadmin.vercel.app
```

Trên Vercel, đặt hai biến trên cho môi trường Production rồi redeploy. Biến cũ
`NEXT_PUBLIC_API_URL=https://tttn-five.vercel.app` không phải backend admin và
không có các route `/api/v1/admin/*`.

Kiểm tra nhanh sau khi deploy:

- `GET https://backendforadmin.vercel.app/api/v1/health` trả `200`.
- Các route `/api/v1/admin/*` không có token trả `401`, không phải `404`.
- Đăng nhập ở `/login`, sau đó Dashboard và Danh mục ngành tải được dữ liệu.
