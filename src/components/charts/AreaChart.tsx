"use client";

import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { THEME } from "@/lib/constants/theme";

interface AreaChartProps {
  data: { name: string; value: number }[];
  color?: keyof typeof THEME.colors;
  height?: number;
}

export const AreaChart = ({ data, color = "emerald", height = 200 }: AreaChartProps) => {
  const activeColor = THEME.colors[color].primary;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={activeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(24, 24, 27, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "12px",
              backdropFilter: "blur(8px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
            itemStyle={{ color: activeColor }}
            cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={activeColor}
            strokeWidth={3}
            fillOpacity={1}
            fill={`url(#color-${color})`}
            animationDuration={1500}
          />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
