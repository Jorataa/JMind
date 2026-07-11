"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import {
  useKnowledgeSources,
  useKnowledgeActions,
  type SourceType,
} from "@/stores/use-knowledge-store";
import { useGroves, GROVE_DOT_CLASS } from "@/stores/use-grove-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/cn";
import { Link2, Trash2, FileUp } from "lucide-react";

/**
 * Knowledge (design handoff §7): what the user saves to read and mine —
 * sources land here via drop or pasted link; AI summaries attach later.
 */

const TYPE_BADGE: Record<SourceType, { label: string; className: string }> = {
  pdf: { label: "PDF", className: "bg-clay-bg text-clay-text" },
  yt: { label: "YT", className: "bg-sage-surface text-green-800" },
  web: { label: "WEB", className: "bg-sunken text-ink-600" },
};

function inferType(input: string, isFile = false): SourceType {
  if (isFile || /\.pdf($|\?)/i.test(input)) return "pdf";
  if (/youtube\.com|youtu\.be/i.test(input)) return "yt";
  return "web";
}

/** "https://ai.example.com/paper" → "ai.example.com — paper" (best effort). */
function titleFromUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const tail = decodeURIComponent(
      u.pathname.split("/").filter(Boolean).pop() ?? ""
    ).replace(/[-_+]/g, " ");
    return tail ? `${u.hostname} — ${tail}` : u.hostname;
  } catch {
    return url;
  }
}

export default function KnowledgePage() {
  const hydrated = useHydrated();
  const sources = useKnowledgeSources();
  const { addSource, removeSource } = useKnowledgeActions();
  const groves = useGroves();
  const [input, setInput] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleAdd = () => {
    const value = input.trim();
    if (!value) return;
    const isUrl = /^(https?:\/\/|www\.)/i.test(value) || value.includes(".");
    addSource(isUrl ? titleFromUrl(value) : value, inferType(value), {
      url: isUrl ? value : undefined,
    });
    setInput("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      addSource(file.name.replace(/\.pdf$/i, ""), inferType(file.name, true));
      return;
    }
    const text = e.dataTransfer.getData("text/plain")?.trim();
    if (text) addSource(titleFromUrl(text), inferType(text), { url: text });
  };

  return (
    <div className="mx-auto max-w-[1080px] px-5 pb-12 pt-6 md:px-9 md:pt-8">
      <PageHeader
        size="h1"
        context="Knowledge"
        title={
          <>
            Sources, <em>ready to be mined.</em>
          </>
        }
      />

      {/* Import drop-zone (§7) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "mt-8 rounded-card border border-dashed p-7 text-center transition-colors",
          dragOver ? "border-emerald-500 bg-sage-surface/50" : "border-line-strong bg-card"
        )}
      >
        <FileUp size={20} className="mx-auto text-ink-500" strokeWidth={1.8} />
        <p className="mt-3 font-serif text-[19px] text-ink-900">
          Drop a PDF, paste a link
        </p>
        <div className="mx-auto mt-4 flex max-w-[440px] items-center gap-2">
          <div className="flex h-10 flex-1 items-center gap-2 rounded-full border border-line-strong bg-card pl-4 pr-2 focus-within:border-emerald-500">
            <Link2 size={14} className="shrink-0 text-ink-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="https://…"
              className="w-full bg-transparent text-[13.5px] text-ink-700 placeholder:text-ink-400 focus:outline-none"
              aria-label="Paste a link"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!input.trim()}
            className="h-10 rounded-full bg-evergreen-900 px-5 text-[13px] font-medium text-[#E9EDE0] transition-colors hover:bg-evergreen-deep disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>

      {/* Source rows */}
      {!hydrated ? (
        <div className="mt-6 flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-shimmer h-14 rounded-inner" />
          ))}
        </div>
      ) : sources.length > 0 ? (
        <ul className="mt-6 overflow-hidden rounded-card border border-line-hair bg-card">
          {sources.map((source, i) => {
            const grove = groves.find((g) => g.id === source.groveId);
            const badge = TYPE_BADGE[source.type];
            return (
              <li
                key={source.id}
                className={cn(
                  "group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[#FAF8F1]",
                  i > 0 && "border-t border-line-soft"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide",
                    badge.className
                  )}
                >
                  {badge.label}
                </span>
                {source.url ? (
                  <a
                    href={source.url.startsWith("http") ? source.url : `https://${source.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-900 hover:text-green-800"
                  >
                    {source.title}
                  </a>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-900">
                    {source.title}
                  </span>
                )}
                <span className="hidden shrink-0 text-[12px] text-ink-500 sm:block">
                  {source.summaryState === "ready" ? (
                    <span className="text-green-800">summary ready</span>
                  ) : (
                    "saved"
                  )}
                </span>
                {grove && (
                  <span
                    className={cn(
                      "hidden h-[7px] w-[7px] shrink-0 rounded-[3px] sm:block",
                      GROVE_DOT_CLASS[grove.color]
                    )}
                    title={grove.name}
                  />
                )}
                <span className="hidden shrink-0 font-mono text-[11px] text-ink-400 md:block">
                  {formatDate(source.addedAt)}
                </span>
                <button
                  type="button"
                  onClick={() => removeSource(source.id)}
                  className="shrink-0 rounded p-1 text-ink-400 opacity-0 transition-opacity hover:text-clay-500 group-hover:opacity-100"
                  aria-label={`Remove ${source.title}`}
                >
                  <Trash2 size={13.5} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 text-center text-[13px] text-ink-500">
          Saved sources appear here with their AI summaries.
        </p>
      )}
    </div>
  );
}
