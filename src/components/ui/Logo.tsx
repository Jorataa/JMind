/**
 * Jorata brand mark — the "Orbit" concept.
 *
 * Three circles of descending size — one large hub with two lines branching
 * out to a medium and a smaller node. It echoes the mind-map nodes on the
 * canvas: one idea radiating into others.
 *
 * Flat, single-color, no gradients or shadows. Color comes from `currentColor`,
 * so callers pick the variant with Tailwind:
 *   - dark backgrounds → `text-emerald-500` (#10b981, brand primary)
 *   - light backgrounds → `text-emerald-600` (#059669, brand dark variant)
 *
 * It is an inline SVG (never a raster asset) so it stays crisp at every size,
 * from a 16px favicon to a hero splash. The same geometry is mirrored in
 * `src/app/icon.svg` and the generated `favicon.ico`.
 */

type LogoMarkProps = React.SVGProps<SVGSVGElement> & {
  /** Pixel size for both width and height. Defaults to 20. */
  size?: number;
  /** Accessible label. When set, the mark is exposed as an image to screen
   *  readers; otherwise it is decorative (aria-hidden). */
  title?: string;
};

export function LogoMark({ size = 20, title, ...props }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {/* Spokes first so the hub and nodes sit on top of the lines. */}
      <path
        d="M12 16L23 9M12 16L22 23"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="5" fill="currentColor" />
      <circle cx="23" cy="9" r="3" fill="currentColor" />
      <circle cx="22" cy="23" r="2.4" fill="currentColor" />
    </svg>
  );
}

export default LogoMark;
