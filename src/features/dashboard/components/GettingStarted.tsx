"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Network, CheckSquare, Inbox, ArrowRight } from "lucide-react";
import { useUIActions } from "@/stores/use-ui-store";
import { cn } from "@/lib/cn";

/**
 * Shown only while the workspace is empty — three clear entry points instead
 * of a wall of zero-metrics. Disappears on its own once real data exists.
 */
export default function GettingStarted() {
  const { setQuickCaptureOpen } = useUIActions();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Getting Started
        </h3>
        <span className="h-px flex-1 mx-4 bg-white/5" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StartCard
          href="/mindmap"
          icon={<Network size={18} />}
          color="violet"
          title="Open the canvas"
          description="Map your thinking visually. Double-click anywhere to drop an idea."
          delay={0}
        />
        <StartCard
          href="/tasks"
          icon={<CheckSquare size={18} />}
          color="emerald"
          title="Plan your first action"
          description="Turn intentions into a short, honest list for today."
          delay={0.05}
        />
        <StartCard
          onClick={() => setQuickCaptureOpen(true)}
          icon={<Inbox size={18} />}
          color="sky"
          title="Capture a thought"
          description="Get it out of your head now, organize it later."
          kbd="Ctrl + J"
          delay={0.1}
        />
      </div>
    </section>
  );
}

interface StartCardProps {
  icon: React.ReactNode;
  color: "violet" | "emerald" | "sky";
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  kbd?: string;
  delay: number;
}

function StartCard({ icon, color, title, description, href, onClick, kbd, delay }: StartCardProps) {
  const colorMap = {
    violet: "text-violet-400 border-violet-500/20 bg-violet-500/[0.03] hover:border-violet-500/40",
    emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.03] hover:border-emerald-500/40",
    sky: "text-sky-400 border-sky-500/20 bg-sky-500/[0.03] hover:border-sky-500/40",
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={cn(
        "group flex h-full flex-col gap-4 rounded-2xl border p-5 text-left transition-all",
        colorMap[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5">
          {icon}
        </div>
        {kbd ? (
          <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">
            {kbd}
          </kbd>
        ) : (
          <ArrowRight size={16} className="text-zinc-600 transition-transform group-hover:translate-x-1" />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h4 className="text-[14px] font-semibold text-zinc-100">{title}</h4>
        <p className="text-[12px] leading-relaxed text-zinc-500">{description}</p>
      </div>
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="h-full">{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className="h-full">
      {content}
    </button>
  );
}
