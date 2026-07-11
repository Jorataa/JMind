// ─────────────────────────────────────────────────────────────────────────────
// Branch colors for AI-generated mind maps.
//
// When the AI builds a whole map, every main branch (direct child of the root)
// gets its own hue and passes it down to its sub-topics — the classic mind-map
// convention that keeps branches traceable at a glance. The root keeps its
// evergreen treatment; manually created nodes never get a branch color.
//
// Evergreen re-expression: nodes are paper-faced (§6.6), so the branch hue is
// carried by a slim left rule + the minimap swatch instead of a dark face.
// The stored keys are unchanged — existing maps keep their colors.
//
// The color is stored in node.data.color as one of the keys below (the same
// field sticky notes use for their paper color — the two node types render
// through different components, so the keys never mix).
// ─────────────────────────────────────────────────────────────────────────────

export interface BranchColorStyle {
  /** The branch hue — left rule on the node face. */
  accent: string;
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

// Muted, paper-compatible values: saturated enough to trace a branch,
// quiet enough to sit beside ink and evergreen.
export const BRANCH_COLOR_STYLES: Record<string, BranchColorStyle> = {
  sky: { accent: "#4E86A8", swatch: "#4E86A8" },
  amber: { accent: "#C99A2E", swatch: "#C99A2E" },
  violet: { accent: "#8A73B8", swatch: "#8A73B8" },
  rose: { accent: "#B96A80", swatch: "#B96A80" },
  teal: { accent: "#4E9B8F", swatch: "#4E9B8F" },
  indigo: { accent: "#6B78AE", swatch: "#6B78AE" },
  lime: { accent: "#8FA24E", swatch: "#8FA24E" },
  orange: { accent: "#C07A45", swatch: "#C07A45" },
  fuchsia: { accent: "#A868A0", swatch: "#A868A0" },
};

/** The hue for the Nth main branch (wraps when a map has more branches). */
export const branchColorAt = (index: number): string =>
  BRANCH_COLOR_ORDER[index % BRANCH_COLOR_ORDER.length];
