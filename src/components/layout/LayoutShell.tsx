"use client";

import Sidebar from "./Sidebar";
import MobileTabBar from "./MobileTabBar";
import OfflineChip from "./OfflineChip";
import CommandPalette from "@/features/command/components/CommandPalette";
import QuickCaptureOverlay from "@/features/command/components/QuickCaptureOverlay";
import AssistantDock from "@/features/ai/AssistantDock";
import FocusHUD from "./FocusHUD";
import NameGate from "@/features/onboarding/NameGate";
import SyncProvider from "@/features/sync/SyncProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { initCrossTabSync } from "@/lib/cross-tab-sync";

import { CookieBanner } from "@/components/legal/CookieBanner";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initCrossTabSync();
  }, []);

  // The landing owns the whole viewport — no rail, no app chrome (§7).
  if (pathname === "/") {
    return (
      <>
        {children}
        <CookieBanner />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper font-sans text-ink-700">
      {/* Keyboard users jump straight past the rail (§11). */}
      <a
        href="#jorata-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-evergreen-900 focus:px-4 focus:py-2 focus:text-[13px] focus:text-[#E9EDE0]"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* No persistent topbar — each page carries its own header grammar (§6.2). */}
        <main
          id="jorata-main"
          className="custom-scrollbar flex-1 overflow-y-auto pb-[64px] md:pb-0"
        >
          {/* Enter-only transition: exit animations double perceived nav latency. */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="h-full"
          >
            {/* Keyed by route: any uncaught render error degrades to a calm
                recovery card instead of white-screening, and navigating to
                another page remounts the boundary so it clears itself. */}
            <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
          </motion.div>
        </main>

        <CommandPalette />
        <QuickCaptureOverlay />
        <AssistantDock />
        <FocusHUD />
      </div>

      {/* Mobile shell: bottom tabs + center capture (§10). */}
      <MobileTabBar />
      <OfflineChip />

      {/* First-run name gate + returning-visitor session logging */}
      <NameGate />

      {/* Cookie & privacy consent banner */}
      <CookieBanner />

      {/* Optional cloud sync — no-op unless the owner configured Supabase */}
      <SyncProvider />
    </div>
  );
}
