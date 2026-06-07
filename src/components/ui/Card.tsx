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
          "relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all",
          hoverable && "hover:bg-white/[0.06] hover:shadow-xl hover:shadow-black/20",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
