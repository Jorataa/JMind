"use client";

import { useEffect, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Dialog (design handoff §6.9): paper card, radius 18, level-3 shadow,
 * serif header, evergreen-tinted scrim.
 */
interface ModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}

export const Modal = ({ title, description, children, onClose, className }: ModalProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,41,31,0.32)] p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full max-w-md rounded-card border border-line-hair bg-card p-6 shadow-float-3",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1.5">
          <h3 className="font-serif text-[26px] leading-[1.15] text-ink-900">{title}</h3>
          {description && (
            <p className="text-[13.5px] leading-relaxed text-ink-600">{description}</p>
          )}
        </div>
        <div className="mt-5">{children}</div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
