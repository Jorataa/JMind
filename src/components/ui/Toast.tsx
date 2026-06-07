"use client";

import { useToastStore } from "@/stores/use-toast-store";
import { cn } from "@/lib/cn";

export const ToastProvider = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={cn(
            "flex min-w-[280px] cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-zinc-900/90 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-full duration-300",
            toast.type === "success" && "border-emerald-500/20 text-emerald-400",
            toast.type === "error" && "border-rose-500/20 text-rose-400",
            toast.type === "info" && "border-sky-500/20 text-sky-400"
          )}
        >
          <p className="text-[13px] font-semibold">{toast.message}</p>
          <button className="text-zinc-500 hover:text-zinc-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
