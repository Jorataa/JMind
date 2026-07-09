"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import CommandPalette from "@/features/command/components/CommandPalette";
import QuickCaptureOverlay from "@/features/command/components/QuickCaptureOverlay";
import FocusHUD from "./FocusHUD";
import QuickActions from "./QuickActions";
import NameGate from "@/features/onboarding/NameGate";
import SyncProvider from "@/features/sync/SyncProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { initCrossTabSync } from "@/lib/cross-tab-sync";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initCrossTabSync();
  }, []);

  return (
    <div className="app-shell-bg flex h-screen w-screen overflow-hidden text-zinc-100 font-sans selection:bg-emerald-500/30">
      <Sidebar />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Topbar />

        <main className="custom-scrollbar flex-1 overflow-y-auto">
          {/* Enter-only transition: exit animations double perceived nav latency. */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-full"
          >
            {/* Keyed by route: any uncaught render error degrades to a calm
                recovery card instead of white-screening, and navigating to
                another page remounts the boundary so it clears itself. */}
            <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
          </motion.div>
        </main>

        <QuickActions />
        <CommandPalette />
        <QuickCaptureOverlay />
        <FocusHUD />
      </div>

      {/* First-run name gate + returning-visitor session logging */}
      <NameGate />

      {/* Optional cloud sync — no-op unless the owner configured Supabase */}
      <SyncProvider />
    </div>
  );
}
