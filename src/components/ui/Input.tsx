import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "h-10 rounded-lg border border-white/10 bg-zinc-950/50 px-3 text-[13px] text-zinc-100 outline-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-zinc-600 focus:border-emerald-400/40 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-400/15 disabled:opacity-50",
            error && "border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/10",
            className
          )}
          {...props}
        />
        {error && <span className="text-[11px] text-rose-400">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
