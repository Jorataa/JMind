import { toPng } from "html-to-image";

interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
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
) {
  const restoreEdgePaint = inlineEdgePaintForCapture(viewport);
  try {
    const dataUrl = await toPng(viewport, {
      backgroundColor: "#09090b",
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
  } catch (error) {
    console.error("Failed to export image:", error);
  } finally {
    restoreEdgePaint();
  }
}
