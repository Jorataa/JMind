"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { THEME } from "@/lib/constants/theme";
import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatSummaryProps {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  color?: keyof typeof THEME.colors;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export const StatSummary = ({
  label,
  value,
  description,
  icon,
  color = "emerald",
  trend,
}: StatSummaryProps) => {
  const activeColor = THEME.colors[color].primary;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={THEME.animation.spring}
    >
      <Card className="p-6 h-full relative overflow-hidden group">
        {/* Glow Effect */}
        <div 
          className="absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20"
          style={{ backgroundColor: activeColor }}
        />
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              {label}
            </span>
            <div className="flex items-baseline gap-2">
              <h4 className="text-[28px] font-bold text-zinc-50 tracking-tight leading-none">
                {value}
              </h4>
              {trend && (
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${trend.isUp ? "text-emerald-400" : "text-rose-400"}`}>
                  {trend.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {trend.value}%
                </span>
              )}
            </div>
          </div>
          <div 
            className="p-2.5 rounded-xl border border-white/5 bg-white/[0.03] text-zinc-400 group-hover:text-zinc-50 transition-colors"
            style={{ color: activeColor }}
          >
            {icon}
          </div>
        </div>
        
        <p className="text-[12px] font-medium text-zinc-500 leading-relaxed">
          {description}
        </p>
      </Card>
    </motion.div>
  );
};
