import { RefreshCw } from "lucide-react";

export type ActivityItem = { id: string; action: string; reason: string | null; actorEmail: string; targetId: string; createdAt: string };

// action là chuỗi tự do dạng "resource.verb" (vd. "scholarship.approve", "partner.rejected",
// "user.suspend") ghi trực tiếp bởi AdminService#recordAudit — không phải enum cố định, nên diễn giải
// theo tiền tố thay vì liệt kê toàn bộ giá trị có thể có.
const actionLabels: Record<string, string> = {
  approve: "duyệt", approved: "duyệt", reject: "từ chối", rejected: "từ chối",
  request_changes: "yêu cầu chỉnh sửa", pending: "chờ duyệt", won: "chọn trúng học bổng",
  suspend: "tạm khoá", disable: "vô hiệu hoá", activate: "kích hoạt lại",
  add_role: "thêm vai trò", remove_role: "gỡ vai trò", "sessions.revoked": "thu hồi phiên đăng nhập",
  expired: "tự động đóng vì quá hạn", updated: "cập nhật",
};
const resourceLabels: Record<string, string> = {
  scholarship: "Học bổng", partner: "Đối tác", user: "Người dùng", application: "Hồ sơ ứng tuyển",
};
const resourceColor: Record<string, string> = {
  scholarship: "bg-[#DDF4F0] text-[#159A88]", partner: "bg-[#FFF1D6] text-[#C47A12]",
  user: "bg-[#E4EEFF] text-[#2563B8]", application: "bg-[#F0E8FF] text-[#7C4CC2]",
};

function describe(action: string) {
  const [resource, ...rest] = action.split(".");
  const verbKey = rest.join(".").replace(/^bulk\./, "");
  return { resource: resourceLabels[resource] ?? resource, verb: actionLabels[verbKey] ?? verbKey.replace(/_/g, " ") };
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 font-[Inter,Segoe_UI,sans-serif] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="mb-2 flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <h2 className="text-lg font-semibold text-[#202A3B]">Hoạt động gần đây</h2>
        <span className="rounded-md p-1 text-[#7A8795]"><RefreshCw className="h-4 w-4" /></span>
      </div>
      {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Chưa có hoạt động quản trị nào được ghi nhận.</p>}
      <div>
        {items.map((item, index) => {
          const [resourceKey] = item.action.split(".");
          const { resource, verb } = describe(item.action);
          return (
            <div key={item.id} className={`flex items-center gap-3 py-3.5 ${index < items.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${resourceColor[resourceKey] ?? "bg-slate-100 text-slate-600"}`}>
                {resourceKey.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-[#202A3B]"><strong>{item.actorEmail}</strong> đã {verb} {resource.toLowerCase()}{item.reason ? ` — "${item.reason}"` : ""}</p>
                <p className="mt-1 text-xs text-[#8A97A6]">{timeAgo(item.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
