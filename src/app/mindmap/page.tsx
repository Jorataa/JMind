import MindMapCanvas from "@/features/mindmap/MindMapCanvas";

export default function MindMapPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Visual Thinking
          </h3>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <MindMapCanvas />
        </div>
      </div>
    </div>
  );
}
