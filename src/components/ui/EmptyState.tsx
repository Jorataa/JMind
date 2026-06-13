import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  /** Optional content below the action — e.g. quiet examples that teach the feature. */
  footer?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, footer, className }: EmptyStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center",
      className
    )}>
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-300">
          {icon}
        </div>
      )}
      <h3 className="mt-4 text-[16px] font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1 text-[13px] text-zinc-500 max-w-[280px] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );
};
