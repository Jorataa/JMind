import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "default" | "emerald" | "amber" | "sky" | "rose" | "violet" | "zinc";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-white/10 text-zinc-300",
    emerald: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    amber: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    sky: "bg-sky-400/10 text-sky-400 border-sky-400/20",
    rose: "bg-rose-400/10 text-rose-400 border-rose-400/20",
    violet: "bg-violet-400/10 text-violet-400 border-violet-400/20",
    zinc: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
