/**
 * Jorata brand mark — the official node-mark (design handoff §9).
 *
 * One large hub circle with two satellite nodes on radiating lines — the
 * mind-map "grown" into a mark: one idea radiating into others.
 *
 * Flat, single-color, no gradients or shadows. Color comes from `currentColor`,
 * so callers pick the variant with Tailwind:
 *   - anywhere brand-colored → `text-emerald-500` (the themeable accent)
 *   - on dark surfaces → `text-emerald-300`
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
      viewBox="0 0 27 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {/* Spokes first so the hub and satellites sit on top of the lines. */}
      <path
        d="M13 12L19.5 6.8M13.5 18l4.6 3.4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="9.5" cy="15.5" r="5.4" fill="currentColor" />
      <circle cx="20.6" cy="6" r="3.3" fill="currentColor" />
      <circle cx="19.4" cy="22.2" r="2.4" fill="currentColor" />
    </svg>
  );
}

export default LogoMark;
