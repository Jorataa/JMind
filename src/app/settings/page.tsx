"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload, Trash2, Keyboard, Info, HardDrive, Palette, User, Network } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useToast } from "@/stores/use-toast-store";
import { cn } from "@/lib/cn";
import { useTheme, THEMES } from "@/hooks/use-theme";
import { useUserName, useUIActions } from "@/stores/use-ui-store";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import { exportToMarkdown, downloadMarkdown } from "@/lib/export-markdown";

const slugify = (s: string) =>
  s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "mind-map";

const JMIND_KEYS = [
  "jmind:mindmap",
  "jmind:tasks",
  "jmind:kpis",
  "jmind:focus",
  "jmind:activity",
  "jmind:inbox",
  "jmind:wisdom",
  "jmind:ui",
];

const GLOBAL_SHORTCUTS: [string, string][] = [
  ["Ctrl + K", "Command palette — search & quick actions"],
  ["Ctrl + J", "Quick capture a thought"],
];

const CANVAS_SHORTCUTS: [string, string][] = [
  ["2× Click", "New idea at cursor"],
  ["Tab", "New child of selected idea"],
  ["S", "New sticky note"],
  ["Right-click", "Create & node actions"],
  ["Enter / F2", "Rename selected idea"],
  ["Del / Backspace", "Delete selection"],
  ["Ctrl + Z", "Undo"],
  ["Ctrl + Shift + Z", "Redo"],
  ["I", "Toggle node details"],
  ["F", "Fit map to view"],
  ["Shift + T", "Tidy map layout"],
];

