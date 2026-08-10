"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type DashboardTrendPoint = { date: string; value: number };

export function TrendChart({ data, label, comparisonData, indexedAxis = false, widePlot = false }: { data: DashboardTrendPoint[]; label: string; comparisonData?: readonly number[]; indexedAxis?: boolean; widePlot?: boolean }) {
  if (data.length === 0) {
    return <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu trong kỳ.</div>;
  }
  const gradientId = `fill-${label.replace(/[^a-zA-Z0-9]/g, "-")}`;
  const chartData = data.map((point, index) => ({
    ...point,
    comparison: comparisonData?.[index],
  }));
  return (
    <div className="h-[310px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 8, left: widePlot ? -42 : -16, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F8EF7" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#4F8EF7" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="date" tickFormatter={(value, index) => indexedAxis ? `N${index + 1}` : new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} interval={indexedAxis ? Math.max(0, Math.ceil(data.length / 5) - 1) : "preserveStartEnd"} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} dy={8} />
          <YAxis width={widePlot ? 40 : 60} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("vi-VN")} formatter={(value) => [Number(value).toLocaleString("vi-VN"), label]} />
          <Area type="linear" dataKey="value" name="Kỳ hiện tại" stroke="#2F96DE" strokeWidth={2.25} fill={`url(#${gradientId})`} dot={indexedAxis ? { r: 2.5, fill: "#fff", stroke: "#2F96DE", strokeWidth: 2 } : false} activeDot={{ r: 4, fill: "#fff", stroke: "#2F96DE", strokeWidth: 2 }} />
          {comparisonData && <Area type="linear" dataKey="comparison" name="Kỳ so sánh" stroke="#B8C7D9" strokeWidth={2.5} strokeDasharray="8 5" strokeOpacity={1} fill="none" dot={false} activeDot={{ r: 3, fill: "#fff", stroke: "#B8C7D9", strokeWidth: 2 }} />}
        </AreaChart>
      </ResponsiveContainer>
      {comparisonData && <div className="analytics-trend-legend"><span><i className="current" />Kỳ hiện tại</span><span><i className="comparison" />Kỳ so sánh</span></div>}
    </div>
  );
}
