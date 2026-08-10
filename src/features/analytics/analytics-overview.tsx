"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart, type DashboardTrendPoint } from "@/features/dashboard/trend-chart";

const tabs = ["Tăng trưởng", "Học bổng & Hồ sơ", "Mentor", "Người dùng & Nguồn", "Nội dung"];
const metrics = [
  ["Người dùng mới", "186", "+17,5% so với kỳ trước", "positive"],
  ["Hồ sơ nộp", "342", "−4,2% so với kỳ trước", "negative"],
  ["Tỷ lệ hồ sơ được duyệt", "31,6%", "— chưa có dữ liệu kỳ trước", "muted"],
  ["Bài viết mới", "41", "+12,3% so với kỳ trước", "positive"],
  ["Lượt thuê Mentor", "126", "+23,4% so với kỳ trước", "positive"],
  ["Lượt xem trang", "12.840", "+18,6% so với kỳ trước", "positive"],
] as const;
type ChartOption = { id: string; label: string; total: string; growth: string; detail: string; tone: "positive" | "negative" | "muted"; values: readonly number[] };
const chartOptions = [
  { id: "users", label: "Người dùng mới", total: "6.782", growth: "↗ 7%", detail: "Tổng số người dùng mới trong kỳ", tone: "positive", values: [8, 6, 7, 7, 9, 8, 10, 12, 9, 8, 11, 10, 13, 12, 14, 13, 15, 14, 16, 15, 17, 16, 18, 17, 19, 18, 20, 19, 22, 21] },
  { id: "applications", label: "Hồ sơ nộp", total: "342", growth: "↘ −4,2%", detail: "Tổng số hồ sơ đã nộp trong kỳ", tone: "negative", values: [6, 8, 7, 9, 8, 10, 11, 9, 12, 11, 13, 12, 14, 15, 13, 16, 15, 17, 16, 18, 17, 19, 18, 20, 19, 18, 21, 20, 22, 21] },
  { id: "approval", label: "Tỷ lệ hồ sơ được duyệt", total: "31,6%", growth: "—", detail: "Tỷ lệ hồ sơ được duyệt trong kỳ", tone: "muted", values: [20, 22, 21, 23, 24, 22, 25, 24, 26, 25, 27, 26, 28, 29, 27, 29, 28, 30, 29, 31, 30, 32, 31, 30, 33, 32, 34, 33, 32, 31.6] },
  { id: "posts", label: "Bài viết mới", total: "41", growth: "↗ 12,3%", detail: "Tổng số bài viết mới trong kỳ", tone: "positive", values: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 10, 12, 11, 13, 12, 14, 13, 15, 14, 16, 15, 17] },
  { id: "rentals", label: "Lượt thuê Mentor", total: "126", growth: "↗ 23,4%", detail: "Tổng số lượt thuê Mentor trong kỳ", tone: "positive", values: [3, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 10, 12, 11, 13, 12, 14, 13, 15, 14, 16, 15, 17, 16, 18] },
  { id: "views", label: "Lượt xem trang", total: "12.840", growth: "↗ 18,6%", detail: "Tổng số lượt xem trang trong kỳ", tone: "positive", values: [120, 160, 145, 180, 170, 220, 205, 250, 240, 280, 270, 310, 300, 350, 330, 370, 360, 410, 390, 430, 420, 470, 450, 500, 480, 530, 520, 570, 550, 600] },
] as const satisfies readonly ChartOption[];
const cohortWeeks = ["Tuần 0", "Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4", "Tuần 6", "Tuần 8"];
const cohortRows = [
  { label: "Th 3", values: [100, 62, 48, 41, 37, 31, 28] },
  { label: "Th 4", values: [100, 66, 51, 44, 39, 34, 30] },
  { label: "Th 5", values: [100, 71, 58, 49, 45, 38, null] },
  { label: "Th 6", values: [100, 68, 55, 47, 41, null, null] },
  { label: "Th 7", values: [100, 74, 61, 52, null, null, null] },
  { label: "Th 8", values: [100, 79, 66, null, null, null, null] },
] as const;
const monthlyGrowth = [
  { month: "T9", value: 62 }, { month: "T10", value: 71 }, { month: "T11", value: 68 },
  { month: "T12", value: 84 }, { month: "T1", value: 96 }, { month: "T2", value: 88 },
  { month: "T3", value: 104 }, { month: "T4", value: 121 }, { month: "T5", value: 116 },
  { month: "T6", value: 138 }, { month: "T7", value: 152 }, { month: "T8", value: 186 },
] as const;

function cohortColor(value: number | null) {
  if (value === null) return "#E7F5F3";
  if (value >= 90) return "#18B89E";
  if (value >= 70) return "#4FC5B1";
  if (value >= 55) return "#68CCBA";
  if (value >= 40) return "#86D5C7";
  return "#A8E0D7";
}

type DetailMetric = { label: string; value: string; change: string; tone?: "positive" | "negative" | "muted" };

function DetailMetricStrip({ items }: { items: readonly DetailMetric[] }) {
  return <Card className="overflow-hidden"><CardContent className="grid divide-y divide-[#E7EDF3] p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
    {items.map((item) => <div key={item.label} className="min-h-[100px] px-5 py-4">
      <p className="text-[13px] text-[#8A97A6]">{item.label}</p>
      <p className="mt-2 text-xl font-medium text-[#26364A]">{item.value}</p>
      <p className={`mt-2 text-sm ${item.tone === "negative" ? "text-[#EF5A62]" : item.tone === "muted" ? "text-[#94A3B8]" : "text-[#16B39A]"}`}>{item.tone === "negative" ? "↘ " : item.tone === "muted" ? "— " : "↗ "}{item.change}</p>
    </div>)}
  </CardContent></Card>;
}

function BarRows({ rows, compact = false }: { rows: readonly { label: string; value: string; percent: number; color?: string; suffix?: string }[]; compact?: boolean }) {
  return <div className="divide-y divide-[#E7EDF3]">{rows.map((row) => <div key={row.label} className={compact ? "px-5 py-3" : "p-4"}>
    <div className={`flex items-center justify-between gap-3 ${compact ? "text-xs" : "text-sm"}`}><span className="text-[#52657A]">{row.label}</span><span className="font-semibold text-[#26364A]">{row.value} <small className={`ml-2 font-medium text-[#94A3B8] ${compact ? "text-[11px]" : "text-xs"}`}>{row.suffix}</small></span></div>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF2F6]"><div className="h-full rounded-full" style={{ width: `${row.percent}%`, backgroundColor: row.color ?? "#16B39A" }} /></div>
  </div>)}</div>;
}

function PanelTitle({ title, detail }: { title: string; detail?: string }) {
  return <CardHeader className="border-b border-[#E7EDF3] px-5 py-4"><CardTitle className="text-base text-[#26364A]">{title}</CardTitle>{detail && <p className="mt-1 text-sm text-[#94A3B8]">{detail}</p>}</CardHeader>;
}

