import { toPng } from "html-to-image";

/**
 * Captures the target element and downloads it as a PNG image.
 */
export async function exportToPng(element: HTMLElement, fileName: string = "jorata-map.png") {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: "#09090b",
      quality: 0.95,
      pixelRatio: 2, // High resolution
    });

    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Failed to export image:", error);
  }
}
