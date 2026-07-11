"use client";

import { useMemo } from "react";
import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import { useNoteStore } from "@/stores/use-note-store";
import { useKnowledgeStore } from "@/stores/use-knowledge-store";
import type { MindMapNode } from "@/types/mindmap";

export type NodeSearchHit = {
  node: MindMapNode;
  mapId: string;
  mapTitle: string;
};

export function useGlobalSearch(query: string) {
  const tasks = useTaskStore((state) => state.tasks);
  const kpis = useKPIStore((state) => state.kpis);
  const nodes = useMindMapStore((state) => state.nodes);
  const maps = useMindMapStore((state) => state.maps);
  const activeMapId = useMindMapStore((state) => state.activeMapId);
  const notes = useNoteStore((state) => state.notes);
  const sources = useKnowledgeStore((state) => state.sources);

  return useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q)
      return {
        tasks: [],
        kpis: [],
        nodes: [] as NodeSearchHit[],
        notes: [],
        sources: [],
      };

    const matches = (node: MindMapNode) =>
      `${node.data.label} ${node.data.description ?? ""}`.toLowerCase().includes(q);

    // Ideas are searched across every map. The active map reads the live
    // top-level nodes (its entry in `maps` only syncs on persist/switch);
    // other maps read their stored snapshots. Active-map hits rank first.
    const nodeHits: NodeSearchHit[] = [];
    const activeTitle = maps[activeMapId]?.title ?? "Mind Map";
    for (const node of nodes) {
      if (matches(node)) nodeHits.push({ node, mapId: activeMapId, mapTitle: activeTitle });
    }
    for (const map of Object.values(maps)) {
      if (map.id === activeMapId) continue;
      for (const node of map.nodes) {
        if (matches(node)) nodeHits.push({ node, mapId: map.id, mapTitle: map.title });
      }
    }

    return {
      tasks: tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 5),
      kpis: kpis.filter(k => k.label.toLowerCase().includes(q)).slice(0, 5),
      nodes: nodeHits.slice(0, 6),
      notes: notes
        .filter((n) => `${n.title} ${n.body}`.toLowerCase().includes(q))
        .slice(0, 4),
      sources: sources.filter((s) => s.title.toLowerCase().includes(q)).slice(0, 3),
    };
  }, [tasks, kpis, nodes, maps, activeMapId, notes, sources, query]);
}
