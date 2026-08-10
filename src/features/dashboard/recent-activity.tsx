import { RefreshCw } from "lucide-react";

const activities = [
  { avatar: "TH", text: "Tuấn Hải đã đăng một học bổng mới", time: "2 phút trước", color: "bg-[#DDF4F0] text-[#159A88]" },
  { avatar: "ND", text: "Người dùng mới đã đăng ký tài khoản", time: "18 phút trước", color: "bg-[#E4EEFF] text-[#2563B8]" },
  { avatar: "KYC", text: "Đối tác đã hoàn tất xác minh KYC", time: "45 phút trước", color: "bg-[#FFF1D6] text-[#C47A12]" },
  { avatar: "HS", text: "Một hồ sơ ứng tuyển vừa được nộp", time: "1 giờ trước", color: "bg-[#F0E8FF] text-[#7C4CC2]" },
  { avatar: "TV", text: "Yêu cầu tư vấn mới vừa được gửi", time: "4 giờ trước", color: "bg-[#E2F3E8] text-[#2B9252]" },
  { avatar: "BC", text: "Báo cáo vi phạm mới đã được tạo", time: "6 giờ trước", color: "bg-[#FFE4E4] text-[#C83B3B]" },
];

export function RecentActivity() {
  return (
    <section className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 font-[Inter,Segoe_UI,sans-serif] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="mb-2 flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <h2 className="text-lg font-semibold text-[#202A3B]">Hoạt động gần đây</h2>
        <button type="button" className="rounded-md p-1 text-[#7A8795] transition hover:bg-[#EDF4FF] hover:text-[rgb(18,91,201)]" aria-label="Thu gọn hoạt động gần đây">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <div>
        {activities.map((activity, index) => (
          <div key={`${activity.avatar}-${activity.time}`} className={`flex items-center gap-3 py-3.5 ${index < activities.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${activity.color}`}>{activity.avatar}</div>
            <div className="min-w-0">
              <p className="truncate text-sm text-[#202A3B]">{activity.avatar === "TH" ? <><strong>Tuấn Hải</strong> đã đăng một học bổng mới</> : activity.avatar === "ND" ? <><strong>Người dùng mới</strong> đã đăng ký tài khoản</> : activity.avatar === "KYC" ? <><strong>Đối tác</strong> đã hoàn tất xác minh KYC</> : activity.text}</p>
              <p className="mt-1 text-xs text-[#8A97A6]">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
