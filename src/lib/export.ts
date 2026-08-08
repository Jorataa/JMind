import { toPng } from "html-to-image";

interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

// Matches --color-paper: exports should look like the canvas they came from.
// (The accent themes only remap greens; paper is constant across all of them.)
const EXPORT_BACKGROUND = "#F6F3EB";

/** "Q3 Launch Plan!" → "q3-launch-plan" — safe for filenames. */
export function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
  return slug || "mind-map";
}

/** "jorata-q3-launch-plan-2026-07-11.png" — title + date, per export. */
export function exportFileName(title: string, ext: string): string {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `jorata-${slugifyTitle(title)}-${date}.${ext}`;
}

/** Triggers a browser download of a generated text file. */
export function downloadTextFile(fileName: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  // Let the click land before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Structural node/edge shapes so this lib doesn't depend on the store types.
interface ExportableNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: { label?: string; isRoot?: boolean; aiDescription?: string };
}
interface ExportableEdge {
  source: string;
  target: string;
}

/**
 * The map as a nested Markdown outline — the "paste it anywhere" export.
 * Root becomes the H1; branches become nested bullets in the same top-to-
 * bottom order as the canvas; stickies land under a "Notes" section.
 */
export function buildOutlineMarkdown(
  title: string,
  nodes: ExportableNode[],
  edges: ExportableEdge[]
): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, ExportableNode[]>();
  const hasParent = new Set<string>();

  for (const edge of edges) {
    const child = byId.get(edge.target);
    if (!child || child.type === "sticky") continue;
    hasParent.add(edge.target);
    const list = childrenOf.get(edge.source) ?? [];
    list.push(child);
    childrenOf.set(edge.source, list);
  }
  for (const list of childrenOf.values()) {
    list.sort((a, b) => a.position.y - b.position.y);
  }

  const mapNodes = nodes.filter((n) => n.type !== "sticky");
  const roots = mapNodes
    .filter((n) => n.data.isRoot || !hasParent.has(n.id))
    .sort((a, b) => Number(b.data.isRoot ?? false) - Number(a.data.isRoot ?? false));
  const stickies = nodes.filter((n) => n.type === "sticky");

  const lines: string[] = [`# ${title.trim() || "Mind map"}`, ""];
  const visited = new Set<string>();

  const walk = (node: ExportableNode, depth: number) => {
    if (visited.has(node.id)) return; // cycles must not hang the export
    visited.add(node.id);
    const label = (node.data.label ?? "").trim() || "Untitled";
    const description = (node.data.aiDescription ?? "").trim();
    if (!node.data.isRoot) {
      lines.push(
        `${"  ".repeat(depth)}- ${label}${description ? ` — ${description}` : ""}`
      );
    }
    for (const child of childrenOf.get(node.id) ?? []) {
      walk(child, node.data.isRoot ? 0 : depth + 1);
    }
  };
  roots.forEach((root) => walk(root, 0));

  if (stickies.length > 0) {
    lines.push("", "## Notes", "");
    for (const sticky of stickies) {
      const text = (sticky.data.label ?? "").trim();
      if (text) lines.push(`> ${text.replace(/\n/g, "\n> ")}`, "");
    }
  }

  lines.push("", `*Exported from Jorata — ${new Date().toLocaleDateString("en-US")}*`);
  return lines.join("\n");
}

/** The map as re-importable JSON: everything the store keeps, plus provenance. */
export function buildMapJson(
  title: string,
  nodes: unknown[],
  edges: unknown[]
): string {
  return JSON.stringify(
    {
      format: "jorata-map",
      version: 1,
      exportedAt: new Date().toISOString(),
      title,
      nodes,
      edges,
    },
    null,
    2
  );
}

// React Flow draws edges (and their labels) as SVG inside `.react-flow__edges`,
// styled entirely through the stylesheet — e.g. `.react-flow__edge-path { stroke:
// var(--xy-edge-stroke); fill: none }`. html-to-image deep-clones <svg> subtrees
// but does NOT inline the *computed* styles of SVG descendants, and it rasterizes
// the clone in an isolated context with no access to the page stylesheet — so the
// edge paths fall back to SVG defaults (stroke: none) and vanish, while the HTML
// nodes (whose computed styles ARE inlined) keep rendering. That's why exports
// showed every node but none of the connector lines. We copy each edge's resolved
// paint onto it as inline styles for the duration of the capture, then restore the
// DOM exactly as it was (the inlined values equal the computed ones, so nothing
// changes on screen).
const SVG_PAINT_PROPERTIES = [
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-opacity",
  "fill",
  "fill-opacity",
  "opacity",
  "marker-start",
  "marker-end",
] as const;

const EDGE_PAINT_SELECTOR =
  ".react-flow__edges .react-flow__edge-path," +
  ".react-flow__edges .react-flow__edge-text," +
  ".react-flow__edges .react-flow__edge-textbg";

function inlineEdgePaintForCapture(root: HTMLElement): () => void {
  const elements = Array.from(root.querySelectorAll<SVGElement>(EDGE_PAINT_SELECTOR));
  const previousStyles = elements.map((el) => el.getAttribute("style"));

  elements.forEach((el) => {
    const computed = window.getComputedStyle(el);
    for (const prop of SVG_PAINT_PROPERTIES) {
      const value = computed.getPropertyValue(prop);
      if (value) {
        el.style.setProperty(prop, value, computed.getPropertyPriority(prop));
      }
    }
  });

  // Restore the original inline style attribute (or remove it if there was none).
  return () => {
    elements.forEach((el, i) => {
      const previous = previousStyles[i];
      if (previous === null) el.removeAttribute("style");
      else el.setAttribute("style", previous);
    });
  };
}

/**
 * Renders just the React Flow node/edge layer (`.react-flow__viewport`) into a
 * PNG, framed by the caller-supplied transform.
 *
 * Capturing the viewport rather than the whole `#mindmap-canvas` keeps the
 * floating chrome — toolbar, minimap, controls and the `backdrop-blur` hint
 * cards — out of the image (that chrome is what made earlier exports look
 * blurred), and the transform frames every node instead of whatever happened
 * to be on screen at the current pan/zoom.
 */
export async function exportViewportToPng(
  viewport: HTMLElement,
  width: number,
  height: number,
  { x, y, zoom }: ViewportTransform,
  fileName: string = "jorata-map.png",
): Promise<boolean> {
  const restoreEdgePaint = inlineEdgePaintForCapture(viewport);
  try {
    const dataUrl = await toPng(viewport, {
      backgroundColor: EXPORT_BACKGROUND,
      pixelRatio: 2, // High resolution
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      },
    });

    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (error) {
    console.error("Failed to export image:", error);
    return false;
  } finally {
    restoreEdgePaint();
  }
}
