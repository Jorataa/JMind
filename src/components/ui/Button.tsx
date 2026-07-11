import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Button grammar (design handoff §6.3). All buttons are pills.
 *  - primary   dark evergreen — the one dark primary action per view
 *  - accent    emerald brand — capture / AI / brand contexts
 *  - secondary quiet outline on paper
 *  - ghost     text only
 *  - onDark    outline variant for dark (evergreen) surfaces
 *  - danger    clay — destructive affordances
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "ghost" | "onDark" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary:
        "bg-evergreen-900 text-[#E9EDE0] hover:bg-evergreen-deep active:translate-y-[0.5px]",
      accent:
        "bg-emerald-500 font-semibold text-white hover:bg-emerald-600 active:translate-y-[0.5px]",
      secondary:
        "border border-[#C9C4B4] bg-transparent text-green-800 hover:border-green-800 hover:bg-[rgba(36,82,59,0.04)] active:translate-y-[0.5px]",
      ghost: "text-ink-600 hover:text-ink-900 active:translate-y-[0.5px]",
      onDark:
        "border border-[rgba(233,237,224,0.2)] bg-transparent text-rail-text hover:border-[rgba(233,237,224,0.4)] hover:text-rail-bright active:translate-y-[0.5px]",
      danger:
        "text-clay-text hover:bg-clay-bg active:translate-y-[0.5px]",
    };

    const sizes = {
      sm: "h-8 px-3.5 text-[12.5px]",
      md: "h-9 px-[18px] text-[13.5px]",
      lg: "h-11 px-6 text-[14px]",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
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
