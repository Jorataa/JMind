import MindMapCanvas from "@/features/mindmap/MindMapCanvas";

export default function MindMapPage() {
  // The canvas is the workspace — full bleed, no page chrome, no scroll.
  return (
    <div className="h-full w-full">
      <MindMapCanvas />
    </div>
  );
}
