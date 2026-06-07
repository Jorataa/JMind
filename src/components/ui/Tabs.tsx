"use client";

import { cn } from "@/lib/cn";

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onChange, className }: TabsProps) => {
  return (
    <div className={cn("flex items-center gap-1 border-b border-white/5 pb-px", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-4 py-2.5 text-[13px] font-semibold transition-colors",
              isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-200" />
            )}
          </button>
        );
      })}
    </div>
  );
};
