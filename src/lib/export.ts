import { toPng } from "html-to-image";

interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
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
  }
}