export default function SettingsPage() {
  const addToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const { theme, changeTheme } = useTheme();
  const userName = useUserName();
  const { setUserName } = useUIActions();

  // Disarm the destructive confirm if the user walks away.
  useEffect(() => {
    if (!confirmingClear) return;
    const timer = window.setTimeout(() => setConfirmingClear(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmingClear]);

  const handleExport = () => {
    const data: Record<string, unknown> = {};
    for (const key of JMIND_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        data[key] = JSON.parse(raw);
      } catch {
        // skip unreadable entries rather than failing the whole backup
      }
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
    anchor.download = `jmind-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
      for (const key of JMIND_KEYS) {
        if (key in data) {
          localStorage.setItem(key, JSON.stringify(data[key]));
          applied++;
        }
      }
      if (applied === 0) throw new Error("empty backup");

      // Reload so every store rehydrates through its sanitizers — imported
      // data gets exactly the same validation as any persisted data.
      window.location.reload();
    } catch {
      addToast("Import failed — that file isn't a JMind backup", "error");
    }
  };

  const handleExportMapMarkdown = () => {
    const s = useMindMapStore.getState();
    const title = s.maps[s.activeMapId]?.title ?? "Mind Map";
    const md = exportToMarkdown(s.nodes, s.edges);
    if (!md.trim()) {
      addToast("This map is empty", "info");
      return;
    }
    downloadMarkdown(md, `${slugify(title)}.md`);
    addToast("Mind map exported as Markdown", "success");
  };

  const handleExportMapJson = () => {
    const s = useMindMapStore.getState();
    const title = s.maps[s.activeMapId]?.title ?? "Mind Map";
    const payload = JSON.stringify(
      { app: "jmind", type: "mindmap", title, exportedAt: new Date().toISOString(), nodes: s.nodes, edges: s.edges },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(title)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addToast("Mind map structure exported", "success");
  };

  const handleClearAll = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    JMIND_KEYS.forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-bold tracking-tight text-zinc-50">Settings</h2>
          <p className="text-[13px] text-zinc-500">
            Your workspace lives entirely on this device — no account, no cloud.
          </p>
        </div>

        {/* Profile */}
        <section className="flex flex-col gap-3">
          <SectionTitle className="flex items-center gap-2">
            <User size={12} />
            Profile
          </SectionTitle>
          <Card className="flex flex-col gap-4 p-6" hoverable={false}>
            <div className="flex flex-col gap-1">
              <h4 className="text-[14px] font-semibold text-zinc-200">Your name</h4>
              <p className="text-[12px] text-zinc-500">Used for the greeting on your dashboard.</p>
            </div>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="What should we call you?"
              maxLength={40}
              className="h-10 w-full max-w-xs rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[14px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/30"
            />
          </Card>
        </section>

        {/* Appearance */}
        <section className="flex flex-col gap-3">
          <SectionTitle className="flex items-center gap-2">
            <Palette size={12} />
            Appearance
          </SectionTitle>
          <Card className="flex flex-col gap-4 p-6" hoverable={false}>
            <div className="flex flex-col gap-1">
              <h4 className="text-[14px] font-semibold text-zinc-200">Theme</h4>
              <p className="text-[12px] text-zinc-500">Choose how JMind looks to you.</p>
            </div>
            <div className="flex gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => changeTheme(t.id)}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all duration-150 cursor-pointer",
                    theme === t.id
                      ? "border-emerald-500/60 bg-emerald-500/8 shadow-[0_0_12px_rgba(52,211,153,0.12)]"
                      : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                  )}
                >
                  <ThemePreview id={t.id} active={theme === t.id} />
                  <span className={cn("text-[13px] font-semibold", theme === t.id ? "text-zinc-100" : "text-zinc-300")}>
                    {t.label}
                  </span>
                  <span className="text-[11px] text-zinc-500">{t.description}</span>
                </button>
              ))}
            </div>
          </Card>
        </section>

        {/* Keyboard shortcuts */}
        <section className="flex flex-col gap-3">
          <SectionTitle className="flex items-center gap-2">
            <Keyboard size={12} />
            Keyboard Shortcuts
          </SectionTitle>
          <Card className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2" hoverable={false}>
            <ShortcutGroup title="Everywhere" shortcuts={GLOBAL_SHORTCUTS} />
            <ShortcutGroup title="Mind Map Canvas" shortcuts={CANVAS_SHORTCUTS} />
          </Card>
        </section>

        {/* Data management */}
        <section className="flex flex-col gap-3">
          <SectionTitle className="flex items-center gap-2">
            <HardDrive size={12} />
            Workspace Data
          </SectionTitle>
          <Card className="flex flex-col gap-6 p-6" hoverable={false}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h4 className="text-[14px] font-semibold text-zinc-200">Export backup</h4>
                <p className="text-[12px] text-zinc-500">
                  Download everything — maps, tasks, KPIs, reflections — as a JSON file.
                </p>
              </div>
              <Button variant="secondary" size="sm" className="gap-2 shrink-0" onClick={handleExport}>
                <Download size={14} />
                Export JSON
              </Button>
            </div>

            <div className="h-px bg-white/5" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h4 className="text-[14px] font-semibold text-zinc-200">Import backup</h4>
                <p className="text-[12px] text-zinc-500">
                  Restore a previous export. Replaces the current workspace.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
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
            </div>

            <div className="h-px bg-white/5" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h4 className="text-[14px] font-semibold text-zinc-200">Clear all data</h4>
                <p className="text-[12px] text-zinc-500">
                  Permanently erase this workspace and start fresh. Export first if unsure.
                </p>
              </div>
              <Button
                variant={confirmingClear ? "primary" : "danger"}
                size="sm"
                className={cn(
                  "gap-2 shrink-0",
                  confirmingClear && "bg-rose-500 text-zinc-50 hover:bg-rose-400 shadow-[0_4px_12px_rgba(244,63,94,0.3)]"
                )}
                onClick={handleClearAll}
              >
                <Trash2 size={14} />
                {confirmingClear ? "Click again to confirm" : "Clear data"}
              </Button>
            </div>
          </Card>
        </section>

        {/* Mind map export */}
        <section className="flex flex-col gap-3">
          <SectionTitle className="flex items-center gap-2">
            <Network size={12} />
            Export Mind Map
          </SectionTitle>
          <Card className="flex flex-col gap-4 p-6" hoverable={false}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h4 className="text-[14px] font-semibold text-zinc-200">The map you have open</h4>
                <p className="text-[12px] text-zinc-500">
                  Export it as a Markdown outline or its raw JSON structure — separate from the full backup above.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="sm" className="gap-2" onClick={handleExportMapMarkdown}>
                  <Download size={14} />
                  Markdown
                </Button>
                <Button variant="secondary" size="sm" className="gap-2" onClick={handleExportMapJson}>
                  <Download size={14} />
                  JSON
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* About */}
        <section className="flex flex-col gap-3">
          <SectionTitle className="flex items-center gap-2">
            <Info size={12} />
            About
          </SectionTitle>
          <Card className="flex flex-col gap-2 p-6" hoverable={false}>
            <p className="text-[14px] font-semibold text-zinc-200">JMind v0.1</p>
            <p className="text-[13px] leading-relaxed text-zinc-500">
              A personal operating system for thinking and execution: capture thoughts,
              shape them on the canvas, and turn them into action. Built local-first —
              your data never leaves this browser.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}

function ThemePreview({ id, active }: { id: string; active: boolean }) {
  const isSmiski = id === "smiski";
  return (
    <div
      className={cn(
        "relative h-14 w-28 overflow-hidden rounded-lg border",
        isSmiski ? "border-green-900/60 bg-[#070e08]" : "border-white/8 bg-zinc-950"
      )}
    >
      {/* Simulated sidebar strip */}
      <div className={cn("absolute inset-y-0 left-0 w-5", isSmiski ? "bg-[#050c05]" : "bg-black/40")} />
      {/* Simulated content area lines */}
      <div className="absolute left-7 top-3 flex flex-col gap-1.5">
        <div className={cn("h-1.5 w-12 rounded-full", isSmiski ? "bg-green-300/30" : "bg-zinc-700/60")} />
        <div className={cn("h-1.5 w-8 rounded-full", isSmiski ? "bg-green-300/20" : "bg-zinc-700/40")} />
      </div>
      {/* Accent dot */}
      <div
        className={cn(
          "absolute bottom-2.5 right-3 h-2 w-2 rounded-full",
          isSmiski ? "bg-green-300 shadow-[0_0_6px_rgba(134,239,172,0.8)]" : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
        )}
      />
      {active && (
        <div className={cn(
          "absolute inset-0 rounded-lg ring-1",
          isSmiski ? "ring-green-400/50" : "ring-emerald-500/50"
        )} />
      )}
    </div>
  );
}

function ShortcutGroup({ title, shortcuts }: { title: string; shortcuts: [string, string][] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{title}</p>
      <div className="flex flex-col gap-2.5">
        {shortcuts.map(([keys, action]) => (
          <div key={keys} className="flex items-center justify-between gap-6">
            <span className="text-[12px] text-zinc-400">{action}</span>
            <kbd className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
              {keys}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
