"use client";

import { useToastStore } from "@/stores/use-toast-store";
import { cn } from "@/lib/cn";

/**
 * Toasts (design handoff §6.9): evergreen pill, white 13px text, action in
 * emerald-300, bottom-center, level-3 shadow. Errors warm to clay.
 */
export const ToastProvider = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[140] flex flex-col items-center gap-2 max-md:bottom-[84px]"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex max-w-[90vw] items-center gap-3 rounded-full bg-evergreen-950 py-2.5 pl-5 pr-3 text-[13px] text-[#F1F3EA] shadow-float-3",
            toast.type === "error" && "bg-clay-500"
          )}
        >
          <p className="min-w-0 truncate">{toast.message}</p>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onAction();
                removeToast(toast.id);
              }}
              className="shrink-0 rounded-full px-2 py-0.5 font-medium text-emerald-300 transition-colors hover:bg-[rgba(233,237,224,0.1)]"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="shrink-0 rounded-full p-1 text-rail-muted transition-colors hover:text-[#F1F3EA]"
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
