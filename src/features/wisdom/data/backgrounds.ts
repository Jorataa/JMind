import { Mountain, Waves, Fish, TreePine, Sparkles, type LucideIcon } from "lucide-react";

export type WisdomBackgroundId =
  | "mountain"
  | "ocean"
  | "jellyfish"
  | "forest"
  | "aurora";

export type FlourishKind = "none" | "fog" | "waves" | "jellyfish" | "rays" | "aurora";

export interface ParticleConfig {
  /** "drift" = motes rising gently; "twinkle" = stars pulsing in place. */
  mode: "drift" | "twinkle";
  count: number;
  /** Soft glow colour (rgba); rendered as a radial dot. */
  color: string;
  /** [min, max] size in px. */
  size: [number, number];
  /** Peak opacity. */
  opacity: number;
}

/** The animated personality of a background — what makes it feel alive. */
export interface WisdomScene {
  flourish: FlourishKind;
  /** A short, evocative one-liner shown faintly under the scene name in the picker. */
  mood: string;
  /** CSS `background` value for the breathing corner light (screen-blended). */
  light: string;
  particles: ParticleConfig;
}

export interface WisdomBackgroundPreset {
  id: WisdomBackgroundId;
  label: string;
  icon: LucideIcon;
  /** Tint used for the selected ring + icon accent in the picker. */
  tint: string;
  /**
   * Always-rendered base layer. A rich, cinematic CSS gradient that evokes the
   * scene so the card looks beautiful even before (or without) a photo asset.
   */
  gradient: string;
  /**
   * Progressive enhancement: dropped-in photo at this path layers on top of the
   * gradient. If the file is missing it simply fails to load and the gradient
   * shows through — no broken images, no code changes needed to add real art.
   */
  image: string;
  scene: WisdomScene;
}

export const WISDOM_BACKGROUNDS: WisdomBackgroundPreset[] = [
  {
    id: "mountain",
    label: "Mountain",
    icon: Mountain,
    tint: "#f0a868",
    gradient:
      "radial-gradient(120% 90% at 78% 16%, rgba(255,214,150,0.55) 0%, rgba(255,170,90,0.15) 28%, transparent 55%), linear-gradient(180deg, #1d2a48 0%, #41507a 24%, #8f7d7a 46%, #c9885c 64%, #6a5238 82%, #3a3024 100%)",
    image: "/backgrounds/mountain.webp",
    scene: {
      flourish: "fog",
      mood: "I can rise above my challenges.",
      light:
        "radial-gradient(100% 80% at 80% 12%, rgba(255,216,150,0.55) 0%, rgba(255,170,90,0.12) 40%, transparent 62%)",
      particles: { mode: "drift", count: 14, color: "rgba(255,238,205,1)", size: [1, 2.5], opacity: 0.5 },
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: Waves,
    tint: "#f6a44b",
    gradient:
      "radial-gradient(90% 70% at 50% 40%, rgba(255,221,150,0.6) 0%, rgba(255,160,70,0.18) 30%, transparent 58%), linear-gradient(180deg, #28406b 0%, #5a6b8f 20%, #e09a54 46%, #d98a4a 52%, #355063 70%, #14323f 100%)",
    image: "/backgrounds/ocean.webp",
    scene: {
      flourish: "waves",
      mood: "My mind is calm and clear.",
      light:
        "radial-gradient(85% 65% at 50% 38%, rgba(255,222,155,0.5) 0%, rgba(255,160,70,0.12) 38%, transparent 60%)",
      particles: { mode: "drift", count: 16, color: "rgba(255,246,222,1)", size: [1, 2], opacity: 0.4 },
    },
  },
  {
    id: "jellyfish",
    label: "Jellyfish",
    icon: Fish,
    tint: "#5aa6ff",
    gradient:
      "radial-gradient(80% 70% at 50% -5%, rgba(120,190,255,0.5) 0%, rgba(60,130,230,0.16) 35%, transparent 62%), linear-gradient(180deg, #0d3a6b 0%, #0a2750 30%, #06182f 64%, #01060f 100%)",
    image: "/backgrounds/jellyfish.webp",
    scene: {
      flourish: "jellyfish",
      mood: "Mystery and deep tranquility.",
      light:
        "radial-gradient(75% 60% at 50% -8%, rgba(130,195,255,0.55) 0%, rgba(60,130,230,0.15) 40%, transparent 66%)",
      particles: { mode: "drift", count: 26, color: "rgba(150,210,255,1)", size: [1, 2.5], opacity: 0.55 },
    },
  },
  {
    id: "forest",
    label: "Forest",
    icon: TreePine,
    tint: "#86c06a",
    gradient:
      "radial-gradient(70% 80% at 50% 6%, rgba(225,255,195,0.5) 0%, rgba(150,210,110,0.18) 32%, transparent 60%), linear-gradient(180deg, #1f3a1f 0%, #2f5a30 32%, #3a6b39 56%, #24401f 82%, #13230d 100%)",
    image: "/backgrounds/forest.webp",
    scene: {
      flourish: "rays",
      mood: "I am growing, quietly and surely.",
      light:
        "radial-gradient(70% 70% at 50% 3%, rgba(225,255,195,0.55) 0%, rgba(150,210,110,0.14) 42%, transparent 64%)",
      particles: { mode: "drift", count: 18, color: "rgba(232,255,200,1)", size: [1.5, 3], opacity: 0.6 },
    },
  },
  {
    id: "aurora",
    label: "Aurora",
    icon: Sparkles,
    tint: "#5ad6a0",
    gradient:
      "radial-gradient(80% 55% at 35% 16%, rgba(90,235,160,0.4) 0%, rgba(140,90,235,0.2) 38%, transparent 66%), linear-gradient(180deg, #060b22 0%, #0c1738 34%, #112a4e 62%, #163a52 100%)",
    image: "/backgrounds/aurora.webp",
    scene: {
      flourish: "aurora",
      mood: "There is something greater than me.",
      light:
        "radial-gradient(80% 50% at 35% 12%, rgba(90,235,160,0.4) 0%, rgba(140,90,235,0.16) 44%, transparent 66%)",
      particles: { mode: "twinkle", count: 42, color: "rgba(255,255,255,1)", size: [0.8, 1.8], opacity: 0.9 },
    },
  },
];

/** Used for custom uploads: calm framing, no scene-specific flourish. */
export const NEUTRAL_SCENE: WisdomScene = {
  flourish: "none",
  mood: "Your own quiet view.",
  light:
    "radial-gradient(90% 70% at 50% 0%, rgba(255,255,255,0.18) 0%, transparent 60%)",
  particles: { mode: "drift", count: 10, color: "rgba(255,255,255,1)", size: [1, 2], opacity: 0.25 },
};

export const DEFAULT_BACKGROUND_ID: WisdomBackgroundId = "mountain";

export const getBackgroundPreset = (id: string): WisdomBackgroundPreset =>
  WISDOM_BACKGROUNDS.find((b) => b.id === id) ?? WISDOM_BACKGROUNDS[0];

/** Custom-upload constraints, shared by the picker UI and validation. */
export const CUSTOM_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
export const CUSTOM_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const CUSTOM_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
