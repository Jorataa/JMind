import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Card surfaces (design handoff §6.4).
 *  - paper  resting card: paper-card + 1px hairline, radius 18
 *  - dark   evergreen anchor card (hero/brief moments)
 *  - sage   AI material — no border, sage surface
 * Borders carry structure; shadows only appear on hover of clickable cards.
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: "paper" | "dark" | "sage";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, variant = "paper", ...props }, ref) => {
    const variants = {
      paper: "border border-line-hair bg-card",
      dark: "bg-evergreen-950 text-[#E9EDE0]",
      sage: "bg-sage-surface",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col rounded-card p-5 transition-all duration-120",
          variants[variant],
          hoverable &&
            variant === "paper" &&
            "cursor-pointer hover:border-[#CFC9B8] hover:shadow-float-1",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
