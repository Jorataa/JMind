"use client";

import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
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
        <input
          autoFocus
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) handleGenerate();
          }}
          placeholder="What do you want to learn?"
          disabled={isLoading}
          aria-label="Topic to generate"
          className="h-11 w-full rounded-inner border border-line-strong bg-card px-4 text-[14.5px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-emerald-500 disabled:opacity-60"
        />

        <div className="flex flex-col gap-2">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
            Examples
          </span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                disabled={isLoading}
                onClick={() => setTopic(example)}
                className="rounded-full border border-line-hair bg-card px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-green-800 hover:text-green-800 disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="accent"
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
