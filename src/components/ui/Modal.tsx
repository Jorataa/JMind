"use client";

import { useEffect, ReactNode } from "react";
import { cn } from "@/lib/cn";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-panel animate-in zoom-in-95 duration-200",
          // Light-catch along the top edge, echoing Card — dialogs feel part of
          // the same crafted surface language rather than a plain grey box.
          "before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/[0.12] before:to-transparent",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-[18px] font-semibold text-zinc-50">{title}</h3>
          {description && (
            <p className="text-[13px] text-zinc-500">{description}</p>
          )}
        </div>
        <div className="mt-6">{children}</div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
