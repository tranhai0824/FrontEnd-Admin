import { Suspense } from "react";
import { UserManagement } from "@/features/users/user-management";

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Đang tải danh sách người dùng...</div>}>
      <UserManagement />
    </Suspense>
  );
}
