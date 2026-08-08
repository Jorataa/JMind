"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Download, Upload, Trash2, Check, User } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/stores/use-toast-store";
import { cn } from "@/lib/cn";
import { useTheme, THEMES, THEME_STORAGE_KEY } from "@/hooks/use-theme";
import { useUserName, useUIActions, useUIStore } from "@/stores/use-ui-store";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import {
  buildOutlineMarkdown,
  buildMapJson,
  exportFileName,
  downloadTextFile,
} from "@/lib/export";
import SyncSettings from "@/features/sync/SyncSettings";

// Every JSON-persisted store — the full local workspace, nothing forgotten.
const STORAGE_KEYS = [
  "jmind:mindmap",
  "jmind:tasks",
  "jmind:kpis",
  "jmind:focus",
  "jmind:activity",
  "jmind:inbox",
  "jmind:wisdom",
  "jmind:wisdom-bg",
  "jmind:groves",
  "jmind:notes",
  "jmind:knowledge",
  "jmind:calendar",
  "jmind:ui",
];
// Plain-string keys (not JSON envelopes) — backed up as raw values.
const RAW_KEYS = [THEME_STORAGE_KEY];

const GLOBAL_SHORTCUTS: [string, string][] = [
  ["Ctrl + K", "Command palette — find, create, ask"],
  ["Ctrl + J", "Capture a thought"],
  ["N", "New thought (capture)"],
  ["J", "Ask Jorata — the assistant dock"],
];

const CANVAS_SHORTCUTS: [string, string][] = [
  ["2× Click", "New idea at cursor"],
  ["Tab", "New child of selected idea"],
  ["V · N · C", "Select · Node · Connect tools"],
  ["S", "New sticky note"],
  ["Enter / F2", "Rename selected idea"],
  ["Del / Backspace", "Delete selection"],
  ["Ctrl + Z / + Shift", "Undo / redo"],
  ["I", "Toggle node details"],
  ["F", "Fit map to view"],
  ["Shift + T", "Tidy map layout"],
  ["Space + drag", "Pan the canvas"],
  ["Esc", "Cancel AI / close menus"],
];

const INBOX_SHORTCUTS: [string, string][] = [
  ["↑ ↓", "Move between captures"],
  ["N / T / M", "→ Note / → Task / → Map"],
  ["E", "Archive"],
];

const ANCHORS = [
  { id: "account", label: "Account" },
  { id: "sync", label: "Sync" },
  { id: "themes", label: "Themes" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "data", label: "Data" },
  { id: "about", label: "About" },
];

