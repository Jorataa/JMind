import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const SectionTitle = ({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn(
        "text-[11px] font-semibold uppercase tracking-widest text-zinc-500",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};
