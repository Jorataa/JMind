"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import {
  useKnowledgeSources,
  useKnowledgeActions,
  type KnowledgeSource,
  type SourceType,
} from "@/stores/use-knowledge-store";
import { useGroves, GROVE_DOT_CLASS, type Grove } from "@/stores/use-grove-store";
import { useNoteActions } from "@/stores/use-note-store";
import { useUIActions } from "@/stores/use-ui-store";
import { useToast } from "@/stores/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDate } from "@/lib/format-date";
import { inferSourceType as inferType, titleFromUrl } from "@/lib/source-utils";
import { cn } from "@/lib/cn";
import {
  Link2,
  Trash2,
  FileUp,
  ChevronDown,
  Sparkles,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Search,
} from "lucide-react";

/**
 * Knowledge (design pass 2): the reading shelf that actually works. Save a
 * link → Jorata reads it and keeps the gist → ask about it or turn it into a
 * note. Rows expand in place; nothing needs a second page.
 */

const TYPE_BADGE: Record<SourceType, { label: string; className: string }> = {
  pdf: { label: "PDF", className: "bg-clay-bg text-clay-text" },
  yt: { label: "YT", className: "bg-sage-surface text-green-800" },
  web: { label: "WEB", className: "bg-sunken text-ink-600" },
};

const TYPE_FILTERS: { id: SourceType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "web", label: "Links" },
  { id: "pdf", label: "PDFs" },
  { id: "yt", label: "Videos" },
];

