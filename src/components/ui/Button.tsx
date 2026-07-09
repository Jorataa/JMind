import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary:
        "bg-emerald-500 text-zinc-950 shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_10px_28px_-12px_var(--accent-glow)] hover:bg-emerald-400 active:translate-y-px disabled:bg-emerald-500/50 disabled:shadow-none",
      secondary:
        "border border-white/10 bg-white/[0.04] text-zinc-200 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_2px_10px_-4px_rgba(0,0,0,0.5)] hover:border-white/20 hover:bg-white/[0.08] active:translate-y-px",
      ghost: "text-zinc-500 hover:bg-white/5 hover:text-zinc-200 active:translate-y-px",
      danger: "text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 active:translate-y-px",
    };

    const sizes = {
      sm: "h-8 px-3 text-[12px]",
      md: "h-10 px-4 text-[13px]",
      lg: "h-12 px-6 text-[14px]",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-[background-color,border-color,transform,box-shadow,color] duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400/25 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
