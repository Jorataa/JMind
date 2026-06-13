import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 active:scale-[0.98] shadow-[0_4px_12px_rgba(16,185,129,0.2)] disabled:bg-emerald-500/50",
      secondary: "border border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98] shadow-lg",
      ghost: "text-zinc-500 hover:bg-white/5 hover:text-zinc-200 active:scale-[0.98]",
      danger: "text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 active:scale-[0.98]",
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
          "inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:pointer-events-none disabled:opacity-50",
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
