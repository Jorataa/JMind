"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import {
  getBackgroundPreset,
  NEUTRAL_SCENE,
  type WisdomScene as SceneConfig,
} from "../data/backgrounds";

interface WisdomSceneProps {
  /** Preset id, or "neutral" for custom uploads. */
  sceneId: string;
  /** When a real photo is loaded, atmospheric flourishes dim to a subtle accent. */
  dim: boolean;
}

/** Small, stable pseudo-random generator so particle fields don't reshuffle. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The animated soul of the Daily Wisdom card: a per-scene flourish (waves,
 * drifting jellyfish, god-rays, aurora bands, fog) plus a floating particle
 * field. Pure CSS animation — gentle, calm, and motion-reduction aware.
 */
export function WisdomScene({ sceneId, dim }: WisdomSceneProps) {
  const scene: SceneConfig =
    sceneId === "neutral" ? NEUTRAL_SCENE : getBackgroundPreset(sceneId).scene;

  const particles = useMemo(() => {
    const rng = makeRng(hash(sceneId));
    const { count, size, opacity } = scene.particles;
    return Array.from({ length: count }, () => {
      const px = size[0] + rng() * (size[1] - size[0]);
      return {
        left: rng() * 100,
        top: rng() * 100,
        size: px,
        dur: 11 + rng() * 16,
        delay: -rng() * 22,
        dx: (rng() * 2 - 1) * 34,
        rise: 80 + rng() * 130,
        opacity: opacity * (0.55 + rng() * 0.55),
      };
    });
  }, [sceneId, scene]);

  const isTwinkle = scene.particles.mode === "twinkle";

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: dim ? 0.4 : 1, transition: "opacity 1.2s ease" }}
      aria-hidden
    >
      <Flourish kind={scene.flourish} />

      {/* Particle field */}
      {particles.map((p, i) => (
        <span
          key={i}
          className={isTwinkle ? "wisdom-twinkle absolute" : "wisdom-particle absolute"}
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "9999px",
              background: `radial-gradient(circle, ${scene.particles.color} 0%, transparent 70%)`,
              "--p-dur": `${p.dur}s`,
              "--p-delay": `${p.delay}s`,
              "--p-dx": `${p.dx}px`,
              "--p-rise": `${p.rise}px`,
              "--p-opacity": p.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function Flourish({ kind }: { kind: SceneConfig["flourish"] }) {
  switch (kind) {
    case "fog":
      return (
        <>
          <div
            className="wisdom-shimmer absolute inset-x-[-10%]"
            style={{
              top: "52%",
              height: "26%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,235,205,0.22), transparent)",
              filter: "blur(16px)",
              mixBlendMode: "screen",
            }}
          />
          <div
            className="wisdom-shimmer absolute inset-x-[-10%]"
            style={{
              top: "66%",
              height: "20%",
              background:
                "linear-gradient(90deg, transparent, rgba(220,210,225,0.18), transparent)",
              filter: "blur(20px)",
              mixBlendMode: "screen",
              animationDuration: "18s",
              animationDirection: "reverse",
            }}
          />
        </>
      );

    case "waves":
      return (
        <>
          <div
            className="wisdom-shimmer absolute inset-x-[-12%]"
            style={{
              top: "44%",
              height: "10%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,236,200,0.5), transparent)",
              filter: "blur(6px)",
              mixBlendMode: "screen",
            }}
          />
          <div
            className="wisdom-shimmer absolute inset-x-[-12%]"
            style={{
              top: "62%",
              height: "16%",
              background:
                "linear-gradient(90deg, transparent, rgba(180,210,225,0.28), transparent)",
              filter: "blur(12px)",
              mixBlendMode: "screen",
              animationDuration: "16s",
              animationDirection: "reverse",
            }}
          />
        </>
      );

    case "jellyfish":
      return (
        <>
          {/* Faint light beams sinking from the surface */}
          {[20, 48, 74].map((x, i) => (
            <div
              key={`beam-${x}`}
              className="wisdom-breathe absolute"
              style={{
                left: `${x}%`,
                top: "-8%",
                width: "10%",
                height: "85%",
                background:
                  "linear-gradient(to bottom, rgba(150,205,255,0.35), transparent 75%)",
                filter: "blur(10px)",
                mixBlendMode: "screen",
                transform: "skewX(-6deg)",
                animationDelay: `${i * 2}s`,
                animationDuration: "11s",
              }}
            />
          ))}
          {/* Glowing jellyfish drifting upward — Jorata's signature */}
          {[
            { left: 46, top: 40, size: 150, dur: 22, delay: 0, op: 0.85 },
            { left: 16, top: 58, size: 88, dur: 26, delay: -6, op: 0.6 },
            { left: 76, top: 64, size: 96, dur: 24, delay: -12, op: 0.6 },
            { left: 60, top: 78, size: 70, dur: 28, delay: -18, op: 0.5 },
          ].map((o, i) => (
            <div
              key={`orb-${i}`}
              className="wisdom-orb absolute"
              style={
                {
                  left: `${o.left}%`,
                  top: `${o.top}%`,
                  width: `${o.size}px`,
                  height: `${o.size}px`,
                  borderRadius: "9999px",
                  background:
                    "radial-gradient(circle at 50% 35%, rgba(190,225,255,0.9) 0%, rgba(110,170,255,0.45) 40%, rgba(60,120,230,0) 72%)",
                  filter: "blur(3px)",
                  mixBlendMode: "screen",
                  "--orb-dur": `${o.dur}s`,
                  "--orb-delay": `${o.delay}s`,
                  "--orb-opacity": o.op,
                } as CSSProperties
              }
            />
          ))}
        </>
      );

    case "rays":
      return (
        <>
          {[
            { left: 24, rot: 10, w: 14, op: 0.5, dur: 11, delay: 0 },
            { left: 44, rot: 4, w: 18, op: 0.6, dur: 13, delay: -3 },
            { left: 64, rot: -6, w: 12, op: 0.45, dur: 12, delay: -6 },
            { left: 80, rot: -12, w: 10, op: 0.4, dur: 14, delay: -9 },
          ].map((r, i) => (
            <div
              key={`ray-${i}`}
              className="wisdom-ray absolute"
              style={
                {
                  left: `${r.left}%`,
                  top: "-12%",
                  width: `${r.w}%`,
                  height: "118%",
                  background: `linear-gradient(to bottom, rgba(255,250,215,${r.op}) 0%, transparent 68%)`,
                  filter: "blur(8px)",
                  mixBlendMode: "screen",
                  "--ray-rot": `${r.rot}deg`,
                  "--ray-dur": `${r.dur}s`,
                  "--ray-delay": `${r.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </>
      );

    case "aurora":
      return (
        <>
          {[
            { top: 8, color: "rgba(90,235,160,0.5)", dur: 15, delay: 0 },
            { top: 20, color: "rgba(120,200,255,0.4)", dur: 19, delay: -5 },
            { top: 32, color: "rgba(160,110,235,0.45)", dur: 17, delay: -9 },
          ].map((b, i) => (
            <div
              key={`aur-${i}`}
              className="wisdom-aurora-band absolute"
              style={
                {
                  top: `${b.top}%`,
                  left: "-20%",
                  width: "140%",
                  height: "22%",
                  background: `linear-gradient(100deg, transparent 0%, ${b.color} 45%, transparent 80%)`,
                  filter: "blur(18px)",
                  mixBlendMode: "screen",
                  borderRadius: "50%",
                  "--aur-dur": `${b.dur}s`,
                  "--aur-delay": `${b.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </>
      );

    default:
      return null;
  }
}
