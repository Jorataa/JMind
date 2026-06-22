"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ChevronRight, MessageSquare } from "lucide-react";
import { useFocusActions } from "@/stores/use-focus-store";
import { Button } from "@/components/ui/Button";

interface ReflectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReflectionOverlay({ isOpen, onClose }: ReflectionOverlayProps) {
  const { logReflection } = useFocusActions();
  const [step, setStep] = useState(1);
  const [reflection, setReflection] = useState("");

  const handleFinish = () => {
    if (reflection.trim()) {
      logReflection(reflection);
    }
    onClose();
    setStep(1);
    setReflection("");
  };

  const steps = [
    {
      title: "What Got Done",
      question: "What actually moved forward today?",
      placeholder: "I completed the core logic for the...",
    },
    {
      title: "What Slowed You Down",
      question: "What got in your way today?",
      placeholder: "The CSS grid layout was trickier than expected...",
    },
    {
      title: "Tomorrow's Plan",
      question: "What should you focus on tomorrow?",
      placeholder: "Tomorrow I will tackle the...",
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[160] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/90 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <div className="p-8">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400">Quick Reflection</h3>
                    <p className="text-[14px] font-semibold text-zinc-100">{currentStep.title}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-[18px] font-bold text-zinc-200 leading-tight">
                  {currentStep.question}
                </p>
                <textarea
                  autoFocus
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder={currentStep.placeholder}
                  className="min-h-[120px] w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-[15px] text-zinc-200 outline-none focus:border-violet-500/30 transition-colors resize-none"
                />
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 w-8 rounded-full transition-colors ${i + 1 === step ? 'bg-violet-500' : 'bg-white/10'}`} 
                    />
                  ))}
                </div>
                
                {step < steps.length ? (
                  <Button 
                    onClick={() => {
                      if (reflection.trim()) {
                        setReflection(reflection + "\n\n");
                        setStep(step + 1);
                      } else {
                        setStep(step + 1);
                      }
                    }}
                    className="bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    Next Step
                    <ChevronRight size={16} className="ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleFinish}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Save Reflection
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-black/20 border-t border-white/5 px-8 py-4 flex items-center gap-2">
              <MessageSquare size={14} className="text-zinc-600" />
              <p className="text-[11px] font-medium text-zinc-600 italic">
                A quick look back helps you stay focused and motivated.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
