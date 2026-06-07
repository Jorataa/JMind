import { cn } from "@/lib/cn";

interface ProgressBarProps {
  progress: number;
  className?: string;
  barClassName?: string;
  variant?: "emerald" | "sky" | "rose";
}

export const ProgressBar = ({ progress, className, barClassName, variant = "sky" }: ProgressBarProps) => {
  const variants = {
    emerald: "bg-emerald-400",
    sky: "bg-sky-400",
    rose: "bg-rose-400",
  };

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          variants[variant],
          barClassName
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