function ActivityHoursHeatmap() {
  const days = ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"];
  const hours = ["0h", "2h", "4h", "6h", "8h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"];
  const values = [
    [4, 2, 1, 6, 18, 26, 22, 28, 31, 42, 58, 34],
    [3, 2, 1, 7, 19, 28, 24, 30, 33, 44, 61, 36],
    [4, 2, 2, 6, 20, 27, 23, 29, 32, 45, 59, 35],
    [3, 1, 1, 7, 21, 29, 25, 31, 34, 46, 63, 38],
    [5, 3, 2, 8, 22, 26, 21, 27, 29, 41, 54, 44],
    [8, 5, 3, 6, 14, 19, 24, 29, 33, 38, 49, 46],
    [9, 6, 4, 7, 13, 17, 26, 32, 36, 41, 52, 41],
  ];
  const cellColor = (value: number) => `rgba(52, 152, 219, ${0.12 + (value / 63) * 0.76})`;

  return (
    <Card className="overflow-hidden">
      <PanelTitle title="Giờ hoạt động trong tuần" detail="Dùng để chọn thời điểm gửi thông báo và lên lịch bảo trì" />
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[52px_repeat(12,minmax(0,1fr))] gap-1.5 text-center text-xs">
              <div />
              {hours.map((hour) => <div key={hour} className="pb-1 text-[#8A97A5]">{hour}</div>)}
              {days.flatMap((day, dayIndex) => [
                <div key={`${day}-label`} className="flex items-center justify-start text-left text-[#8A97A5]">{day}</div>,
                ...values[dayIndex].map((value, hourIndex) => (
                  <div
                    key={`${day}-${hours[hourIndex]}`}
                    title={`${day} · ${hours[hourIndex]}: ${value} hoạt động`}
                    className={`flex h-[54px] items-center justify-center rounded-[4px] ${value >= 42 ? "font-semibold text-white" : "text-[#52657A]"}`}
                    style={{ backgroundColor: cellColor(value) }}
                  >
                    {value}
                  </div>
                )),
              ])}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#8A97A5]">
          <span>Ít hoạt động</span>
          {[0.15, 0.35, 0.55, 0.75, 1].map((opacity) => <i key={opacity} className="h-2.5 w-5 rounded-sm" style={{ backgroundColor: `rgba(52, 152, 219, ${opacity})` }} />)}
          <span>Nhiều hoạt động</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ScholarshipsApplicationsPanel() {
  const funnel = [
    { label: "Lượt xem tin học bổng", value: "24.180", drop: "", step: "", total: "100,0% tổng", width: 100, color: "#3498DB" },
    { label: "Bấm “Nộp hồ sơ”", value: "3.420", drop: "↓ rớt 20.760", step: "14,1% từ bước trước · ", total: "14,1% tổng", width: 14.1, color: "#1ABB9C" },
    { label: "Bắt đầu điền hồ sơ", value: "1.180", drop: "↓ rớt 2.240", step: "34,5% từ bước trước · ", total: "4,9% tổng", width: 4.9, color: "#1ABB9C" },
    { label: "Nộp hồ sơ hoàn tất", value: "342", drop: "↓ rớt 838", step: "29,0% từ bước trước · ", total: "1,4% tổng", width: 1.4, color: "#8E79C9" },
    { label: "Được duyệt", value: "108", drop: "↓ rớt 234", step: "31,6% từ bước trước · ", total: "0,4% tổng", width: .4, color: "#26B99A" },
  ] as const;
  const fields = [
    { label: "Kỹ thuật — Công nghệ", value: "24", suffix: "28%", percent: 100, color: "#1ABB9C" },
    { label: "Kinh tế — Quản trị", value: "19", suffix: "22%", percent: 79, color: "#3498DB" },
    { label: "Khoa học sức khỏe", value: "14", suffix: "16%", percent: 58, color: "#8E79C9" },
    { label: "Khoa học xã hội", value: "11", suffix: "13%", percent: 46, color: "#E8A33D" },
    { label: "Nghệ thuật — Thiết kế", value: "9", suffix: "10%", percent: 38, color: "#E05D5D" },
    { label: "Khác · Liên ngành", value: "9", suffix: "10%", percent: 38, color: "#9AA7B4" },
  ] as const;
  const funding = [
    { label: "Toàn phần", scholarships: 31, applications: 164 },
    { label: "Bán phần", scholarships: 28, applications: 98 },
    { label: "Học phí", scholarships: 17, applications: 52 },
    { label: "Sinh hoạt", scholarships: 10, applications: 28 },
  ] as const;
  const scholarships = [
    ["Học bổng Chevening 2026", "British Council", "Đa ngành", "4.182", "96", "2,3%", "12", "Còn hạn"],
    ["MEXT Nhật Bản — Thạc sĩ", "Đại sứ quán Nhật", "Kỹ thuật", "3.740", "81", "2,2%", "9", "Còn hạn"],
    ["Australia Awards 2026", "DFAT", "Kinh tế", "2.915", "54", "1,9%", "7", "Sắp hết hạn"],
    ["GKS Korea — Cử nhân", "NIIED", "Đa ngành", "2.604", "47", "1,8%", "5", "Còn hạn"],
    ["Học bổng EduPath — Công nghệ", "EduPath Việt Nam", "Công nghệ", "1.877", "33", "1,8%", "4", "Còn hạn"],
    ["Eiffel Excellence Pháp", "Campus France", "Khoa học", "1.512", "19", "1,3%", "2", "Đã hết hạn"],
    ["Học bổng điều dưỡng Đức", "GIZ", "Sức khỏe", "1.204", "12", "1,0%", "1", "Sắp hết hạn"],
  ] as const;
  const rejectionReasons = [
    { label: "Thiếu minh chứng tiếng Anh", value: "38", suffix: "32%", percent: 100, color: "#E05D5D" },
    { label: "Bảng điểm không hợp lệ / mờ", value: "26", suffix: "22%", percent: 68, color: "#E8A33D" },
    { label: "Nộp sau hạn chót", value: "21", suffix: "18%", percent: 55, color: "#E8A33D" },
    { label: "Không đúng điều kiện bậc học", value: "17", suffix: "14%", percent: 45, color: "#3498DB" },
    { label: "Thư động lực sao chép", value: "9", suffix: "8%", percent: 24, color: "#8E79C9" },
    { label: "Lý do khác", value: "5", suffix: "4%", percent: 13, color: "#9AA7B4" },
  ] as const;

  return <div className="space-y-4">
    <div className="grid items-stretch gap-4 xl:grid-cols-[1.5fr_1fr]">
      <Card className="overflow-hidden"><PanelTitle title="Phễu chuyển đổi hồ sơ" detail="Từ lượt xem tin đến kết quả duyệt · 30 ngày" /><div className="divide-y divide-[#EEF1F4]">{funnel.map((item) => <div key={item.label} className="px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm"><strong className="text-base text-[#26364A]">{item.value}</strong><span className="text-[#52657A]">{item.label}</span>{item.drop && <span className="text-xs font-semibold text-[#E05D5D]">{item.drop}</span>}<span className="ml-auto text-xs text-[#8A97A5]">{item.step}{item.total}</span></div>
        <div className="mt-2 h-[27px] overflow-hidden rounded bg-[#F1F3F6]"><div className="flex h-full items-center rounded px-2 text-xs font-semibold text-white" style={{ width: `${Math.max(item.width, 6)}%`, backgroundColor: item.color }}>{item.width >= 12 ? `${item.width.toFixed(1)}%` : ""}</div></div>
      </div>)}</div></Card>
      <Card className="overflow-hidden"><PanelTitle title="Thời gian xử lý trung bình" detail="Tính theo giờ làm việc" /><BarRows rows={[
        { label: "Duyệt tin học bổng", value: "6,4 giờ", suffix: "mục tiêu 8h", percent: 80, color: "#1ABB9C" },
        { label: "Xác minh KYC doanh nghiệp", value: "31,2 giờ", suffix: "mục tiêu 24h", percent: 100, color: "#E05D5D" },
        { label: "Xét hồ sơ ứng tuyển", value: "4,1 ngày", suffix: "mục tiêu 5 ngày", percent: 82, color: "#1ABB9C" },
        { label: "Phản hồi ticket đầu tiên", value: "2,8 giờ", suffix: "mục tiêu 4h", percent: 70, color: "#1ABB9C" },
        { label: "Xử lý báo cáo vi phạm", value: "19,5 giờ", suffix: "mục tiêu 12h", percent: 100, color: "#E8A33D" },
      ]} /></Card>
    </div>

    <div className="analytics-breakdown-grid grid items-stretch gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden"><PanelTitle title="Theo lĩnh vực" detail="Tin đang hiển thị" /><BarRows rows={fields} /></Card>
      <Card className="overflow-hidden"><PanelTitle title="Theo bậc học" detail="Tỷ trọng tin" /><CardContent className="flex min-h-[300px] items-center justify-center gap-8 p-5">
        <div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: "conic-gradient(#1ABB9C 0 44%, #3498DB 44% 78%, #8E79C9 78% 92%, #E8A33D 92% 100%)" }}><div className="absolute inset-[22px] flex items-center justify-center rounded-full bg-white text-center"><strong className="text-2xl text-[#26364A]">86<small className="block text-xs font-normal text-[#8A97A5]">tổng</small></strong></div></div>
        <ul className="min-w-[170px] space-y-3 text-sm">{[["Thạc sĩ", "38", "44%", "#1ABB9C"], ["Cử nhân", "29", "34%", "#3498DB"], ["Tiến sĩ", "12", "14%", "#8E79C9"], ["Ngắn hạn · Trao đổi", "7", "8%", "#E8A33D"]].map(([label, value, percent, color]) => <li key={label} className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} /><span className="text-[#52657A]">{label}</span><strong className="ml-auto text-[#26364A]">{value}</strong><small className="w-9 text-right text-[#94A3B8]">{percent}</small></li>)}</ul>
      </CardContent></Card>
      <Card className="overflow-hidden"><PanelTitle title="Theo mức tài trợ" detail="Số tin · số hồ sơ nộp" /><CardContent className="p-5"><div className="flex h-[230px] items-end justify-around gap-4 border-b border-[#E7EDF3] px-3">{funding.map((item) => <div key={item.label} className="flex h-full flex-1 items-end justify-center gap-1.5"><div className="w-[28%] max-w-8 rounded-t bg-[#1ABB9C]" style={{ height: `${(item.scholarships / 31) * 82}%` }} title={`${item.label}: ${item.scholarships} tin`} /><div className="w-[28%] max-w-8 rounded-t bg-[#C9D3DC]" style={{ height: `${(item.applications / 164) * 96}%` }} title={`${item.label}: ${item.applications} hồ sơ`} /></div>)}</div><div className="mt-2 grid grid-cols-4 text-center text-xs text-[#8A97A5]">{funding.map((item) => <span key={item.label}>{item.label}</span>)}</div><div className="mt-4 flex gap-5 text-xs text-[#8A97A5]"><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#1ABB9C]" />Số tin</span><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#C9D3DC]" />Hồ sơ nộp</span></div></CardContent></Card>
    </div>

    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start border-b border-[#E7EDF3] px-5 py-4">
        <div><CardTitle className="text-base text-[#26364A]">Top học bổng theo lượt nộp</CardTitle></div>
        <button type="button" className="ml-auto h-10 rounded-md border border-[#DDE5EE] bg-white px-4 text-sm text-[#52657A] shadow-sm hover:bg-[#F7F9FB]">Xuất CSV</button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[1100px] border-collapse text-sm text-[#26364A]">
          <thead className="bg-[#FAFBFC]"><tr>{["Học bổng", "Đơn vị cấp", "Lĩnh vực", "Lượt xem", "Hồ sơ", "Tỷ lệ nộp", "Được duyệt", "Trạng thái"].map((header, index) => <th key={header} className={`border-b border-[#E7EDF3] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#94A3B8] ${index >= 3 && index <= 6 ? "text-right" : ""}`}>{header}</th>)}</tr></thead>
          <tbody>{scholarships.map((row) => <tr key={row[0]} className="border-b border-[#E7EDF3] last:border-b-0 hover:bg-[#FAFBFC]">{row.map((cell, index) => <td key={`${row[0]}-${index}`} className={`whitespace-nowrap px-5 py-3 text-[14px] ${index >= 3 && index <= 6 ? "text-right tabular-nums" : ""} ${index === 0 ? "font-medium" : ""}`}>{index === 7 ? <span className={`inline-flex items-center gap-2 text-[13px] font-medium ${cell === "Còn hạn" ? "text-[#16A34A]" : cell === "Sắp hết hạn" ? "text-[#D98B00]" : "text-[#DC3C3C]"}`}><i className={`h-2 w-2 rounded-full ${cell === "Còn hạn" ? "bg-[#2FB344]" : cell === "Sắp hết hạn" ? "bg-[#F59E0B]" : "bg-[#E03A3E]"}`} />{cell}</span> : cell}</td>)}</tr>)}</tbody>
        </table>
        <p className="border-t border-[#E7EDF3] py-4 text-center text-sm text-[#8A97A5]">Xem toàn bộ 86 tin ›</p>
      </CardContent>
    </Card>

    <Card className="overflow-hidden"><PanelTitle title="Lý do từ chối hồ sơ" /><BarRows rows={rejectionReasons} compact /></Card>
  </div>;
}

function MentorPanel() {
  const weekly = [4, 6, 5, 8, 7, 11, 9, 13, 12, 15, 18, 18];
  const mentorRows = [
    ["Nguyễn Khánh Linh", "Hồ sơ du học Anh", "18", "94%", "4,9", "1,8 giờ", "Đang nhận"],
    ["Trần Đức Minh", "Kỹ thuật — Nhật", "15", "87%", "4,7", "3,4 giờ", "Đang nhận"],
    ["Lê Phương Anh", "Luận văn — Thạc sĩ", "13", "76%", "4,5", "6,2 giờ", "Đang nhận"],
    ["Phạm Quang Hưng", "Phỏng vấn học bổng", "11", "55%", "3,9", "14,6 giờ", "Cần rà soát"],
    ["Vũ Thảo Nguyên", "IELTS — Tiếng Anh học thuật", "9", "89%", "4,8", "2,1 giờ", "Tạm nghỉ"],
  ] as const;

  return <div className="space-y-4"><DetailMetricStrip items={[{ label: "Mentor đang hoạt động", value: "38 / 48", change: "+9,1%" }, { label: "Tỷ lệ nhận lời mời", value: "72,4%", change: "+4,1 điểm" }, { label: "Tỷ lệ hoàn thành phiên", value: "64,0%", change: "−2,6 điểm", tone: "negative" }, { label: "Điểm đánh giá TB", value: "4,6 / 5", change: "+0,2" }, { label: "Thời gian phản hồi TB", value: "5,2 giờ", change: "nhanh hơn 1,1 giờ" }]} /><div className="grid gap-4 xl:grid-cols-2"><Card className="overflow-hidden"><PanelTitle title="Lượt thuê theo tuần" detail="12 tuần gần nhất" /><CardContent className="h-[340px] px-8 pb-9 pt-6"><div className="flex h-full items-end justify-between gap-3 border-b border-[#E7EDF3]">{weekly.map((value, index) => <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="w-full max-w-8 rounded-t bg-[#8E79C9]" style={{ height: `${(value / 20) * 100}%` }} /><span className="text-xs text-[#94A3B8]">T{index + 1}</span></div>)}</div></CardContent></Card><Card className="overflow-hidden"><PanelTitle title="Phân bố điểm đánh giá" detail="126 phiên đã hoàn thành" /><BarRows rows={[{ label: "5 sao", value: "78", suffix: "62%", percent: 100 }, { label: "4 sao", value: "31", suffix: "25%", percent: 40 }, { label: "3 sao", value: "11", suffix: "9%", percent: 15, color: "#F2A93B" }, { label: "2 sao", value: "4", suffix: "3%", percent: 6, color: "#EF5A62" }, { label: "1 sao", value: "2", suffix: "1%", percent: 3, color: "#C65A5A" }]} /></Card></div><Card className="overflow-hidden"><CardHeader className="flex-row items-start border-b border-[#E7EDF3] px-5 py-4"><div><CardTitle className="text-base text-[#26364A]">Xếp hạng Mentor</CardTitle><p className="mt-1 text-sm text-[#94A3B8]">Sắp theo lượt thuê trong kỳ</p></div><button type="button" className="ml-auto h-10 rounded-md border border-[#DDE5EE] bg-white px-4 text-sm text-[#52657A] shadow-sm hover:bg-[#F7F9FB]">Xuất CSV</button></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[1050px] border-collapse text-sm text-[#26364A]"><thead className="bg-[#FAFBFC]"><tr>{["Mentor", "Chuyên môn", "Lượt thuê", "Hoàn thành", "Đánh giá", "Phản hồi TB", "Trạng thái"].map((header, index) => <th key={header} className={`border-b border-[#E7EDF3] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#94A3B8] ${index >= 2 && index <= 5 ? "text-right" : ""}`}>{header}</th>)}</tr></thead><tbody>{mentorRows.map((row) => <tr key={row[0]} className="border-b border-[#E7EDF3] last:border-b-0 hover:bg-[#FAFBFC]">{row.map((cell, index) => <td key={`${row[0]}-${index}`} className={`whitespace-nowrap px-5 py-3 text-[14px] ${index >= 2 && index <= 5 ? "text-right tabular-nums" : ""} ${index === 0 ? "font-medium" : ""}`}>{index === 6 ? <span className={`inline-flex items-center gap-2 text-[13px] font-medium ${cell === "Đang nhận" ? "text-[#16A34A]" : cell === "Tạm nghỉ" ? "text-[#D98B00]" : "text-[#DC3C3C]"}`}><i className={`h-2 w-2 rounded-full ${cell === "Đang nhận" ? "bg-[#2FB344]" : cell === "Tạm nghỉ" ? "bg-[#F59E0B]" : "bg-[#E03A3E]"}`} />{cell}</span> : cell}</td>)}</tr>)}</tbody></table><p className="border-t border-[#E7EDF3] py-4 text-center text-sm text-[#8A97A5]">Xem toàn bộ 48 mentor ›</p></CardContent></Card></div>;
  return <div className="space-y-4"><DetailMetricStrip items={[{ label: "Mentor đang hoạt động", value: "38 / 48", change: "+9,1%" }, { label: "Tỷ lệ nhận lời mời", value: "72,4%", change: "+4,1 điểm" }, { label: "Tỷ lệ hoàn thành phiên", value: "64,0%", change: "−2,6 điểm", tone: "negative" }, { label: "Điểm đánh giá TB", value: "4,6 / 5", change: "+0,2" }, { label: "Thời gian phản hồi TB", value: "5,2 giờ", change: "nhanh hơn 1,1 giờ" }]} /><div className="grid gap-4 xl:grid-cols-2"><Card className="overflow-hidden"><PanelTitle title="Lượt thuê theo tuần" detail="12 tuần gần nhất" /><CardContent className="h-[340px] px-8 pb-9 pt-6"><div className="flex h-full items-end justify-between gap-3 border-b border-[#E7EDF3]">{weekly.map((value, index) => <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="w-full max-w-8 rounded-t bg-[#8E79C9]" style={{ height: `${(value / 20) * 100}%` }} /><span className="text-xs text-[#94A3B8]">T{index + 1}</span></div>)}</div></CardContent></Card><Card className="overflow-hidden"><PanelTitle title="Phân bố điểm đánh giá" detail="126 phiên đã hoàn thành" /><BarRows rows={[{ label: "5 sao", value: "78", suffix: "62%", percent: 100 }, { label: "4 sao", value: "31", suffix: "25%", percent: 40 }, { label: "3 sao", value: "11", suffix: "9%", percent: 15, color: "#F2A93B" }, { label: "2 sao", value: "4", suffix: "3%", percent: 6, color: "#EF5A62" }, { label: "1 sao", value: "2", suffix: "1%", percent: 3, color: "#C65A5A" }]} /></Card></div><Card className="overflow-hidden"><PanelTitle title="Xếp hạng Mentor" detail="Sắp theo lượt thuê trong kỳ" /><CardContent className="p-0"><table><thead><tr>{["Mentor", "Chuyên môn", "Lượt thuê", "Hoàn thành", "Đánh giá", "Phản hồi"].map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{["Nguyễn Minh Anh", "Lê Thu Hà", "Trần Đức Long"].map((name, index) => <tr key={name}><td>{name}</td><td>{["Du học Mỹ", "Học bổng châu Âu", "Công nghệ"][index]}</td><td>{18 - index * 3}</td><td>{74 - index * 4}%</td><td>4,{8 - index}</td><td>{3 + index},2 giờ</td></tr>)}</tbody></table></CardContent></Card></div>;
}

function UsersSourcesPanel() {
  const sourceRows = [
    ["Tìm kiếm tự nhiên", "18.420", "742", "4,0%", "186", "25,1%", "38%"],
    ["Truy cập trực tiếp", "6.310", "214", "3,4%", "61", "28,5%", "31%"],
    ["Facebook", "12.905", "198", "1,5%", "28", "14,1%", "67%"],
    ["Email chiến dịch", "2.140", "61", "2,9%", "24", "39,3%", "22%"],
    ["Đối tác giới thiệu", "1.086", "45", "4,1%", "19", "42,2%", "19%"],
    ["TikTok", "9.240", "88", "1,0%", "6", "6,8%", "74%"],
  ] as const;

  const cityRows = [
    { label: "Hà Nội", value: "412", suffix: "33%", percent: 100, color: "#1ABB9C" },
    { label: "TP. Hồ Chí Minh", value: "386", suffix: "31%", percent: 94, color: "#3498DB" },
    { label: "Đà Nẵng", value: "118", suffix: "9%", percent: 29, color: "#8E79C9" },
    { label: "Hải Phòng", value: "74", suffix: "6%", percent: 18, color: "#E8A33D" },
    { label: "Cần Thơ", value: "59", suffix: "5%", percent: 14, color: "#E05D5D" },
    { label: "Tỉnh thành khác", value: "199", suffix: "16%", percent: 48, color: "#9AA7B4" },
  ] as const;
  const displayAgeRows = [
    { label: "18–22 · Cử nhân", value: "504", suffix: "40%", percent: 100, color: "#1ABB9C" },
    { label: "23–26 · Thạc sĩ", value: "437", suffix: "35%", percent: 87, color: "#3498DB" },
    { label: "27–32 · Thạc sĩ / MBA", value: "206", suffix: "17%", percent: 41, color: "#8E79C9" },
    { label: "33+ · Tiến sĩ / nghiên cứu", value: "101", suffix: "8%", percent: 20, color: "#E8A33D" },
  ] as const;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#E7EDF3] px-5 py-4">
          <CardTitle className="text-base text-[#26364A]">Nguồn truy cập và chất lượng chuyển đổi</CardTitle>
          <p className="mt-1 text-sm text-[#94A3B8]">Sắp theo tỷ lệ nộp hồ sơ, không phải theo lượt truy cập</p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[1050px] border-collapse text-sm text-[#26364A]">
            <thead className="bg-[#FAFBFC]"><tr>{["Nguồn", "Phiên", "Đăng ký", "Tỷ lệ đăng ký", "Nộp hồ sơ", "Tỷ lệ nộp", "Thoát sớm"].map((header, index) => <th key={header} className={`border-b border-[#E7EDF3] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#94A3B8] ${index > 0 ? "text-right" : ""}`}>{header}</th>)}</tr></thead>
            <tbody>{sourceRows.map((row) => <tr key={row[0]} className="border-b border-[#E7EDF3] last:border-b-0 hover:bg-[#FAFBFC]">{row.map((cell, index) => <td key={`${row[0]}-${index}`} className={`whitespace-nowrap px-5 py-3 text-[14px] ${index > 0 ? "text-right tabular-nums" : ""}`}>{cell}</td>)}</tr>)}</tbody>
          </table>
          <p className="border-t border-[#E7EDF3] py-4 text-center text-sm text-[#8A97A5]">Xuất toàn bộ nguồn ›</p>
        </CardContent>
      </Card>
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden"><PanelTitle title="Theo tỉnh / thành" detail="Người dùng đăng ký" /><BarRows rows={cityRows} /></Card>
        <Card className="overflow-hidden"><PanelTitle title="Thiết bị truy cập" detail="Tỷ trọng phiên" /><CardContent className="flex min-h-[416px] items-center justify-center gap-9 p-5"><div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: "conic-gradient(#1ABB9C 0 62%, #3498DB 62% 96%, #8E79C9 96% 100%)" }}><div className="absolute inset-[22px] flex items-center justify-center rounded-full bg-white text-center"><strong className="text-2xl text-[#26364A]">50.100<small className="block text-xs font-normal text-[#8A97A5]">tổng</small></strong></div></div><ul className="min-w-[195px] space-y-3 text-sm">{[["Điện thoại", "31.240", "62%", "#1ABB9C"], ["Máy tính", "16.820", "34%", "#3498DB"], ["Máy tính bảng", "2.040", "4%", "#8E79C9"]].map(([label, value, percent, color]) => <li key={label} className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} /><span className="text-[#52657A]">{label}</span><strong className="ml-auto text-[#26364A]">{value}</strong><small className="w-9 text-right text-[#94A3B8]">{percent}</small></li>)}</ul></CardContent></Card>
        <Card className="overflow-hidden"><PanelTitle title="Nhóm tuổi và bậc học quan tâm" detail="Người dùng đã hoàn thiện hồ sơ" /><BarRows rows={displayAgeRows} /></Card>
      </div>
      <ActivityHoursHeatmap />
    </div>
  );

  const ageRows = [
    { label: "18–22 · Cử nhân", value: "504", suffix: "40%", percent: 100, color: "#1ABB9C" },
    { label: "23–26 · Thạc sĩ", value: "437", suffix: "35%", percent: 87, color: "#3498DB" },
    { label: "27–32 · Thạc sĩ / MBA", value: "206", suffix: "17%", percent: 41, color: "#8E79C9" },
    { label: "33+ · Tiến sĩ / nghiên cứu", value: "101", suffix: "8%", percent: 20, color: "#E8A33D" },
  ] as const;

  return <div className="space-y-4"><Card className="overflow-hidden"><CardHeader className="border-b border-[#E7EDF3] px-5 py-4"><CardTitle className="text-base text-[#26364A]">Nguồn truy cập và chất lượng chuyển đổi</CardTitle><p className="mt-1 text-sm text-[#94A3B8]">Sắp theo tỷ lệ nộp hồ sơ, không phải theo lượt truy cập</p></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[1050px] border-collapse text-sm text-[#26364A]"><thead className="bg-[#FAFBFC]"><tr>{["Nguồn", "Phiên", "Đăng ký", "Tỷ lệ đăng ký", "Nộp hồ sơ", "Tỷ lệ nộp", "Thoát sớm"].map((header, index) => <th key={header} className={`border-b border-[#E7EDF3] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#94A3B8] ${index > 0 ? "text-right" : ""}`}>{header}</th>)}</tr></thead><tbody>{sourceRows.map((row) => <tr key={row[0]} className="border-b border-[#E7EDF3] last:border-b-0 hover:bg-[#FAFBFC]">{row.map((cell, index) => <td key={`${row[0]}-${index}`} className={`whitespace-nowrap px-5 py-3 text-[14px] ${index > 0 ? "text-right tabular-nums" : ""}`}>{cell}</td>)}</tr>)}</tbody></table><p className="border-t border-[#E7EDF3] py-4 text-center text-sm text-[#8A97A5]">Xuất toàn bộ nguồn ›</p></CardContent></Card><div className="grid items-stretch gap-4 lg:grid-cols-3"><Card className="overflow-hidden"><PanelTitle title="Theo tỉnh / thành" detail="Người dùng đăng ký" /><BarRows rows={cityRows} /></Card><Card className="overflow-hidden"><PanelTitle title="Thiết bị truy cập" detail="Tỷ trọng phiên" /><CardContent className="flex min-h-[416px] items-center justify-center gap-9 p-5"><div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: "conic-gradient(#1ABB9C 0 62%, #3498DB 62% 96%, #8E79C9 96% 100%)" }}><div className="absolute inset-[22px] flex items-center justify-center rounded-full bg-white text-center"><strong className="text-2xl text-[#26364A]">50.100<small className="block text-xs font-normal text-[#8A97A5]">tổng</small></strong></div></div><ul className="min-w-[195px] space-y-3 text-sm">{[["Điện thoại", "31.240", "62%", "#1ABB9C"], ["Máy tính", "16.820", "34%", "#3498DB"], ["Máy tính bảng", "2.040", "4%", "#8E79C9"]].map(([label, value, percent, color]) => <li key={label} className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} /><span className="text-[#52657A]">{label}</span><strong className="ml-auto text-[#26364A]">{value}</strong><small className="w-9 text-right text-[#94A3B8]">{percent}</small></li>)}</ul></CardContent></Card><Card className="overflow-hidden"><PanelTitle title="Nhóm tuổi và bậc học quan tâm" detail="Người dùng đã hoàn thiện hồ sơ" /><BarRows rows={ageRows} /></Card></div></div>;

  return <div className="space-y-4"><Card className="overflow-hidden"><CardHeader className="border-b border-[#E7EDF3] px-5 py-4"><CardTitle className="text-base text-[#26364A]">Nguồn truy cập và chất lượng chuyển đổi</CardTitle><p className="mt-1 text-sm text-[#94A3B8]">Sắp theo tỷ lệ nộp hồ sơ, không phải theo lượt truy cập</p></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[1050px] border-collapse text-sm text-[#26364A]"><thead className="bg-[#FAFBFC]"><tr>{["Nguồn", "Phiên", "Đăng ký", "Tỷ lệ đăng ký", "Nộp hồ sơ", "Tỷ lệ nộp", "Thoát sớm"].map((header, index) => <th key={header} className={`border-b border-[#E7EDF3] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#94A3B8] ${index > 0 ? "text-right" : ""}`}>{header}</th>)}</tr></thead><tbody>{sourceRows.map((row) => <tr key={row[0]} className="border-b border-[#E7EDF3] last:border-b-0 hover:bg-[#FAFBFC]">{row.map((cell, index) => <td key={`${row[0]}-${index}`} className={`whitespace-nowrap px-5 py-3 text-[14px] ${index > 0 ? "text-right tabular-nums" : ""}`}>{cell}</td>)}</tr>)}</tbody></table><p className="border-t border-[#E7EDF3] py-4 text-center text-sm text-[#8A97A5]">Xuất toàn bộ nguồn ›</p></CardContent></Card><div className="grid gap-4 lg:grid-cols-3"><Card className="overflow-hidden"><PanelTitle title="Theo tỉnh / thành" detail="Người dùng đăng ký" /><BarRows rows={[{ label: "Hà Nội", value: "412", suffix: "33%", percent: 100 }, { label: "TP. Hồ Chí Minh", value: "386", suffix: "31%", percent: 94, color: "#3498DB" }, { label: "Đà Nẵng", value: "118", suffix: "9%", percent: 29, color: "#8E79C9" }]} /></Card><Card className="overflow-hidden"><PanelTitle title="Thiết bị truy cập" detail="Tỷ trọng phiên" /><CardContent className="flex min-h-[220px] items-center justify-center"><div className="flex h-36 w-36 items-center justify-center rounded-full border-[22px] border-[#16B39A] text-center text-2xl font-semibold text-[#26364A]"><span>50.100<small className="block text-xs font-normal text-[#94A3B8]">tổng</small></span></div></CardContent></Card><Card className="overflow-hidden"><PanelTitle title="Nhóm tuổi và bậc học quan tâm" detail="Người dùng đã hoàn thiện hồ sơ" /><BarRows rows={[{ label: "18–22 · Cử nhân", value: "504", suffix: "40%", percent: 100 }, { label: "23–26 · Thạc sĩ", value: "437", suffix: "35%", percent: 87, color: "#3498DB" }, { label: "27–32 · Thạc sĩ / MBA", value: "206", suffix: "17%", percent: 41, color: "#8E79C9" }]} /></Card></div></div>;

  const sources = [["Tìm kiếm tự nhiên", "18.420", "742", "4,0%", "186", "25,1%", "38%"], ["Truy cập trực tiếp", "6.310", "214", "3,4%", "61", "28,5%", "31%"], ["Facebook", "12.905", "198", "1,5%", "28", "14,1%", "67%"], ["Email chiến dịch", "2.140", "61", "2,9%", "24", "39,3%", "22%"], ["Đối tác giới thiệu", "1.086", "45", "4,1%", "19", "42,2%", "19%"], ["TikTok", "9.240", "88", "1,0%", "6", "6,8%", "74%"]];
  return <div className="space-y-4"><Card className="overflow-hidden"><PanelTitle title="Nguồn truy cập và chất lượng chuyển đổi" detail="Sắp theo tỷ lệ nộp hồ sơ, không phải theo lượt truy cập" /><CardContent className="p-0"><table><thead><tr>{["Nguồn", "Phiên", "Đăng ký", "Tỷ lệ đăng ký", "Nộp hồ sơ", "Tỷ lệ nộp", "Thoát sớm"].map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{sources.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table><p className="py-4 text-center text-sm text-[#94A3B8]">Xuất toàn bộ nguồn ›</p></CardContent></Card><div className="grid gap-4 lg:grid-cols-3"><Card className="overflow-hidden"><PanelTitle title="Theo tỉnh / thành" detail="Người dùng đăng ký" /><BarRows rows={[{ label: "Hà Nội", value: "412", suffix: "33%", percent: 100 }, { label: "TP. Hồ Chí Minh", value: "386", suffix: "31%", percent: 94, color: "#3498DB" }, { label: "Đà Nẵng", value: "118", suffix: "9%", percent: 29, color: "#8E79C9" }]} /></Card><Card className="overflow-hidden"><PanelTitle title="Thiết bị truy cập" detail="Tỷ trọng phiên" /><CardContent className="flex min-h-[220px] items-center justify-center"><div className="flex h-36 w-36 items-center justify-center rounded-full border-[22px] border-[#16B39A] text-center text-2xl font-semibold text-[#26364A]"><span>50.100<small className="block text-xs font-normal text-[#94A3B8]">tổng</small></span></div></CardContent></Card><Card className="overflow-hidden"><PanelTitle title="Nhóm tuổi và bậc học quan tâm" detail="Người dùng đã hoàn thiện hồ sơ" /><BarRows rows={[{ label: "18–22 · Cử nhân", value: "504", suffix: "40%", percent: 100 }, { label: "23–26 · Thạc sĩ", value: "437", suffix: "35%", percent: 87, color: "#3498DB" }, { label: "27–32 · Thạc sĩ / MBA", value: "206", suffix: "17%", percent: 41, color: "#8E79C9" }]} /></Card></div></div>;
}

function ContentPanel() {
  const topicRows = [
    { label: "Hướng dẫn nộp hồ sơ", value: "9.840", suffix: "35%", percent: 100, color: "#16B39A" },
    { label: "Tổng hợp học bổng", value: "7.210", suffix: "26%", percent: 74, color: "#3498DB" },
    { label: "Kinh nghiệm phỏng vấn", value: "4.680", suffix: "17%", percent: 48, color: "#8E79C9" },
    { label: "Chi phí — học phí", value: "3.520", suffix: "13%", percent: 36, color: "#F2A93B" },
    { label: "Đời sống du học", value: "2.890", suffix: "10%", percent: 30, color: "#94A3B8" },
  ] as const;
  const articles = [
    ["Hướng dẫn viết thư động lực 2026", "4.812", "5 ph 12 giây", "64"],
    ["10 học bổng toàn phần còn hạn tháng này", "3.906", "3 ph 04 giây", "58"],
    ["Chuẩn bị hồ sơ MEXT từ A đến Z", "3.221", "6 ph 48 giây", "51"],
    ["Sai lầm thường gặp khi phỏng vấn học bổng", "2.487", "4 ph 19 giây", "33"],
    ["Chi phí sinh hoạt du học Úc 2026", "2.150", "2 ph 55 giây", "12"],
  ] as const;

  return (
    <div className="space-y-4">
      <DetailMetricStrip items={[{ label: "Bài viết xuất bản", value: "214", change: "+6,2%" }, { label: "Lượt xem bài viết", value: "28.140", change: "+14,8%" }, { label: "Thời gian đọc TB", value: "2 ph 41 giây", change: "−11 giây", tone: "negative" }, { label: "Tỷ lệ nhấp banner", value: "1,9%", change: "+0,3 điểm" }, { label: "Bình luận bị báo cáo", value: "3", change: "không đủ mẫu để so sánh", tone: "muted" }]} />
      <div className="grid items-stretch gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="overflow-hidden"><PanelTitle title="Theo chủ đề" detail="Lượt xem" /><BarRows rows={topicRows} /></Card>
        <Card className="overflow-hidden">
          <PanelTitle title="Top bài viết" detail="Theo lượt xem trong kỳ" />
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[680px] border-collapse text-sm text-[#26364A]">
              <thead className="bg-[#FAFBFC]"><tr>{["Tiêu đề", "Lượt xem", "Thời gian đọc", "Dẫn tới hồ sơ"].map((header, index) => <th key={header} className={`border-b border-[#E7EDF3] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#94A3B8] ${index === 0 ? "text-left" : "text-right"}`}>{header}</th>)}</tr></thead>
              <tbody>{articles.map(([title, views, time, applications]) => <tr key={title} className="border-b border-[#E7EDF3] last:border-b-0 hover:bg-[#FAFBFC]"><td className="px-5 py-3 text-[14px] text-[#34465B]">{title}</td><td className="px-5 py-3 text-right tabular-nums text-[14px]">{views}</td><td className="whitespace-nowrap px-5 py-3 text-right text-[14px]">{time}</td><td className="px-5 py-3 text-right tabular-nums text-[14px]">{applications}</td></tr>)}</tbody>
            </table>
            <p className="border-t border-[#E7EDF3] py-4 text-center text-sm text-[#8A97A5]">Xem toàn bộ 214 bài ›</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  const topics = ["Hướng dẫn nộp hồ sơ", "Tổng hợp học bổng", "Kinh nghiệm phỏng vấn", "Chi phí — học phí", "Đời sống du học"];
  return <div className="space-y-4"><DetailMetricStrip items={[{ label: "Bài viết xuất bản", value: "214", change: "+6,2%" }, { label: "Lượt xem bài viết", value: "28.140", change: "+14,8%" }, { label: "Thời gian đọc TB", value: "2 ph 41 giây", change: "−11 giây", tone: "negative" }, { label: "Tỷ lệ nhấp banner", value: "1,9%", change: "+0,3 điểm" }, { label: "Bình luận bị báo cáo", value: "3", change: "không đủ mẫu để so sánh", tone: "muted" }]} /><div className="grid gap-4 xl:grid-cols-[.85fr_1.25fr]"><Card className="overflow-hidden"><PanelTitle title="Theo chủ đề" detail="Lượt xem" /><BarRows rows={topics.map((label, index) => ({ label, value: ["9.840", "7.210", "4.680", "3.520", "2.890"][index], suffix: ["35%", "26%", "17%", "13%", "10%"][index], percent: [100, 74, 48, 36, 30][index], color: ["#16B39A", "#3498DB", "#8E79C9", "#F2A93B", "#94A3B8"][index] }))} /></Card><Card className="overflow-hidden"><PanelTitle title="Top bài viết" detail="Theo lượt xem trong kỳ" /><CardContent className="p-0"><table><thead><tr>{["Tiêu đề", "Lượt xem", "Thời gian đọc", "Dẫn tới hồ sơ"].map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{["Hướng dẫn viết thư động lực 2026", "10 học bổng toàn phần còn hạn tháng này", "Chuẩn bị hồ sơ MEXT từ A đến Z", "Sai lầm thường gặp khi phỏng vấn học bổng", "Chi phí sinh hoạt du học Úc 2026"].map((title, index) => <tr key={title}><td>{title}</td><td>{[4812, 3906, 3221, 2487, 2150][index].toLocaleString("vi-VN")}</td><td>{["5 ph 12 giây", "3 ph 04 giây", "6 ph 48 giây", "4 ph 19 giây", "2 ph 55 giây"][index]}</td><td>{[64, 58, 51, 33, 12][index]}</td></tr>)}</tbody></table><p className="py-4 text-center text-sm text-[#94A3B8]">Xem toàn bộ 214 bài ›</p></CardContent></Card></div></div>;
}

export function AnalyticsOverview() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [selectedMetric, setSelectedMetric] = useState<string>(chartOptions[0].id);
  const [selectedRange, setSelectedRange] = useState(30);
  const [mounted, setMounted] = useState(false);
  const currentChart: ChartOption = chartOptions.find((option) => option.id === selectedMetric) ?? chartOptions[0];
  const points = useMemo<DashboardTrendPoint[]>(() => currentChart.values.map((value, index) => ({
    date: `2026-08-${String(index + 1).padStart(2, "0")}`,
    value,
  })), [currentChart]);
  const comparisonValues = useMemo(() => {
    const comparisonShape = [8, 9, 9, 5, 9, 6, 10, 7, 8, 5, 5, 5, 8, 1, 2, 3, 1, 4, 2, 7, 6, 6, 8, 11, 12, 12, 12, 11, 13, 11];
    const currentMax = Math.max(...currentChart.values);
    const scale = currentMax / 16;
    return comparisonShape.map((value) => Math.round(value * scale * 10) / 10);
  }, [currentChart]);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="min-h-[420px]" />;

  return <div className="mx-auto max-w-[1440px] space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6F7882]">Tổng quan</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#181818]">Phân tích</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-[#8A97A5] sm:inline">Dữ liệu tính đến 20:45</span>
        <button type="button" className="h-10 rounded-lg border border-[#DDE5EE] bg-white px-4 text-sm text-[#52657A] shadow-sm transition hover:bg-[#F7F9FB] hover:text-[#26364A]">Lưu bộ lọc</button>
        <button type="button" className="h-10 rounded-lg bg-[#1ABB9C] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#149B83]">↓&nbsp; Xuất báo cáo</button>
      </div>
    </div>
    <div className="overflow-x-auto border-b border-[#DCEAF6]">
      <div className="flex min-w-max items-center gap-8">
        {tabs.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${activeTab === tab ? "border-[#16B39A] text-[#202A3B]" : "border-transparent text-[#94A3B8] hover:text-[#52657A]"}`}>{tab}</button>)}
      </div>
    </div>
    {activeTab === "Tăng trưởng" && <>
    <Card className="overflow-hidden">
      <CardContent className="grid gap-x-8 gap-y-8 p-5 sm:grid-cols-3">
        {metrics.map(([label, value, comparison, tone], index) => <div key={label} className={`min-h-[92px] pb-5 ${index < 3 ? "border-b border-[#EEF2F6]" : ""}`}>
          <p className="text-sm text-[#8A97A6]">{label}</p>
          <p className="mt-2 text-2xl font-medium text-[#26364A]">{value}</p>
          <p className={`mt-2 text-sm ${tone === "negative" ? "text-[#EF4444]" : tone === "muted" ? "text-[#94A3B8]" : "text-[#16B39A]"}`}>{tone === "positive" ? "↗ " : tone === "negative" ? "↘ " : "— "}{comparison.replace(/^[↗↘— ]+/, "")}</p>
        </div>)}
      </CardContent>
    </Card>
    <Card className="analytics-trend-card">
      <CardHeader className="analytics-trend-header">
        <div className="analytics-trend-copy">
          <CardTitle>{currentChart.label} theo ngày</CardTitle>
          <div className="analytics-trend-total">
            <span>{currentChart.total}</span>
            <span className={currentChart.tone === "negative" ? "negative" : currentChart.tone === "muted" ? "muted" : "positive"}>{currentChart.growth}</span>
          </div>
          <p>{currentChart.detail}</p>
        </div>
        <div className="analytics-trend-controls">
          <div className="analytics-trend-ranges">
            {[7, 30, 90].map((range) => <button key={range} type="button" onClick={() => setSelectedRange(range)} className={selectedRange === range ? "active" : ""}>{range} ngày</button>)}
          </div>
          <select className="analytics-trend-select" value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value)} aria-label="Chọn chỉ số biểu đồ">
            {chartOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent className="analytics-trend-content"><TrendChart data={selectedRange === 7 ? points.slice(-7) : points} comparisonData={selectedRange === 7 ? comparisonValues.slice(-7) : comparisonValues} indexedAxis widePlot label={currentChart.label} /></CardContent>
    </Card>
    <Card className="analytics-cohort-card">
      <CardHeader className="border-b border-[#EEF2F6] px-5 py-4">
        <CardTitle className="text-base">Giữ chân theo nhóm đăng ký (cohort)</CardTitle>
        <p className="text-sm text-[#94A3B8]">% người dùng còn hoạt động sau N tuần</p>
      </CardHeader>
      <CardContent className="p-5">
        <div className="analytics-cohort-grid">
          <div />
          {cohortWeeks.map((week) => <div key={week} className="analytics-cohort-week">{week}</div>)}
          {cohortRows.map((row) => <div key={row.label} className="contents">
            <div className="analytics-cohort-row-label">{row.label}</div>
            {row.values.map((value, index) => <div key={`${row.label}-${index}`} className="analytics-cohort-cell" style={{ backgroundColor: cohortColor(value) }}>{value ?? ""}</div>)}
          </div>)}
        </div>
        <div className="analytics-cohort-legend">
          <span>Thấp</span>
          {["#DDF2EF", "#B8E5DD", "#8FD8CA", "#59C8B4", "#18B89E"].map((color) => <i key={color} style={{ backgroundColor: color }} />)}
          <span>Cao</span>
        </div>
      </CardContent>
    </Card>
    <Card className="analytics-monthly-card">
      <CardHeader className="border-b border-[#EEF2F6] px-5 py-4">
        <CardTitle className="text-base">Tăng trưởng theo tháng</CardTitle>
        <p className="text-sm text-[#94A3B8]">Người dùng mới 12 tháng</p>
      </CardHeader>
      <CardContent className="p-5">
        <div className="analytics-monthly-chart">
          <div className="analytics-monthly-axis">
            {[188, 141, 94, 47, 0].map((value) => <span key={value}>{value}</span>)}
          </div>
          <div className="analytics-monthly-plot">
            <div className="analytics-monthly-lines">{[0, 1, 2, 3, 4].map((line) => <i key={line} />)}</div>
            <div className="analytics-monthly-bars">
              {monthlyGrowth.map((item) => <div key={item.month} className="analytics-monthly-column">
                <div className="analytics-monthly-bar" style={{ height: `${(item.value / 188) * 100}%` }} title={`${item.month}: ${item.value}`} />
                <span>{item.month}</span>
              </div>)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </>}
    {activeTab === "Học bổng & Hồ sơ" && <ScholarshipsApplicationsPanel />}
    {activeTab === "Mentor" && <MentorPanel />}
    {activeTab === "Người dùng & Nguồn" && <UsersSourcesPanel />}
    {activeTab === "Nội dung" && <ContentPanel />}
  </div>;
}
