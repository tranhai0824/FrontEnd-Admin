"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#2C6EAF", "#46A171", "#D5803B", "#8B5CF6", "#E11D48", "#64748B"];

export function DistributionChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (data.length === 0 || total === 0) {
    return <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu phân bố.</div>;
  }
  return (
    <div className="grid h-[280px] grid-cols-[1fr_150px] items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
            {data.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(value) => [Number(value).toLocaleString("vi-VN"), "Số lượng"]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.name}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="truncate">{item.name}</span>
            </div>
            <p className="mt-1 pl-[18px] text-sm font-bold">{item.value} <span className="font-normal text-muted-foreground">({total ? Math.round(item.value / total * 100) : 0}%)</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}
