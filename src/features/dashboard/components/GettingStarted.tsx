"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Network, ArrowRight } from "lucide-react";
import { useUIActions } from "@/stores/use-ui-store";

/**
 * The first thing a brand-new user sees: one calm line explaining what Jorata
 * is, and one clear action to begin. Quieter secondary entry points sit below
 * so there's a single obvious place to start. Shown only while the workspace is
 * empty; it disappears on its own once real data exists.
 */
export default function GettingStarted() {
  const { setQuickCaptureOpen } = useUIActions();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-7 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.10),transparent_55%)] px-6 py-14 text-center"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400/80">
          Welcome to Jorata
        </span>
        <h2 className="max-w-xl text-balance text-[26px] font-semibold leading-tight tracking-tight text-zinc-50 sm:text-[32px]">
          A calm space to map your thinking and turn it into action.
        </h2>
        <p className="text-[14px] text-zinc-500">
          Start with a map — everything connects from there.
        </p>
      </div>

      <Link
        href="/mindmap"
        className="group inline-flex h-12 items-center gap-2.5 rounded-xl bg-emerald-500 px-6 text-[15px] font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400"
      >
        <Network size={18} />
        Create your first mind map
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </Link>

      <div className="flex items-center gap-5 text-[13px] text-zinc-500">
        <Link href="/tasks" className="transition-colors hover:text-zinc-300">
          Add a task
        </Link>
        <span className="h-3 w-px bg-white/10" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setQuickCaptureOpen(true)}
          className="transition-colors hover:text-zinc-300"
        >
          Capture a thought
        </button>
      </div>
    </motion.section>
  );
}
