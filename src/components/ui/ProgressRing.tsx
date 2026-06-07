import { cn } from "@/lib/cn";

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  stroke?: number;
  className?: string;
  variant?: "emerald" | "sky" | "rose";
}

export const ProgressRing = ({
  progress,
  size = 60,
  stroke = 6,
  className,
  variant = "emerald",
}: ProgressRingProps) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const variants = {
    emerald: "stroke-emerald-400",
    sky: "stroke-sky-400",
    rose: "stroke-rose-400",
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          className="text-white/5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-out", variants[variant])}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-zinc-100">
        {progress}%
      </div>
    </div>
  );
};
