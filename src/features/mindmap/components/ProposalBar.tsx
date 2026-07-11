"use client";

import { Panel } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  useMindMapActions,
  useProposedCount,
  useProposalPick,
} from "@/stores/use-mindmap-store";
import { useToast } from "@/stores/use-toast-store";

/**
 * The proposal header (§5.1/§5.2, §6.8): appears whenever AI-proposed material
 * is pending on the canvas. Keep all / Pick / Discard — plus Regenerate and
 * Refine when the proposals came from map generation. One action, one undo.
 */
export default function ProposalBar({
  onRegenerate,
  onRefine,
  busy,
}: {
  onRegenerate?: () => void;
  onRefine?: () => void;
  busy?: boolean;
}) {
  const count = useProposedCount();
  const pick = useProposalPick();
  const { resolveProposals, discardProposals, startPick, cancelPick } =
    useMindMapActions();
  const addToast = useToast();

  if (count === 0) return null;

  const picking = pick !== null;
  const keepCount = pick?.length ?? 0;

  return (
    <Panel position="top-center" className="z-10 !mt-[60px]">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        role="status"
        aria-live="polite"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-inner border-[1.5px] border-dashed border-sage-dash bg-sage-surface py-2 pl-4 pr-2 shadow-float-2"
      >
        <span className="flex items-center gap-2">
          <span className="ai-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-green-800">
            {picking
              ? `Keeping ${keepCount} of ${count}`
              : `Jorata proposed ${count} idea${count === 1 ? "" : "s"}`}
          </span>
        </span>

        <span className="flex items-center gap-1.5">
          {picking ? (
            <>
              <button
                type="button"
                onClick={() => {
                  resolveProposals(pick ?? []);
                  addToast(
                    keepCount > 0 ? `Kept ${keepCount} idea${keepCount === 1 ? "" : "s"}` : "Proposals discarded",
                    "success"
                  );
                }}
                className="rounded-full bg-evergreen-900 px-3.5 py-1.5 text-[12px] font-medium text-[#E9EDE0] transition-colors hover:bg-evergreen-deep"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={cancelPick}
                className="rounded-full px-2.5 py-1.5 text-[12px] text-ink-600 transition-colors hover:text-ink-900"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  resolveProposals("all");
                  addToast(`Kept all ${count} ideas`, "success");
                }}
                disabled={busy}
                className="rounded-full bg-evergreen-900 px-3.5 py-1.5 text-[12px] font-medium text-[#E9EDE0] transition-colors hover:bg-evergreen-deep disabled:opacity-40"
              >
                Keep all
              </button>
              <button
                type="button"
                onClick={startPick}
                disabled={busy}
                className="rounded-full border border-sage-500 px-3 py-1.5 text-[12px] text-green-800 transition-colors hover:border-green-800 disabled:opacity-40"
              >
                Pick
              </button>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={busy}
                  className="rounded-full border border-sage-500 px-3 py-1.5 text-[12px] text-green-800 transition-colors hover:border-green-800 disabled:opacity-40"
                >
                  {busy ? "Thinking…" : "Regenerate"}
                </button>
              )}
              {onRefine && (
                <button
                  type="button"
                  onClick={onRefine}
                  disabled={busy}
                  className="rounded-full px-2.5 py-1.5 text-[12px] text-ink-600 transition-colors hover:text-ink-900 disabled:opacity-40"
                >
                  Refine
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  discardProposals();
                  addToast("Proposals discarded — Ctrl+Z brings them back", "info");
                }}
                disabled={busy}
                className="rounded-full px-2.5 py-1.5 text-[12px] text-ink-600 transition-colors hover:text-ink-900 disabled:opacity-40"
              >
                Discard
              </button>
            </>
          )}
        </span>
      </motion.div>
    </Panel>
  );
}
