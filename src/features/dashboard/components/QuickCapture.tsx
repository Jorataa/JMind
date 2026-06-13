"use client";

import { useState } from "react";
import { useInbox, useInboxActions, InboxItem } from "@/stores/use-inbox-store";
import { useTaskActions } from "@/stores/use-task-store";
import { useMindMapActions } from "@/stores/use-mindmap-store";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { CheckSquare, Network, Trash2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/stores/use-toast-store";

export default function QuickCapture() {
  const items = useInbox();
  const { capture, removeItem } = useInboxActions();
  const { addTask } = useTaskActions();
  const { addNode } = useMindMapActions();
  const [input, setInput] = useState("");
  const addToast = useToast();

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    capture(input);
    setInput("");
  };

  const convertToTask = (item: InboxItem) => {
    addTask(item.content, "medium", "quick", "Inbox");
    removeItem(item.id);
    addToast("Converted to task", "success");
  };

  const convertToNode = (item: InboxItem) => {
    addNode(item.content);
    removeItem(item.id);
    addToast("Converted to mind map node", "success");
  };

  return (
    <div id="quick-capture" className="flex flex-col gap-3 scroll-mt-24">
      <SectionTitle>Raw Thoughts (Inbox)</SectionTitle>
      <Card className="p-0 border-white/5 bg-zinc-900/40">
        <form onSubmit={handleCapture} className="flex items-center gap-2 p-4 border-b border-white/5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Quick capture an idea..."
            className="flex-1 bg-white/[0.03] border-white/5 h-10 px-4 rounded-xl text-[13px] text-zinc-200 outline-none focus:border-emerald-500/20"
          />
          <Button type="submit" size="sm" className="h-10 w-10 p-0">
            <Send size={16} />
          </Button>
        </form>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[12px] text-zinc-600 italic">Inbox is clear. Capture everything, worry later.</p>
              </div>
            ) : (
              items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group flex items-center justify-between p-4 hover:bg-white/[0.02]"
                >
                  <p className="text-[13px] text-zinc-200 truncate pr-4">{item.content}</p>
                  <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:text-emerald-400"
                      onClick={() => convertToTask(item)}
                      aria-label={`Convert ${item.content} to task`}
                      title="Convert to task"
                    >
                      <CheckSquare size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:text-violet-400"
                      onClick={() => convertToNode(item)}
                      aria-label={`Convert ${item.content} to mind map node`}
                      title="Convert to node"
                    >
                      <Network size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:text-rose-400"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.content} from inbox`}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
