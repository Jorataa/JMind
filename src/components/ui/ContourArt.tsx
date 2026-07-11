import { cn } from "@/lib/cn";

/**
 * Decorative brand artwork (design handoff §9). Always aria-hidden, always
 * pointer-transparent, opacity ≤ 60%, meant to be cropped by its container
 * (give the parent `overflow-hidden` and position these absolutely).
 */

type ArtProps = {
  className?: string;
  /** Palette the rings sit on: dark evergreen surfaces or sage AI surfaces. */
  variant?: "dark" | "sage";
  /** Pixel size of the artwork's bounding square. */
  size?: number;
  /** Draw the small emerald dot at the shared center. */
  centerDot?: boolean;
};

/** 2–3 concentric horizontally-squashed rings (ry ≈ 0.8·rx). */
export function ContourRings({
  className,
  variant = "dark",
  size = 220,
  centerDot = false,
}: ArtProps) {
  const strokes =
    variant === "dark"
      ? ["var(--color-art-1)", "var(--color-art-2)", "var(--color-art-4)"]
      : ["#C6D2BC", "#B7C6AB", "#B7C6AB"];

  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none select-none", className)}
      width={size}
      height={size * 0.82}
      viewBox="0 0 220 180"
      fill="none"
    >
      <ellipse cx="110" cy="90" rx="104" ry="83" stroke={strokes[0]} strokeWidth="1.4" />
      <ellipse cx="110" cy="90" rx="72" ry="57" stroke={strokes[1]} strokeWidth="1.3" />
      <ellipse cx="110" cy="90" rx="42" ry="33" stroke={strokes[2]} strokeWidth="1.2" />
      {centerDot && <circle cx="110" cy="90" r="3.4" fill="var(--color-emerald-500)" />}
    </svg>
  );
}

/**
 * Constellation artwork for dark hero cards — the brand mark "grown": the
 * node-mark enlarged, two sage satellites on thin evergreen lines, inside
 * faint contour rings.
 */
export function Constellation({ className, size = 240 }: { className?: string; size?: number }) {
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none select-none", className)}
      width={size}
      height={size * 0.75}
      viewBox="0 0 240 180"
      fill="none"
    >
      {/* faint rings */}
      <ellipse cx="128" cy="92" rx="102" ry="80" stroke="var(--color-art-1)" strokeWidth="1.3" />
      <ellipse cx="128" cy="92" rx="64" ry="50" stroke="var(--color-art-2)" strokeWidth="1.2" />
      {/* constellation lines */}
      <path
        d="M116 100L178 52M120 108L164 138M116 100L52 66"
        stroke="var(--color-art-2)"
        strokeWidth="1.3"
      />
      {/* the mark, grown */}
      <circle cx="112" cy="102" r="17" fill="var(--color-emerald-500)" />
      <circle cx="182" cy="49" r="8" fill="var(--color-emerald-500)" />
      <circle cx="167" cy="140" r="6" fill="var(--color-emerald-500)" />
      {/* sage satellites */}
      <circle cx="48" cy="64" r="4" fill="var(--color-sage-500)" />
      <circle cx="205" cy="96" r="3" fill="var(--color-sage-500)" />
    </svg>
  );
}
