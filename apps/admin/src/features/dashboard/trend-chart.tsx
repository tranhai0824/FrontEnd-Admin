"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type DashboardTrendPoint = { date: string; value: number };

export function TrendChart({ data, label }: { data: DashboardTrendPoint[]; label: string }) {
  if (data.length === 0) {
    return <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu trong kỳ.</div>;
  }
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2C6EAF" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#2C6EAF" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} dy={8} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("vi-VN")} formatter={(value) => [Number(value).toLocaleString("vi-VN"), label]} />
          <Area type="monotone" dataKey="value" stroke="#2C6EAF" strokeWidth={2.5} fill={`url(#fill-${label})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
