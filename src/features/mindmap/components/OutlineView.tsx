"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Plus, Pencil, Locate, StickyNote } from "lucide-react";
import {
  useMindMapNodes,
  useMindMapEdges,
  useMindMapActions,
  useMindMapStore,
  type MindMapNode,
} from "@/stores/use-mindmap-store";
import { BRANCH_COLOR_STYLES } from "@/lib/node-colors";
import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/cn";

/**
 * Outline view (design pass 2): the map as a premium document, not raw text.
 * Root label = document title (serif, editable). Depth-1 rows are sections
 * with their branch hue as a marker; deeper rows hang off hairline indent
 * guides. Every row: click selects (synced with the canvas), double-click
 * renames, hover reveals locate / rename / add-child, ⌄ collapses with a
 * hidden-count badge — the same `collapsed` flag the canvas uses.
 */

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-clay-500",
  medium: "bg-ochre-500",
  low: "bg-sage-500",
};

// Category fallbacks for nodes without a branch hue (mirrors the minimap).
const CATEGORY_ACCENT: Record<string, string> = {
  goal: "#24523B",
  task: "#1E9B68",
  idea: "#C99A2E",
  warning: "#A65A3A",
};

const markerColor = (node: MindMapNode): string =>
  BRANCH_COLOR_STYLES[(node.data.color as string) ?? ""]?.accent ??
  CATEGORY_ACCENT[node.data.category ?? ""] ??
  "#A8B2A0";

