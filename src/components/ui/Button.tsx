import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-emerald-300 text-zinc-950 hover:bg-emerald-200 active:bg-emerald-400 disabled:bg-emerald-300/50",
      secondary: "border border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08] active:bg-white/10",
      ghost: "text-zinc-500 hover:bg-white/10 hover:text-zinc-200",
      danger: "text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400",
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