export default function SettingsPage() {
  const addToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const { theme, changeTheme } = useTheme();
  const userName = useUserName();
  const wisdomStripEnabled = useUIStore((state) => state.wisdomStripEnabled);
  const { setUserName, setWisdomStripEnabled } = useUIActions();

  // Disarm the destructive confirm if the user walks away.
  useEffect(() => {
    if (!confirmingClear) return;
    const timer = window.setTimeout(() => setConfirmingClear(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmingClear]);

  const handleExport = () => {
    const data: Record<string, unknown> = {};
    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        data[key] = JSON.parse(raw);
      } catch {
        // skip unreadable entries rather than failing the whole backup
      }
    }
    for (const key of RAW_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) data[key] = raw;
    }

    const payload = JSON.stringify(
      { app: "jmind", version: 1, exportedAt: new Date().toISOString(), data },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jorata-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addToast("Workspace exported", "success");
  };

  const handleImportFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed?.data;
      if (parsed?.app !== "jmind" || typeof data !== "object" || data === null) {
        throw new Error("not a jmind backup");
      }

      let applied = 0;
      for (const key of STORAGE_KEYS) {
        if (key in data) {
          localStorage.setItem(key, JSON.stringify(data[key]));
          applied++;
        }
      }
      for (const key of RAW_KEYS) {
        if (key in data && typeof data[key] === "string") {
          localStorage.setItem(key, data[key]);
          applied++;
        }
      }
      if (applied === 0) throw new Error("empty backup");

      // Reload so every store rehydrates through its sanitizers — imported
      // data gets exactly the same validation as any persisted data.
      window.location.reload();
    } catch {
      addToast("Import failed — that file isn't a Jorata backup", "error");
    }
  };

  const handleExportMapMarkdown = () => {
    const s = useMindMapStore.getState();
    const title = s.maps[s.activeMapId]?.title ?? "Mind Map";
    if (s.nodes.length <= 1) {
      addToast("This map is empty", "info");
      return;
    }
    downloadTextFile(
      exportFileName(title, "md"),
      buildOutlineMarkdown(title, s.nodes, s.edges),
      "text/markdown"
    );
    addToast("Mind map exported as Markdown", "success");
  };

  const handleExportMapJson = () => {
    const s = useMindMapStore.getState();
    const title = s.maps[s.activeMapId]?.title ?? "Mind Map";
    downloadTextFile(
      exportFileName(title, "json"),
      buildMapJson(title, s.nodes, s.edges),
      "application/json"
    );
    addToast("Mind map structure exported", "success");
  };

  const handleClearAll = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    [...STORAGE_KEYS, ...RAW_KEYS].forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-[1080px] px-5 pb-16 pt-6 md:px-9 md:pt-8">
      <PageHeader
        size="h1"
        context="Settings"
        title={
          <>
            Yours, <em>on your terms.</em>
          </>
        }
      />

      <div className="mt-8 flex gap-10">
        {/* Anchor list (§7) */}
        <nav aria-label="Settings sections" className="hidden w-[160px] shrink-0 md:block">
          <ul className="sticky top-8 flex flex-col gap-[2px]">
            {ANCHORS.map((anchor) => (
              <li key={anchor.id}>
                <a
                  href={`#${anchor.id}`}
                  className="block rounded-[10px] px-3 py-2 text-[13px] text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900"
                >
                  {anchor.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-10">
          {/* ── Account ── */}
          <Section id="account" title="Account">
            <SettingCard>
              <Row
                title="Your name"
                description="Used for the greeting on your Dashboard."
              >
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="What should we call you?"
                  maxLength={40}
                  className="h-10 w-full max-w-[240px] rounded-full border border-line-strong bg-card px-4 text-[13.5px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-emerald-500"
                />
              </Row>
              <Divider />
              <Row
                title="Plan"
                description="Free while we grow — everything included."
              >
                <span className="rounded-full bg-sage-surface px-3 py-1 text-[12px] font-medium text-green-800">
                  Free
                </span>
              </Row>
            </SettingCard>
          </Section>

          {/* ── Sync ── */}
          <Section id="sync" title="Sync">
            <SettingCard>
              <p className="font-serif text-[16px] leading-relaxed text-ink-900">
                Local-first, by design.
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
                Everything lives on this device and works offline. Sync is
                opt-in: sign in to back your workspace up and use it
                everywhere. Signing out never deletes local data.
              </p>
            </SettingCard>
            <SyncSettings />
          </Section>

          {/* ── Themes ── */}
          <Section id="themes" title="Themes">
            <SettingCard>
              <Row title="Pick your green" description="One accent recolours the whole app — paper and ink stay put.">
                <span />
              </Row>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => changeTheme(t.id)}
                    aria-pressed={theme === t.id}
                    className={cn(
                      "flex flex-col gap-2 rounded-inner border p-2.5 text-left transition-all duration-150",
                      theme === t.id
                        ? "border-transparent shadow-float-1"
                        : "border-line-hair hover:border-line-strong"
                    )}
                    style={theme === t.id ? { outline: `1.5px solid ${t.accent}` } : undefined}
                  >
                    <ThemePreview accent={t.accent} />
                    <span className="flex items-center gap-1.5 px-0.5">
                      <span className="text-[12.5px] font-semibold text-ink-900">{t.label}</span>
                      {theme === t.id && <Check size={12} style={{ color: t.accent }} />}
                    </span>
                  </button>
                ))}
              </div>
              <Divider />
              <Row
                title="Daily Wisdom strip"
                description="A quiet line above the Dashboard each morning — click it to open the Sanctuary."
              >
                <Toggle
                  checked={wisdomStripEnabled}
                  onChange={setWisdomStripEnabled}
                  label="Show the Daily Wisdom strip"
                />
              </Row>
            </SettingCard>
          </Section>

          {/* ── Shortcuts ── */}
          <Section id="shortcuts" title="Shortcuts">
            <SettingCard>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-8">
                  <ShortcutGroup title="Everywhere" shortcuts={GLOBAL_SHORTCUTS} />
                  <ShortcutGroup title="Inbox triage" shortcuts={INBOX_SHORTCUTS} />
                </div>
                <ShortcutGroup title="Workspace canvas" shortcuts={CANVAS_SHORTCUTS} />
              </div>
            </SettingCard>
          </Section>

          {/* ── Data ── */}
          <Section id="data" title="Data">
            <SettingCard>
              <Row
                title="Export everything"
                description="Maps, tasks, notes, goals, sources, reflections — one JSON file."
              >
                <Button variant="secondary" size="sm" onClick={handleExport}>
                  <Download size={13} />
                  Export JSON
                </Button>
              </Row>
              <Divider />
              <Row
                title="Import a backup"
                description="Restore a previous export. Replaces the current workspace."
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} />
                  Import JSON
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportFile(file);
                    e.target.value = "";
                  }}
                />
              </Row>
              <Divider />
              <Row
                title="Export the open map"
                description="As a Markdown outline or raw JSON — PNG export lives on the canvas (Share)."
              >
                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" size="sm" onClick={handleExportMapMarkdown}>
                    Markdown
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleExportMapJson}>
                    JSON
                  </Button>
                </div>
              </Row>
              <Divider />
              <Row
                title="Clear all data"
                description="Permanently erase this workspace and start fresh. Export first if unsure."
              >
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={cn(
                    "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-medium transition-colors",
                    confirmingClear
                      ? "bg-clay-500 text-white"
                      : "border border-clay-border bg-clay-bg text-clay-text hover:border-clay-500"
                  )}
                >
                  <Trash2 size={13} />
                  {confirmingClear ? "Click again to confirm" : "Clear data"}
                </button>
              </Row>
            </SettingCard>
          </Section>

          {/* ── About ── */}
          <Section id="about" title="About">
            <SettingCard>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-serif text-[18px] text-ink-900">Jorata</p>
                  <p className="mt-1.5 max-w-[520px] text-[13px] leading-relaxed text-ink-600">
                    A quiet room for a loud mind — capture thoughts, shape them on
                    the canvas, and turn them into action. Built local-first: your
                    data stays on this device by default, and sync is always your
                    choice.
                  </p>
                  <p className="mt-3 font-mono text-[11px] text-ink-400">
                    Think → Plan → Execute → Measure
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-evergreen-950 px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-evergreen-900"
                >
                  <User size={14} /> Creator Profile
                </Link>
              </div>
            </SettingCard>
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ── Building blocks ── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-label={title} className="scroll-mt-8">
      <h2 className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function SettingCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line-hair bg-card p-6">{children}</div>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h4 className="text-[14px] font-semibold text-ink-900">{title}</h4>
        <p className="text-[12.5px] leading-relaxed text-ink-600">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-5 h-px bg-line-soft" />;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-emerald-500" : "bg-track"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-float-1 transition-all duration-200",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

