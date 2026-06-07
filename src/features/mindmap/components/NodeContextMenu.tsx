"use client";

import { motion } from "framer-motion";
import { Trash2, Copy } from "lucide-react";
import { useMindMapActions } from "@/stores/use-mindmap-store";
import { cn } from "@/lib/cn";

interface NodeContextMenuProps {
  id: string;
  x: number;
  y: number;
  onClose: () => void;
}

export default function NodeContextMenu({ id, x, y, onClose }: NodeContextMenuProps) {
  const { removeNode, duplicateNode, updateNodeData } = useMindMapActions();

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ left: x, top: y }}
      className="fixed z-[100] min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-zinc-900/90 p-1.5 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex flex-col gap-0.5">
        <ContextItem 
          icon={<Copy size={14} />} 
          label="Duplicate Node" 
          onClick={() => handleAction(() => duplicateNode(id))} 
        />
        <div className="h-px bg-white/5 my-1" />
        
        <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Change Category</p>
        <div className="grid grid-cols-5 gap-1 px-1.5 pb-1.5">
          <CategoryBtn color="zinc" onClick={() => updateNodeData(id, { category: "default" })} />
          <CategoryBtn color="emerald" onClick={() => updateNodeData(id, { category: "task" })} />
          <CategoryBtn color="indigo" onClick={() => updateNodeData(id, { category: "goal" })} />
          <CategoryBtn color="violet" onClick={() => updateNodeData(id, { category: "idea" })} />
          <CategoryBtn color="rose" onClick={() => updateNodeData(id, { category: "warning" })} />
        </div>

        <div className="h-px bg-white/5 my-1" />
        <ContextItem 
          icon={<Trash2 size={14} className="text-rose-400" />} 
          label="Delete Node" 
          variant="danger"
          onClick={() => handleAction(() => removeNode(id))} 
        />
      </div>
    </motion.div>
  );
}

function ContextItem({ icon, label, onClick, variant = "default" }: { icon: React.ReactNode; label: string; onClick: () => void; variant?: "default" | "danger" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
        variant === "danger" ? "text-rose-400 hover:bg-rose-500/10" : "text-zinc-300 hover:bg-white/5"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function CategoryBtn({ color, onClick }: { color: string; onClick: () => void }) {
  const bg = {
    zinc: "bg-zinc-800",
    emerald: "bg-emerald-500",
    indigo: "bg-indigo-500",
    violet: "bg-violet-500",
    rose: "bg-rose-500",
  }[color] || "bg-zinc-800";

  return (
    <button
      onClick={onClick}
      className={cn("h-6 rounded-md transition-all hover:scale-110", bg)}
    />
  );
}
