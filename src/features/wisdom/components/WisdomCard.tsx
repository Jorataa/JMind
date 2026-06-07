"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDailyWisdom } from "../hooks/useDailyWisdom";
import { WisdomCategory } from "../types/wisdom";
import { cn } from "@/lib/cn";
import { useWisdomStore, useWisdomActions } from "@/stores/use-wisdom-store";
import { useState, useEffect } from "react";
import { useToast } from "@/stores/use-toast-store";
import { Heart, RefreshCcw, Quote } from "lucide-react";
import { THEME } from "@/lib/constants/theme";

const categoryColors: Record<WisdomCategory, "amber" | "sky" | "emerald" | "violet" | "rose"> = {
  discipline: "amber",
  focus: "sky",
  faith: "emerald",
  growth: "violet",
  mindset: "rose",
};

export default function WisdomCard() {
  const { wisdom, today, dateKey, refresh } = useDailyWisdom();
  const { favorites, reflections } = useWisdomStore();
  const { toggleFavorite, saveReflection } = useWisdomActions();
  const addToast = useToast();
  
  const [reflection, setReflection] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
    if (reflections[dateKey]) {
      setReflection(reflections[dateKey]);
    }
  }, [dateKey, reflections]);

  const isFavorite = favorites.some((f) => f.id === wisdom.id);

  const handleSaveReflection = () => {
    saveReflection(dateKey, reflection);
    setIsEditing(false);
    addToast("Reflection saved", "success");
  };

  const handleToggleFavorite = () => {
    toggleFavorite(wisdom);
    addToast(isFavorite ? "Removed from favorites" : "Added to favorites", "info");
  };

  if (!isHydrated) return null;

  return (
    <Card className="relative overflow-hidden group border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-8">
      {/* Decorative Glow */}
      <div 
        className="absolute -right-12 -top-12 h-64 w-64 rounded-full blur-3xl opacity-5 transition-all group-hover:opacity-10" 
        style={{ backgroundColor: THEME.colors[categoryColors[wisdom.category]].primary }}
      />
      
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between relative z-10">
          <SectionTitle className="text-zinc-500/80 flex items-center gap-2">
            <Quote size={12} className="text-zinc-600" />
            Daily Wisdom
          </SectionTitle>
          <div className="flex items-center gap-2">
             <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-tight mr-2">
              {today}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={refresh}
              title="New wisdom"
            >
              <RefreshCcw size={14} className="text-zinc-500 group-hover:rotate-180 transition-transform duration-500" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-8 w-8 p-0 transition-all", isFavorite && "text-rose-400")}
              onClick={handleToggleFavorite}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={wisdom.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={THEME.animation.fast}
            className="relative z-10"
          >
            <blockquote className="flex flex-col gap-4">
              <p className="text-[22px] sm:text-[24px] font-medium leading-tight tracking-tight text-zinc-100 italic">
                &ldquo;{wisdom.quote}&rdquo;
              </p>
              <footer className="flex items-center gap-3">
                <div className="h-px w-6 bg-white/10" />
                <cite className="text-[13px] not-italic font-bold text-zinc-400 uppercase tracking-widest">
                  {wisdom.author ?? "Unknown"}
                </cite>
                <Badge variant={categoryColors[wisdom.category]} className="ml-auto">
                  {wisdom.category}
                </Badge>
              </footer>
            </blockquote>
          </motion.div>
        </AnimatePresence>

        {/* Reflection Area */}
        <div className="mt-4 pt-6 border-t border-white/5 relative z-10">
          {isEditing ? (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-col gap-3"
            >
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What does this mean for your day?"
                className="w-full h-28 rounded-xl bg-zinc-950/50 border border-white/10 p-4 text-[13px] text-zinc-200 outline-none focus:border-emerald-400/30 transition-all resize-none shadow-inner"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveReflection}>Save Reflection</Button>
              </div>
            </motion.div>
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className="group/ref cursor-text flex flex-col gap-2 p-3 -m-3 rounded-xl transition-all hover:bg-white/[0.03]"
            >
              <SectionTitle className="text-[9px] text-zinc-600 group-hover/ref:text-zinc-500 transition-colors uppercase tracking-widest font-bold">
                Your Reflection
              </SectionTitle>
              <p className={cn(
                "text-[14px] leading-relaxed",
                reflection ? "text-zinc-300" : "text-zinc-600 italic"
              )}>
                {reflection || "Capture a quick thought on this wisdom..."}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
