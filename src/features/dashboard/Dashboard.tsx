"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";
import WisdomStrip from "@/features/dashboard/components/WisdomStrip";
import BrandLandscapeAnchor from "@/features/dashboard/components/BrandLandscapeAnchor";
import {
  HeroBriefCell,
  WorkspaceCell,
  AssistantCell,
  TasksCell,
  CalendarCell,
  NotesCell,
  KnowledgeCell,
  GoalCell,
} from "@/features/dashboard/components/BentoCells";
import { useHydrated } from "@/hooks/use-hydrated";
import { useUserName } from "@/stores/use-ui-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import { useMindMapNodes } from "@/stores/use-mindmap-store";
import { useInbox } from "@/stores/use-inbox-store";
import { useActivities } from "@/stores/use-activity-store";
import { useSessionContinuity } from "@/hooks/use-session-continuity";
import { getGreeting } from "@/lib/dashboard-insights";
import { formatFullDate } from "@/lib/format-date";

/**
 * The Dashboard bento (design handoff #3a, §4.3):
 * 1. Reflective Element: Daily Motivation strip
 * 2. Environmental Element: Brand Landscape photograph visual anchor
 * 3. Functional Element: 12-col workspace grid
 */

const CELLS: {
  render: (isFresh: boolean) => React.ReactNode;
  className: string;
}[] = [
  {
    render: (isFresh) => <HeroBriefCell isFresh={isFresh} />,
    className:
      "order-1 md:order-none md:col-span-6 lg:col-span-8 xl:col-span-5 md:row-span-2",
  },
  {
    render: () => <WorkspaceCell />,
    className:
      "order-4 md:order-none md:col-span-3 lg:col-span-4 xl:col-span-4 md:row-span-2",
  },
  {
    render: () => <AssistantCell />,
    className:
      "order-5 md:order-none md:col-span-3 lg:col-span-4 xl:col-span-3 md:row-span-2",
  },
  {
    render: () => <TasksCell />,
    className:
      "order-2 md:order-none md:col-span-3 lg:col-span-4 xl:col-span-4 md:row-span-2",
  },
  {
    render: () => <CalendarCell />,
    className:
      "order-3 md:order-none md:col-span-3 lg:col-span-4 xl:col-span-3 md:row-span-2",
  },
  {
    render: () => <NotesCell />,
    className:
      "order-6 md:order-none md:col-span-3 lg:col-span-4 xl:col-span-3 md:row-span-2",
  },
  {
    render: () => <KnowledgeCell />,
    className: "order-7 md:order-none md:col-span-3 lg:col-span-2 xl:col-span-2",
  },
  {
    render: () => <GoalCell />,
    className: "order-8 md:order-none md:col-span-3 lg:col-span-2 xl:col-span-2",
  },
];

export default function Dashboard() {
  useSessionContinuity();

  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const userName = useUserName();
  const tasks = useTaskStore((state) => state.tasks);
  const kpis = useKPIStore((state) => state.kpis);
  const nodes = useMindMapNodes();
  const inboxItems = useInbox();
  const activities = useActivities();

  // A brand-new workspace gets an invitation, not a wall of zero-metrics.
  const isFresh = useMemo(
    () =>
      tasks.length === 0 &&
      kpis.length === 0 &&
      activities.length === 0 &&
      inboxItems.length === 0 &&
      nodes.length <= 1,
    [tasks.length, kpis.length, activities.length, inboxItems.length, nodes.length]
  );

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-[1500px] px-5 pb-12 pt-6 md:px-9 md:pt-7">
        <div className="skeleton-shimmer h-[72px] w-[420px] max-w-full rounded-card" />
        <div className="mt-7 grid grid-cols-1 gap-[13px] md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 md:auto-rows-[172px]">
          {CELLS.map(({ className }, i) => (
            <div
              key={i}
              className={`skeleton-shimmer rounded-card min-h-[120px] ${className}`}
            />
          ))}
        </div>
      </div>
    );
  }

  const greeting = isFresh ? (
    <>
      Your mind, <em>one quiet place.</em>
    </>
  ) : (
    <>
      {getGreeting()}, {userName || "there"} — <em>everything&apos;s where you left it.</em>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 pb-12 pt-6 md:px-9 md:pt-7">
      <PageHeader
        size="display"
        context={formatFullDate()}
        title={greeting}
        actions={
          <Link
            href="/mindmap"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-evergreen-900 px-[18px] text-[13.5px] font-medium text-[#E9EDE0] transition-colors hover:bg-evergreen-deep"
          >
            Resume thinking →
          </Link>
        }
      />

      {/* Reflective Element: Daily Motivation */}
      <WisdomStrip className="mt-6" />

      {/* Environmental Element: Golden-Hour Coastal Landscape Photograph */}
      <BrandLandscapeAnchor className="mt-[13px]" />

      {/* Functional Element: Workspace Bento Grid */}
      <motion.div
        className="mt-[13px] grid grid-cols-1 gap-[13px] md:auto-rows-[minmax(172px,auto)] md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: prefersReduced ? 0 : 0.04 } },
        }}
      >
        {CELLS.map(({ render, className }, i) => (
          <motion.div
            key={i}
            className={`min-w-0 ${className} [&>*]:h-full`}
            variants={{
              hidden: { opacity: 0, y: prefersReduced ? 0 : 5 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.25, ease: [0.2, 0, 0, 1] },
              },
            }}
          >
            {render(isFresh)}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

