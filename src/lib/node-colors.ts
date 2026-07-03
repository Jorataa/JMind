// ─────────────────────────────────────────────────────────────────────────────
// Branch colors for AI-generated mind maps.
//
// When the AI builds a whole map, every main branch (direct child of the root)
// gets its own hue and passes it down to its sub-topics — the classic mind-map
// convention that keeps branches traceable at a glance. The root keeps its
// emerald treatment; manually created nodes never get a branch color and keep
// their category styling.
//
// The color is stored in node.data.color as one of the keys below (the same
// field sticky notes use for their paper color — the two node types render
// through different components, so the keys never mix).
// ─────────────────────────────────────────────────────────────────────────────

export interface BranchColorStyle {
  /** Node face background (dark, matching the category palette's register). */
  bg: string;
  /** Node label text. */
  text: string;
  /** Soft shadow tint for hover/selection. */
  glow: string;
  /** Solid swatch for the minimap. */
  swatch: string;
}

/**
 * Assignment order — consecutive branches get maximally distinct hues. The
 * first six are frozen (already-generated maps store these names per node);
 * new hues are appended so bigger maps go longer before wrapping.
 */
export const BRANCH_COLOR_ORDER = [
  "sky",
  "amber",
  "violet",
  "rose",
  "teal",
  "indigo",
  "lime",
  "orange",
  "fuchsia",
] as const;

export const BRANCH_COLOR_STYLES: Record<string, BranchColorStyle> = {
  sky: { bg: "#0c4a6e", text: "#e0f2fe", glow: "rgba(14,165,233,0.2)", swatch: "#0ea5e9" },
  amber: { bg: "#78350f", text: "#fef3c7", glow: "rgba(245,158,11,0.2)", swatch: "#f59e0b" },
  violet: { bg: "#4c1d95", text: "#f5f3ff", glow: "rgba(139,92,246,0.2)", swatch: "#8b5cf6" },
  rose: { bg: "#881337", text: "#ffe4e6", glow: "rgba(244,63,94,0.2)", swatch: "#f43f5e" },
  teal: { bg: "#134e4a", text: "#ccfbf1", glow: "rgba(20,184,166,0.2)", swatch: "#14b8a6" },
  indigo: { bg: "#1e1b4b", text: "#e0e7ff", glow: "rgba(99,102,241,0.2)", swatch: "#6366f1" },
  lime: { bg: "#365314", text: "#ecfccb", glow: "rgba(132,204,22,0.2)", swatch: "#84cc16" },
  orange: { bg: "#7c2d12", text: "#ffedd5", glow: "rgba(249,115,22,0.2)", swatch: "#f97316" },
  fuchsia: { bg: "#701a75", text: "#fae8ff", glow: "rgba(217,70,239,0.2)", swatch: "#d946ef" },
};

/** The hue for the Nth main branch (wraps when a map has more branches). */
export const branchColorAt = (index: number): string =>
  BRANCH_COLOR_ORDER[index % BRANCH_COLOR_ORDER.length];