export default function OutlineView({
  onShowOnMap,
}: {
  /** Jump to this node on the canvas (switches back to Map view). */
  onShowOnMap?: (id: string) => void;
}) {
  const nodes = useMindMapNodes();
  const edges = useMindMapEdges();
  const selectedNodeId = useMindMapStore((state) => state.selectedNodeId);
  const mapUpdatedAt = useMindMapStore(
    (state) => state.maps[state.activeMapId]?.updatedAt
  );
  const { selectNode, updateNodeLabel, addNode, toggleNodeCollapse } =
    useMindMapActions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { childrenOf, rootNode, topLevel, stickies, ideaCount, descendantCount } =
    useMemo(() => {
      const childrenOf = new Map<string, MindMapNode[]>();
      const hasParent = new Set<string>();
      const byId = new Map(nodes.map((n) => [n.id, n]));

      for (const edge of edges) {
        const child = byId.get(edge.target);
        if (!child || child.type === "sticky") continue;
        hasParent.add(edge.target);
        const list = childrenOf.get(edge.source) ?? [];
        list.push(child);
        childrenOf.set(edge.source, list);
      }
      // Stable vertical order — mirror the canvas's spatial arrangement.
      for (const list of childrenOf.values()) {
        list.sort((a, b) => a.position.y - b.position.y);
      }

      const mapNodes = nodes.filter((n) => n.type !== "sticky");
      const rootNode = mapNodes.find((n) => n.data.isRoot);
      const orphans = mapNodes.filter(
        (n) => !n.data.isRoot && !hasParent.has(n.id)
      );
      // The document body: the root's branches, then any unparented islands.
      const topLevel = [
        ...(rootNode ? (childrenOf.get(rootNode.id) ?? []) : []),
        ...orphans,
      ];
      const stickies = nodes.filter((n) => n.type === "sticky");
      const ideaCount = mapNodes.filter((n) => !n.data.isRoot).length;

      // How many rows hide behind each collapsed chevron.
      const descendantCount = new Map<string, number>();
      const count = (id: string): number => {
        const cached = descendantCount.get(id);
        if (cached !== undefined) return cached;
        descendantCount.set(id, 0); // cycle guard
        const total = (childrenOf.get(id) ?? []).reduce(
          (sum, child) => sum + 1 + count(child.id),
          0
        );
        descendantCount.set(id, total);
        return total;
      };
      mapNodes.forEach((n) => count(n.id));

      return { childrenOf, rootNode, topLevel, stickies, ideaCount, descendantCount };
    }, [nodes, edges]);

  const commitRename = () => {
    if (editingId && draft.trim()) {
      updateNodeLabel(editingId, draft.trim());
    }
    setEditingId(null);
  };

  const beginRename = (node: MindMapNode) => {
    setEditingId(node.id);
    setDraft(node.data.label);
  };

  const addChildAndEdit = (parentId?: string) => {
    const node = addNode("New Idea", parentId ?? rootNode?.id);
    setEditingId(node.id);
    setDraft(node.data.label);
  };

  const renderNode = (node: MindMapNode, depth: number): React.ReactNode => {
    const children = childrenOf.get(node.id) ?? [];
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingId === node.id;
    const isDone = node.data.status === "done";
    const dot = PRIORITY_DOT[node.data.priority ?? "none"];
    const hidden = node.data.collapsed ? descendantCount.get(node.id) ?? 0 : 0;

    const labelClass =
      depth === 1
        ? "text-[15px] font-semibold text-ink-900"
        : depth === 2
          ? "text-[13.5px] font-medium text-ink-700"
          : "text-[13px] text-ink-600";

    return (
      <li key={node.id} className={depth === 1 ? "mt-1 first:mt-0" : ""}>
        <div
          className={cn(
            "group relative flex items-center gap-2 rounded-[9px] py-[6px] pl-1.5 pr-2 transition-colors",
            isSelected ? "bg-sage-surface" : "hover:bg-sunken/70"
          )}
        >
          {/* Selected rows carry a quiet evergreen spine. */}
          {isSelected && (
            <span
              aria-hidden
              className="absolute inset-y-[5px] left-0 w-[2.5px] rounded-full bg-green-800"
            />
          )}

          {/* Collapse chevron (children) or marker (leaf) */}
          {children.length > 0 ? (
            <button
              type="button"
              onClick={() => toggleNodeCollapse(node.id)}
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-ink-400 transition-colors hover:bg-sunken hover:text-ink-900"
              aria-label={node.data.collapsed ? "Expand branch" : "Collapse branch"}
              aria-expanded={!node.data.collapsed}
            >
              <ChevronRight
                size={13}
                className={cn(
                  "transition-transform duration-150",
                  !node.data.collapsed && "rotate-90"
                )}
              />
            </button>
          ) : (
            <span
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center"
              aria-hidden
            >
              <span
                className={cn(
                  "rounded-full",
                  depth === 1 ? "h-[8px] w-[8px] rounded-[3px]" : "h-[5px] w-[5px]"
                )}
                style={{ backgroundColor: markerColor(node), opacity: depth > 2 ? 0.55 : 1 }}
              />
            </span>
          )}

          {/* Branch swatch beside the chevron for depth-1 sections */}
          {children.length > 0 && depth === 1 && (
            <span
              aria-hidden
              className="h-[8px] w-[8px] shrink-0 rounded-[3px]"
              style={{ backgroundColor: markerColor(node) }}
            />
          )}

          {isEditing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditingId(null);
              }}
              className={cn("min-w-0 flex-1 bg-transparent outline-none", labelClass)}
              aria-label="Rename idea"
            />
          ) : (
            <button
              type="button"
              onClick={() => selectNode(isSelected ? null : node.id)}
              onDoubleClick={() => beginRename(node)}
              className="min-w-0 flex-1 text-left"
            >
              <span
                className={cn(labelClass, isDone && "text-ink-400 line-through")}
              >
                {node.data.label}
              </span>
              {node.data.aiDescription && (
                <span className="mt-px block truncate text-[11.5px] leading-snug text-ink-500">
                  {node.data.aiDescription}
                </span>
              )}
            </button>
          )}

          {/* Right meta: hidden-count · priority · hover verbs */}
          {hidden > 0 && (
            <span
              className="shrink-0 rounded-full bg-sunken px-1.5 py-px font-mono text-[10px] text-ink-500"
              title={`${hidden} hidden ${hidden === 1 ? "idea" : "ideas"}`}
            >
              {hidden}
            </span>
          )}
          {dot && <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", dot)} />}

          <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            {onShowOnMap && (
              <RowAction
                title="Show on map"
                onClick={() => {
                  selectNode(node.id);
                  onShowOnMap(node.id);
                }}
              >
                <Locate size={12.5} />
              </RowAction>
            )}
            <RowAction title="Rename" onClick={() => beginRename(node)}>
              <Pencil size={12} />
            </RowAction>
            <RowAction
              title="Add a sub-idea"
              onClick={() => addChildAndEdit(node.id)}
            >
              <Plus size={13} />
            </RowAction>
          </span>
        </div>

        {/* Children hang off a hairline guide — the document's structure
            made visible. */}
        {children.length > 0 && !node.data.collapsed && (
          <ul className="ml-[10px] border-l border-line-soft pl-3">
            {children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const isEmptyDocument = topLevel.length === 0 && stickies.length === 0;

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-paper">
      <div className="mx-auto max-w-[780px] px-6 pb-20 pt-24">
        {/* ── Document header ── */}
        <header>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
            Outline
            {ideaCount > 0 && (
              <span className="ml-2 normal-case tracking-normal text-ink-400">
                {topLevel.length} {topLevel.length === 1 ? "branch" : "branches"} ·{" "}
                {ideaCount} {ideaCount === 1 ? "idea" : "ideas"}
              </span>
            )}
          </p>
          {rootNode &&
            (editingId === rootNode.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="mt-2 w-full bg-transparent font-serif text-[32px] leading-[1.12] text-ink-900 outline-none"
                aria-label="Rename the central idea"
              />
            ) : (
              <h1
                onDoubleClick={() => beginRename(rootNode)}
                title="Double-click to rename the central idea"
                className="mt-2 cursor-text font-serif text-[32px] leading-[1.12] text-ink-900"
              >
                {rootNode.data.label}
              </h1>
            ))}
          <div className="mt-5 h-px bg-line-strong" aria-hidden />
        </header>

        {/* ── Body ── */}
        {isEmptyDocument ? (
          <div className="mt-14 text-center">
            <p className="font-serif text-[20px] text-ink-900">
              The outline is your map, written down.
            </p>
            <p className="mx-auto mt-2 max-w-[380px] text-[13px] leading-relaxed text-ink-600">
              Add ideas here as a list, or switch to Map view to think
              spatially — they&apos;re the same thing, kept in step.
            </p>
            <button
              type="button"
              onClick={() => addChildAndEdit()}
              className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full bg-evergreen-900 px-4 text-[13px] font-medium text-[#E9EDE0] transition-colors hover:bg-evergreen-deep"
            >
              <Plus size={14} />
              Add your first idea
            </button>
          </div>
        ) : (
          <>
            <ul aria-label="Map outline" className="mt-4">
              {topLevel.map((node) => renderNode(node, 1))}
            </ul>

            {/* Ghost row: growing the document never needs the canvas. */}
            <button
              type="button"
              onClick={() => addChildAndEdit()}
              className="mt-1.5 flex w-full items-center gap-2 rounded-[9px] py-[6px] pl-1.5 pr-2 text-left text-[13px] text-ink-400 transition-colors hover:bg-sunken/70 hover:text-ink-700"
            >
              <span className="flex h-[18px] w-[18px] items-center justify-center">
                <Plus size={13} />
              </span>
              New idea
            </button>
          </>
        )}

        {/* ── Stickies ── */}
        {stickies.length > 0 && (
          <div className="mt-12">
            <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              <StickyNote size={11} />
              Stickies
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {stickies.map((sticky) => (
                <div
                  key={sticky.id}
                  className="rounded-inner border border-[#DCCF9E] bg-straw px-4 py-3"
                >
                  <p className="whitespace-pre-wrap font-serif text-[14px] italic leading-relaxed text-straw-ink">
                    {sticky.data.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {!isEmptyDocument && mapUpdatedAt && (
          <p className="mt-12 text-[11.5px] text-ink-400">
            Edits here change the map too · updated{" "}
            {formatRelativeTime(mapUpdatedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

function RowAction({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-[7px] text-ink-400 transition-colors hover:bg-card hover:text-ink-900"
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}
