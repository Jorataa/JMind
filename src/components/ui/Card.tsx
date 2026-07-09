import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-[background-color,border-color,box-shadow] duration-200",
          // Top hairline: a 1px light-catch across the card's upper edge — the
          // detail that makes a translucent surface read as crafted glass.
          "before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/[0.10] before:to-transparent",
          hoverable && "hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-elevated",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