/** Live mini-dashboard preview in the candidate accent (§7). */
function ThemePreview({ accent }: { accent: string }) {
  return (
    <div className="relative h-16 w-full overflow-hidden rounded-[10px] border border-line-hair bg-paper">
      {/* rail */}
      <div className="absolute inset-y-0 left-0 w-[14px] bg-evergreen-950">
        <div className="mx-auto mt-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      {/* hero card */}
      <div className="absolute left-[20px] top-1.5 h-6 w-[52px] rounded-[4px] bg-evergreen-950">
        <div className="ml-1.5 mt-1.5 h-1 w-7 rounded-full bg-[rgba(233,237,224,0.35)]" />
        <div className="ml-1.5 mt-1 h-1 w-4 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      {/* paper cards */}
      <div className="absolute right-1.5 top-1.5 h-6 w-[26px] rounded-[4px] border border-line-hair bg-card" />
      <div className="absolute bottom-1.5 left-[20px] h-5 w-[38px] rounded-[4px] border border-line-hair bg-card">
        <div className="ml-1 mt-1 h-1 w-5 rounded-full bg-sunken" />
      </div>
      <div className="absolute bottom-1.5 right-1.5 flex h-5 w-[40px] items-center justify-center rounded-[4px]" style={{ backgroundColor: accent }}>
        <div className="h-1 w-6 rounded-full bg-white/70" />
      </div>
    </div>
  );
}

function ShortcutGroup({ title, shortcuts }: { title: string; shortcuts: [string, string][] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">{title}</p>
      <div className="flex flex-col gap-2.5">
        {shortcuts.map(([keys, action]) => (
          <div key={keys} className="flex items-center justify-between gap-6">
            <span className="text-[12.5px] text-ink-600">{action}</span>
            <kbd className="shrink-0 rounded-kbd border border-line-hair bg-sunken px-1.5 py-0.5 font-mono text-[10.5px] text-ink-600">
              {keys}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
