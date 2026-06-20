"use client";

import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAiGenerate } from "./useAiGenerate";

const EXAMPLES = ["Photosynthesis", "Build a Startup", "World War II", "Launch Jorata"];

// The "AI Generate" modal: type one topic, get a full mind map on the canvas.
export default function AiGenerateModal({ onClose }: { onClose: () => void }) {
  const [topic, setTopic] = useState("");
  const { generate, isLoading } = useAiGenerate();

  const handleGenerate = async () => {
    const ok = await generate(topic);
    // Success → the canvas now shows the new map; close. Failure → keep the
    // modal open (a toast already fired) so the user can retry.
    if (ok) onClose();
  };

  return (
    <Modal
      title="AI Generate"
      description="Type a topic and Jorata builds the whole mind map for you."
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <Input
          autoFocus
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) handleGenerate();
          }}
          placeholder="What do you want to learn?"
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Examples
          </span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                disabled={isLoading}
                onClick={() => setTopic(example)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-zinc-300 transition-colors hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <Button
          className="w-full gap-2"
          onClick={handleGenerate}
          disabled={isLoading || topic.trim().length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Thinking</span>
              <ThinkingDots />
            </>
          ) : (
            <>
              <Wand2 size={15} />
              Generate
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}

// Three dots that fade in sequence — the classic "the AI is working" cue.
function ThinkingDots() {
  return (
    <span className="inline-flex">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        >
          .
        </span>
      ))}
    </span>
  );
}
