"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Plus, CornerDownRight } from "lucide-react";
import {
  useMindMapNodes,
  useMindMapEdges,
  useMindMapActions,
  useMindMapStore,
  type MindMapNode,
} from "@/stores/use-mindmap-store";
import { cn } from "@/lib/cn";

/**
 * Outline view (design handoff §6.2, §11): the accessible, semantic twin of
 * the Map — same data as a nested list. Click selects, double-click renames,
 * ⌄ collapses a branch (the same `collapsed` flag the canvas uses).
 */

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-clay-500",
  medium: "bg-ochre-500",
  low: "bg-sage-500",
};

export default function OutlineView() {
  const nodes = useMindMapNodes();
  const edges = useMindMapEdges();
  const selectedNodeId = useMindMapStore((state) => state.selectedNodeId);
  const { selectNode, updateNodeLabel, addNode, toggleNodeCollapse } = useMindMapActions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { childrenOf, roots, stickies } = useMemo(() => {
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
    const roots = mapNodes
      .filter((n) => n.data.isRoot || !hasParent.has(n.id))
      .sort((a, b) => Number(b.data.isRoot ?? false) - Number(a.data.isRoot ?? false));
    const stickies = nodes.filter((n) => n.type === "sticky");

    return { childrenOf, roots, stickies };
  }, [nodes, edges]);

  const commitRename = () => {
    if (editingId && draft.trim()) {
      updateNodeLabel(editingId, draft.trim());
    }
    setEditingId(null);
  };

  const renderNode = (node: MindMapNode, depth: number): React.ReactNode => {
    const children = childrenOf.get(node.id) ?? [];
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingId === node.id;
    const dot = PRIORITY_DOT[node.data.priority ?? "none"];

    return (
      <li key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-2 rounded-[9px] py-[7px] pr-2 transition-colors",
            isSelected ? "bg-sage-surface" : "hover:bg-sunken/70"
          )}
          style={{ paddingLeft: 8 + depth * 22 }}
        >
          {children.length > 0 ? (
            <button
              type="button"
              onClick={() => toggleNodeCollapse(node.id)}
              className="flex h-4 w-4 shrink-0 items-center justify-center text-ink-400 transition-transform hover:text-ink-900"
              aria-label={node.data.collapsed ? "Expand branch" : "Collapse branch"}
              aria-expanded={!node.data.collapsed}
            >
              <ChevronRight
                size={13}
                className={cn("transition-transform", !node.data.collapsed && "rotate-90")}
              />
            </button>
          ) : (
            <span className="w-4 shrink-0" aria-hidden />
          )}

          {isEditing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditingId(null);
              }}
              className={cn(
                "min-w-0 flex-1 bg-transparent outline-none",
                node.data.isRoot
                  ? "font-serif text-[18px] text-ink-900"
                  : "text-[13.5px] font-medium text-ink-900"
              )}
              aria-label="Rename idea"
            />
          ) : (
            <button
              type="button"
              onClick={() => selectNode(node.id)}
              onDoubleClick={() => {
                setEditingId(node.id);
                setDraft(node.data.label);
              }}
              className={cn(
                "min-w-0 flex-1 truncate text-left",
                node.data.isRoot
                  ? "font-serif text-[18px] text-ink-900"
                  : "text-[13.5px] font-medium text-ink-700",
                node.data.status === "done" && "text-ink-400 line-through"
              )}
            >
              {node.data.label}
            </button>
          )}

          {dot && <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", dot)} />}
          <button
            type="button"
            onClick={() => addNode("New Idea", node.id)}
            className="shrink-0 rounded p-1 text-ink-400 opacity-0 transition-opacity hover:text-ink-900 focus-visible:opacity-100 group-hover:opacity-100"
            title="Add a sub-idea"
            aria-label={`Add a sub-idea under ${node.data.label}`}
          >
            <Plus size={12.5} />
          </button>
        </div>

        {children.length > 0 && !node.data.collapsed && (
          <ul>{children.map((child) => renderNode(child, depth + 1))}</ul>
        )}
      </li>
    );
  };

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-paper">
      <div className="mx-auto max-w-[720px] px-6 pb-16 pt-24">
        <ul aria-label="Map outline">{roots.map((node) => renderNode(node, 0))}</ul>

        {stickies.length > 0 && (
          <div className="mt-10">
            <p className="px-2 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Stickies
            </p>
            <ul className="mt-2">
              {stickies.map((sticky) => (
                <li
                  key={sticky.id}
                  className="flex items-start gap-2 rounded-[9px] px-2 py-[7px]"
                >
                  <CornerDownRight size={13} className="mt-0.5 shrink-0 text-ink-400" />
                  <p className="min-w-0 flex-1 whitespace-pre-wrap font-serif text-[14px] italic leading-relaxed text-straw-text">
                    {sticky.data.label}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
