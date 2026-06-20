"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, RefreshCcw, ImageIcon, PenLine, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useToast } from "@/stores/use-toast-store";
import { useWisdomStore, useWisdomActions } from "@/stores/use-wisdom-store";
import { useWisdomBackgroundStore } from "@/stores/use-wisdom-background-store";
import { useDailyWisdom } from "../hooks/useDailyWisdom";
import { WisdomBackground } from "./WisdomBackground";
import { BackgroundSelector } from "./BackgroundSelector";

// Matches the cinematic ease used across the sanctuary's motion.
const CINEMATIC_EASE = [0.22, 1, 0.36, 1] as const;

export default function WisdomCard() {
  const { wisdom, today, dateKey, refresh } = useDailyWisdom();
  const { favorites, reflections } = useWisdomStore();
  const { toggleFavorite, saveReflection } = useWisdomActions();
  const { selection, customImage, darkness, blur } = useWisdomBackgroundStore();
  const addToast = useToast();
  const prefersReduced = useReducedMotion();

  const [reflection, setReflection] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const reflectRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
    if (reflections[dateKey]) {
      setReflection(reflections[dateKey]);
    }
  }, [dateKey, reflections]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

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

  const handleReflect = () => {
    setIsEditing(true);
    requestAnimationFrame(() =>
      reflectRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    );
  };

  // Gentle cursor parallax — translates the background a few px against the
  // pointer. CSS vars on the hero are consumed by WisdomBackground's wrapper.
  const handlePointer = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReduced) return;
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - rect.left) / rect.width - 0.5;
      const dy = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        el.style.setProperty("--wisdom-px", `${(-dx * 16).toFixed(2)}px`);
        el.style.setProperty("--wisdom-py", `${(-dy * 16).toFixed(2)}px`);
      });
    },
    [prefersReduced]
  );

  const resetParallax = useCallback(() => {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty("--wisdom-px", "0px");
    el.style.setProperty("--wisdom-py", "0px");
  }, []);

  if (!isHydrated) return null;

  return (
    <>
      <Card
        hoverable={false}
        className="overflow-hidden border-white/10 p-0 shadow-2xl shadow-black/50"
      >
        {/* ── The sanctuary ──────────────────────────────────────── */}
        <div
          ref={heroRef}
          onMouseMove={handlePointer}
          onMouseLeave={resetParallax}
          className="relative flex min-h-[440px] flex-col p-6 sm:p-8"
        >
          <WisdomBackground
            selection={selection}
            customImage={customImage}
            darkness={darkness}
            blur={blur}
          />

          {/* Minimal top bar */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/55 drop-shadow">
              Daily Wisdom
              <span className="ml-2 text-white/30">{today}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <GlassIcon onClick={refresh} title="New wisdom">
                <RefreshCcw
                  size={13}
                  className="transition-transform duration-500 group-hover/icon:rotate-180"
                />
              </GlassIcon>
              <GlassIcon
                onClick={() => setSelectorOpen(true)}
                title="Change background"
              >
                <ImageIcon size={13} />
              </GlassIcon>
            </div>
          </div>

          {/* The verse — sacred, centered, the hero of Jorata */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-10 text-center">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={wisdom.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: prefersReduced ? 0 : 0.9, ease: CINEMATIC_EASE }}
                className="flex flex-col items-center gap-6"
              >
                <Sparkles
                  size={18}
                  className="text-amber-200/80 drop-shadow-[0_0_10px_rgba(255,220,150,0.5)]"
                />
                <p className="max-w-[34rem] text-balance text-[24px] font-light leading-[1.42] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.7)] sm:text-[29px] lg:text-[31px]">
                  &ldquo;{wisdom.quote}&rdquo;
                </p>
                <cite className="text-[12px] font-semibold not-italic uppercase tracking-[0.3em] text-white/75 drop-shadow">
                  {wisdom.author ?? "Unknown"}
                </cite>

                <div className="mt-3 flex items-center gap-2.5">
                  <GlassPill onClick={handleReflect} active={isEditing}>
                    <PenLine size={13} />
                    Reflect
                  </GlassPill>
                  <GlassPill
                    onClick={handleToggleFavorite}
                    active={isFavorite}
                    className={cn(isFavorite && "text-rose-300")}
                  >
                    <Heart size={13} fill={isFavorite ? "currentColor" : "none"} />
                    {isFavorite ? "Favorited" : "Favorite"}
                  </GlassPill>
                </div>
              </motion.blockquote>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Reflection drawer ──────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {(isEditing || reflection) && (
            <motion.div
              key="reflection"
              ref={reflectRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="p-6 sm:p-7">
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                      Your Reflection
                    </span>
                    <textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      placeholder="What does this mean for your day?"
                      className="h-28 w-full resize-none rounded-xl border border-white/10 bg-zinc-950/50 p-4 text-[13px] text-zinc-200 shadow-inner outline-none transition-all focus:border-emerald-400/30"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveReflection}>
                        Save Reflection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditing(true)}
                    className="group/ref -m-3 flex cursor-text flex-col gap-2 rounded-xl p-3 transition-all hover:bg-white/[0.03]"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 transition-colors group-hover/ref:text-zinc-500">
                      Your Reflection
                    </span>
                    <p className="text-[14px] leading-relaxed text-zinc-300">{reflection}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {selectorOpen && <BackgroundSelector onClose={() => setSelectorOpen(false)} />}
    </>
  );
}

function GlassIcon({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="group/icon flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/85 backdrop-blur-md transition-all hover:bg-black/40 hover:text-white active:scale-95"
    >
      {children}
    </button>
  );
}

function GlassPill({
  children,
  onClick,
  active,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-semibold text-white/90 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95",
        active ? "border-white/30 bg-white/20" : "border-white/15 bg-white/10",
        className
      )}
    >
      {children}
    </button>
  );
}
