
interface DashboardHeroProps {
  mission: string;
}

export default function DashboardHero({ mission }: DashboardHeroProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.15),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 shadow-2xl shadow-black/20">
      <div className="mb-8 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">
          Personal Operating System
        </span>
      </div>
      <div className="max-w-2xl">
        <h2 className="text-[32px] font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-[42px]">
          Build today around <br />
          <span className="text-emerald-400">{mission}</span>
        </h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          Capture loose thoughts, turn them into tasks, and keep your map
          close so planning and execution stay connected.
        </p>
      </div>
    </div>
  );
}
