"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { THEME } from "@/lib/constants/theme";

interface DonutChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  height?: number;
}

export const DonutChart = ({ 
  data, 
  colors = [THEME.colors.emerald.primary, THEME.colors.sky.primary, THEME.colors.violet.primary],
  height = 200 
}: DonutChartProps) => {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            animationBegin={0}
            animationDuration={1500}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(24, 24, 27, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "12px",
              backdropFilter: "blur(8px)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
