import { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ContourRings } from "./ContourArt";

interface EmptyStateProps {
  /** Optional icon; when omitted the brand contour-rings artwork is shown (§7). */
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  /** Optional content below the action — e.g. quiet examples that teach the feature. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Empty state (design handoff §7): contour-rings artwork + a serif line +
 * one action. Calm, never a wall of dashed grey.
 */
export const EmptyState = ({ icon, title, description, action, footer, className }: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-surface text-green-800">
          {icon}
        </div>
      ) : (
        <ContourRings variant="sage" size={150} centerDot className="opacity-60" />
      )}
      <h3 className="mt-4 font-serif text-[22px] leading-snug text-ink-900">{title}</h3>
      <p className="mt-1.5 max-w-[300px] text-[13.5px] leading-relaxed text-ink-600">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );
};