export default function KnowledgePage() {
  const hydrated = useHydrated();
  const sources = useKnowledgeSources();
  const { addSource, removeSource, updateSource } = useKnowledgeActions();
  const groves = useGroves();
  const { addNote } = useNoteActions();
  const { openAssistant } = useUIActions();
  const addToast = useToast();

  const [input, setInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SourceType | "all">("all");
  // Transient failure detail per source (the store only keeps the state).
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAdd = () => {
    const value = input.trim();
    if (!value) return;
    const isUrl = /^(https?:\/\/|www\.)/i.test(value) || value.includes(".");
    const source = addSource(isUrl ? titleFromUrl(value) : value, inferType(value), {
      url: isUrl ? value : undefined,
    });
    setInput("");
    setExpandedId(source.id);
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
    if (text) {
      const source = addSource(titleFromUrl(text), inferType(text), { url: text });
      setExpandedId(source.id);
    }
  };

  const summarize = async (source: KnowledgeSource) => {
    if (!source.url) return;
    updateSource(source.id, { summaryState: "pending" });
    setErrors((prev) => ({ ...prev, [source.id]: "" }));
    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: source.url, title: source.title }),
      });
      const data = (await response.json()) as {
        summary?: string;
        keyPoints?: string[];
        error?: string;
      };
      if (!response.ok || !data.summary) {
        throw new Error(data.error || "Couldn't summarize that page.");
      }
      const points = (data.keyPoints ?? []).map((p) => `• ${p}`).join("\n");
      updateSource(source.id, {
        summary: points ? `${data.summary}\n\n${points}` : data.summary,
        summaryState: "ready",
      });
    } catch (error) {
      updateSource(source.id, { summaryState: "failed" });
      setErrors((prev) => ({
        ...prev,
        [source.id]:
          error instanceof Error ? error.message : "Couldn't summarize that page.",
      }));
    }
  };

  const askAbout = (source: KnowledgeSource) => {
    const gist = source.summary
      ? `\n\nWhat it says: ${source.summary.slice(0, 600)}`
      : "";
    openAssistant(
      `I saved this source: "${source.title}"${source.url ? ` (${source.url})` : ""}.${gist}\n\nWhat's worth taking from it?`
    );
  };

  const saveAsNote = (source: KnowledgeSource) => {
    const body = [
      source.summary ?? "",
      source.url ? `Source: ${source.url}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    addNote({ title: source.title, body });
    addToast("Saved to Notes", "success");
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources.filter(
      (s) =>
        (typeFilter === "all" || s.type === typeFilter) &&
        (!q || s.title.toLowerCase().includes(q) || s.url?.toLowerCase().includes(q))
    );
  }, [sources, query, typeFilter]);

  const showFilters = hydrated && sources.length > 5;

  return (
    <div className="mx-auto max-w-[1080px] px-5 pb-12 pt-6 md:px-9 md:pt-8">
      <PageHeader
        size="h1"
        context={
          hydrated && sources.length > 0
            ? `Knowledge — ${sources.length} ${sources.length === 1 ? "source" : "sources"}`
            : "Knowledge"
        }
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
        <p className="mx-auto mt-1 max-w-[420px] text-[12.5px] leading-relaxed text-ink-500">
          Jorata reads saved links and keeps the gist, so you can ask about
          them later.
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

      {/* Filter row — appears once the shelf is worth searching */}
      {showFilters && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full border border-line-hair bg-card pl-3.5 pr-3 sm:max-w-[280px]">
            <Search size={13} className="shrink-0 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sources…"
              className="w-full bg-transparent text-[12.5px] text-ink-700 placeholder:text-ink-400 focus:outline-none"
              aria-label="Search sources"
            />
          </div>
          <div className="flex items-center gap-1">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setTypeFilter(filter.id)}
                aria-pressed={typeFilter === filter.id}
                className={cn(
                  "h-8 rounded-full px-3 text-[12px] transition-colors",
                  typeFilter === filter.id
                    ? "bg-evergreen-900 font-medium text-[#E9EDE0]"
                    : "border border-line-hair bg-card text-ink-600 hover:text-ink-900"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Source rows */}
      {!hydrated ? (
        <div className="mt-6 flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-shimmer h-14 rounded-inner" />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <EmptyShelf />
      ) : visible.length === 0 ? (
        <p className="mt-8 text-center text-[13px] text-ink-500">
          Nothing matches — try a different search or filter.
        </p>
      ) : (
        <ul className="mt-6 overflow-hidden rounded-card border border-line-hair bg-card">
          {visible.map((source, i) => (
            <SourceRow
              key={source.id}
              source={source}
              first={i === 0}
              grove={groves.find((g) => g.id === source.groveId)}
              expanded={expandedId === source.id}
              error={errors[source.id]}
              onToggle={() =>
                setExpandedId(expandedId === source.id ? null : source.id)
              }
              onSummarize={() => void summarize(source)}
              onAsk={() => askAbout(source)}
              onSaveNote={() => saveAsNote(source)}
              onRemove={() => removeSource(source.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** What this page is for, told as the three steps the user will take. */
function EmptyShelf() {
  const steps = [
    {
      icon: <Link2 size={15} />,
      title: "Save anything worth reading",
      body: "Paste a link or drop a PDF — articles, papers, videos.",
    },
    {
      icon: <Sparkles size={15} />,
      title: "Jorata reads it for you",
      body: "One click and the gist is kept here: a short summary plus key points.",
    },
    {
      icon: <MessageCircle size={15} />,
      title: "Think with it",
      body: "Ask Jorata about a source, or turn the summary into a note.",
    },
  ];
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {steps.map((step, i) => (
        <div
          key={step.title}
          className="rounded-card border border-line-hair bg-card p-5"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-surface text-green-800">
              {step.icon}
            </span>
            <span className="font-mono text-[11px] text-ink-400">0{i + 1}</span>
          </div>
          <p className="mt-3 text-[13.5px] font-semibold text-ink-900">{step.title}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600">{step.body}</p>
        </div>
      ))}
    </div>
  );
}

function SourceRow({
  source,
  first,
  grove,
  expanded,
  error,
  onToggle,
  onSummarize,
  onAsk,
  onSaveNote,
  onRemove,
}: {
  source: KnowledgeSource;
  first: boolean;
  grove?: Grove;
  expanded: boolean;
  error?: string;
  onToggle: () => void;
  onSummarize: () => void;
  onAsk: () => void;
  onSaveNote: () => void;
  onRemove: () => void;
}) {
  const badge = TYPE_BADGE[source.type];
  const canSummarize = source.type === "web" && Boolean(source.url);
  const pending = source.summaryState === "pending";

  // Stored as "paragraph\n\n• point\n• point" — split back for display.
  const summaryLines = (source.summary ?? "").split("\n").filter(Boolean);
  const paragraph = summaryLines.filter((l) => !l.startsWith("• ")).join(" ");
  const points = summaryLines.filter((l) => l.startsWith("• "));

  return (
    <li className={cn(!first && "border-t border-line-soft")}>
      {/* Collapsed row — the whole line is the expand toggle */}
      <div
        className={cn(
          "group flex w-full cursor-pointer items-center gap-3.5 px-5 py-3.5 text-left transition-colors",
          expanded ? "bg-[#FAF8F1]" : "hover:bg-[#FAF8F1]"
        )}
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={expanded}
        aria-label={`${source.title} — details`}
      >
        <span
          className={cn(
            "shrink-0 rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide",
            badge.className
          )}
        >
          {badge.label}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-900">
          {source.title}
        </span>
        <span className="hidden shrink-0 text-[12px] sm:block">
          {pending ? (
            <span className="flex items-center gap-1.5 text-ink-500">
              <Loader2 size={11} className="animate-spin" />
              reading…
            </span>
          ) : source.summaryState === "ready" ? (
            <span className="text-green-800">summary ready</span>
          ) : source.summaryState === "failed" ? (
            <span className="text-clay-text">couldn&apos;t read</span>
          ) : (
            <span className="text-ink-500">saved</span>
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
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-ink-400 transition-transform duration-150",
            expanded && "rotate-180"
          )}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-line-soft bg-[#FAF8F1] px-5 pb-4 pt-4">
          {source.summaryState === "ready" && source.summary ? (
            <div className="rounded-inner bg-sage-surface p-4">
              <p className="font-serif text-[14.5px] leading-[1.5] text-ink-900">
                {paragraph}
              </p>
              {points.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2 text-[12.5px] leading-relaxed text-ink-700"
                    >
                      <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-green-800/60" />
                      {point.slice(2)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : pending ? (
            <div className="flex items-center gap-2.5 rounded-inner bg-sage-surface/60 p-4 text-[13px] text-ink-600">
              <Loader2 size={14} className="animate-spin text-green-800" />
              Reading the page and writing the gist…
            </div>
          ) : source.summaryState === "failed" ? (
            <div className="rounded-inner border border-clay-border bg-clay-bg px-4 py-3 text-[12.5px] leading-relaxed text-clay-text">
              {error || "Couldn't read that page — it may block readers or need a login."}
            </div>
          ) : canSummarize ? (
            <p className="text-[12.5px] leading-relaxed text-ink-600">
              Get the gist without leaving Jorata — a short summary and the key
              points, kept right here.
            </p>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-ink-500">
              {source.type === "pdf"
                ? "PDF contents stay on your device — Jorata keeps the reference. Summaries for PDFs are on the roadmap."
                : "Video transcripts aren't readable yet — the link is safe here, and summaries for videos are on the roadmap."}
            </p>
          )}

          {/* Verbs */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {canSummarize && !pending && (
              <button
                type="button"
                onClick={onSummarize}
                className="flex h-8 items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                <Sparkles size={12} />
                {source.summaryState === "ready"
                  ? "Refresh summary"
                  : source.summaryState === "failed"
                    ? "Try again"
                    : "Summarize"}
              </button>
            )}
            <button
              type="button"
              onClick={onAsk}
              className="flex h-8 items-center gap-1.5 rounded-full border border-[#C9C4B4] bg-card px-3.5 text-[12px] font-medium text-green-800 transition-colors hover:border-green-800"
            >
              <MessageCircle size={12} />
              Ask Jorata
            </button>
            {source.summary && (
              <button
                type="button"
                onClick={onSaveNote}
                className="flex h-8 items-center gap-1.5 rounded-full border border-[#C9C4B4] bg-card px-3.5 text-[12px] font-medium text-green-800 transition-colors hover:border-green-800"
              >
                <FileText size={12} />
                Save as note
              </button>
            )}
            {source.url && (
              <a
                href={source.url.startsWith("http") ? source.url : `https://${source.url}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] text-ink-600 transition-colors hover:text-ink-900"
              >
                <ExternalLink size={12} />
                Open
              </a>
            )}
            <span className="flex-1" />
            <button
              type="button"
              onClick={onRemove}
              className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] text-ink-500 transition-colors hover:bg-clay-bg hover:text-clay-text"
              aria-label={`Remove ${source.title}`}
            >
              <Trash2 size={12} />
              Remove
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
