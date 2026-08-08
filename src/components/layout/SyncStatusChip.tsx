"use client";

import Link from "next/link";
import { Cloud, CloudCheck, CloudOff, HardDrive, RefreshCw, CloudAlert } from "lucide-react";
import { useSyncStatus, useLastSyncedAt } from "@/stores/use-sync-store";
import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/cn";

/**
 * The rail's always-on answer to "where is my data?" (design pass 2).
 * One quiet row above the profile: on this device / set up sync / synced ·
 * 2m ago / syncing / offline / sync issue. Clicking lands on the relevant
 * Settings section.
 */
export default function SyncStatusChip({ compact }: { compact: boolean }) {
  const status = useSyncStatus();
  const lastSyncedAt = useLastSyncedAt();

  const config = {
    disabled: {
      icon: <HardDrive size={13} />,
      label: "On this device",
      title: "Everything saves to this browser automatically. Back it up anytime from Settings → Data.",
      href: "/settings#data",
      cls: "text-rail-faint hover:text-rail-text",
    },
    "signed-out": {
      icon: <Cloud size={13} />,
      label: "Set up sync",
      title: "Saved on this device. Sign in to back up and sync across devices.",
      href: "/settings#sync",
      cls: "text-rail-muted hover:text-rail-bright",
    },
    idle: {
      icon: <CloudCheck size={13} />,
      label: lastSyncedAt ? `Synced · ${formatRelativeTime(lastSyncedAt)}` : "Synced",
      title: lastSyncedAt
        ? `Backed up to your account — last synced ${new Date(lastSyncedAt).toLocaleString()}`
        : "Backed up to your account",
      href: "/settings#sync",
      cls: "text-rail-muted hover:text-rail-bright",
    },
    syncing: {
      icon: <RefreshCw size={13} className="animate-spin" />,
      label: "Syncing…",
      title: "Syncing with your account",
      href: "/settings#sync",
      cls: "text-rail-muted",
    },
    offline: {
      icon: <CloudOff size={13} />,
      label: "Offline — saved here",
      title: "No connection. Changes are safe on this device and will sync when you're back.",
      href: "/settings#sync",
      cls: "text-rail-muted hover:text-rail-bright",
    },
    error: {
      icon: <CloudAlert size={13} />,
      label: "Sync issue",
      title: "Sync hit a problem — your data is safe on this device. Open Settings for details.",
      href: "/settings#sync",
      cls: "text-ochre-500 hover:text-ochre-500",
    },
  }[status];

  return (
    <Link
      href={config.href}
      title={config.title}
      className={cn(
        "flex items-center rounded-[10px] transition-colors",
        compact ? "h-9 w-10 justify-center" : "gap-2 px-3 py-1.5 text-[11.5px]",
        config.cls
      )}
      aria-label={`Sync status: ${config.label}`}
    >
      <span className="shrink-0">{config.icon}</span>
      {!compact && <span className="truncate">{config.label}</span>}
    </Link>
  );
}
