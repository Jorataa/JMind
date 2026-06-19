"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getBackgroundPreset,
  NEUTRAL_SCENE,
  type WisdomBackgroundPreset,
} from "../data/backgrounds";
import { WisdomScene } from "./WisdomScene";
import type { WisdomBackgroundSelection } from "@/stores/use-wisdom-background-store";

interface WisdomBackgroundProps {
  selection: WisdomBackgroundSelection;
  customImage: string | null;
  /** 0–100 overlay darkness. */
  darkness: number;
  /** 0–20 px blur. */
  blur: number;
}

// Slow, expensive ease-out — the "settling" curve behind every cinematic cut.
const CINEMATIC_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The full cinematic background stack for the Daily Wisdom sanctuary:
 *
 *   parallax wrapper (follows the cursor, set by the hero via --wisdom-px/py)
 *     └ cross-fade layer (1.2s zoom-out between scenes)
 *         └ ken-burns drift (slow continuous life)
 *             ├ gradient base — always present
 *             ├ photo — fades in once decoded (gradient carries it if missing)
 *             └ WisdomScene — living flourish + particles
 *   breathing corner light (screen) · vignette · bottom gradient · darkness scrim
 *
 * Everything below the content is decorative and pointer-transparent.
 */
export function WisdomBackground({
  selection,
  customImage,
  darkness,
  blur,
}: WisdomBackgroundProps) {
  const isCustom = selection === "custom";
  const preset: WisdomBackgroundPreset = getBackgroundPreset(
    isCustom ? "mountain" : selection
  );
  const scene = isCustom ? NEUTRAL_SCENE : preset.scene;
  const sceneId = isCustom ? "neutral" : selection;
  const imageSrc = isCustom ? customImage : preset.image;
  const layerKey = isCustom ? `custom:${customImage?.slice(-24)}` : selection;
  const blurFilter = blur > 0 ? `blur(${blur}px)` : undefined;

  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const hasPhoto = !!imageSrc && loadedSrc === imageSrc;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
      {/* Parallax wrapper — reads CSS vars the hero updates on pointer move. */}
      <div
        className="absolute inset-0"
        style={{
          transform:
            "translate3d(var(--wisdom-px, 0px), var(--wisdom-py, 0px), 0)",
          transition: "transform 0.45s ease-out",
        }}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={layerKey}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 1.2, ease: CINEMATIC_EASE }}
            className="absolute inset-0"
          >
            <div className="wisdom-kenburns absolute inset-[-10%]">
              <div
                className="absolute inset-0"
                style={{
                  background: isCustom ? "#0a0e18" : preset.gradient,
                  filter: blurFilter,
                }}
              />
              {imageSrc && (
                <PhotoLayer
                  key={imageSrc}
                  src={imageSrc}
                  blur={blurFilter}
                  onLoaded={() => setLoadedSrc(imageSrc)}
                />
              )}
              <WisdomScene sceneId={sceneId} dim={hasPhoto} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Breathing corner light — adds cinematic glow. */}
      <div
        className="wisdom-breathe pointer-events-none absolute inset-0"
        style={{ background: scene.light, mixBlendMode: "screen" }}
      />
      {/* Soft vignette. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 105% at 50% 42%, transparent 50%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Bottom gradient keeps the verse legible. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35" />
      {/* User-controlled darkness scrim. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: `rgba(9, 9, 11, ${darkness / 100})` }}
      />
    </div>
  );
}

function PhotoLayer({
  src,
  blur,
  onLoaded,
}: {
  src: string;
  blur: string | undefined;
  onLoaded: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    // Decorative, blurred background layer that must also render `data:` URLs
    // from custom uploads — next/image adds no value here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      onLoad={() => {
        setLoaded(true);
        onLoaded();
      }}
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
      style={{ filter: blur, opacity: loaded ? 1 : 0 } as CSSProperties}
    />
  );
}
