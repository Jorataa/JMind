// ─────────────────────────────────────────────────────────────────────────────
// Drawing layer data model + geometry (Drawing Mode).
//
// Pure module — no React, no DOM assumptions beyond what callers pass in.
// Strokes/texts/images live in FLOW coordinates (the same space as node
// positions), so they stay glued to the map at any pan/zoom and ride along
// with the existing per-map persistence, cross-tab sync and cloud sync.
//
// Stroke rendering is dependency-free on purpose: a variable-width outline
// along a velocity-smoothed polyline (the perfect-freehand idea, sized to our
// needs) keeps the bundle small and the strokes crisp in PNG exports.
// ─────────────────────────────────────────────────────────────────────────────

export type DrawingTool = "pen" | "pencil";

export interface DrawingStroke {
  id: string;
  tool: DrawingTool;
  /** CSS color — one of DRAWING_COLORS in practice, but any string survives. */
  color: string;
  /** Base stroke width in flow px. */
  size: number;
  /** Flat [x0, y0, x1, y1, …] in flow coordinates — compact in storage. */
  points: number[];
}

export interface DrawingText {
  id: string;
  x: number;
  y: number;
  /** Wrap width in flow px. */
  width: number;
  text: string;
  fontSize: number;
  color: string;
}

export interface DrawingImage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Data URL — persisted with the map so refresh restores it exactly. */
  src: string;
}

export interface MapDrawing {
  strokes: DrawingStroke[];
  texts: DrawingText[];
  images: DrawingImage[];
}

export const EMPTY_DRAWING: MapDrawing = { strokes: [], texts: [], images: [] };

export const createEmptyDrawing = (): MapDrawing => ({
  strokes: [],
  texts: [],
  images: [],
});

/** The Evergreen ink palette offered by the draw toolbar. */
export const DRAWING_COLORS = [
  "#1F2921", // ink
  "#24523B", // deep green
  "#1E9B68", // emerald
  "#C99A2E", // ochre
  "#A65A3A", // clay
  "#4A6FA5", // slate blue
] as const;

export const DRAWING_SIZES = [2.5, 4.5, 8] as const;

export const DEFAULT_TEXT_FONT_SIZE = 16;
export const TEXT_FONT_SIZES = [13, 16, 22, 30] as const;

// ── Sanitization (persistence boundary — mirrors nodes/edges) ────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const sanitizeStroke = (value: unknown): DrawingStroke | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  const rawPoints = Array.isArray(value.points) ? value.points : [];
  const points: number[] = [];
  // Keep whole x/y pairs only; a trailing orphan or a NaN poisons hit-testing.
  for (let i = 0; i + 1 < rawPoints.length; i += 2) {
    const x = rawPoints[i];
    const y = rawPoints[i + 1];
    if (finite(x) && finite(y)) points.push(x, y);
  }
  if (points.length < 4) return null; // a stroke needs at least two points

  return {
    id: value.id,
    tool: value.tool === "pencil" ? "pencil" : "pen",
    color: typeof value.color === "string" && value.color ? value.color : DRAWING_COLORS[0],
    size: finite(value.size) ? Math.min(Math.max(value.size, 1), 40) : DRAWING_SIZES[1],
    points,
  };
};

const sanitizeText = (value: unknown): DrawingText | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  if (typeof value.text !== "string") return null;
  if (!finite(value.x) || !finite(value.y)) return null;

  return {
    id: value.id,
    x: value.x,
    y: value.y,
    width: finite(value.width) ? Math.min(Math.max(value.width, 60), 1200) : 240,
    text: value.text.slice(0, 4000),
    fontSize: finite(value.fontSize)
      ? Math.min(Math.max(value.fontSize, 10), 72)
      : DEFAULT_TEXT_FONT_SIZE,
    color: typeof value.color === "string" && value.color ? value.color : DRAWING_COLORS[0],
  };
};

const MAX_IMAGE_SRC_CHARS = 900_000; // ~0.9MB of data URL per image, post-downscale

const sanitizeImage = (value: unknown): DrawingImage | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  if (typeof value.src !== "string" || !value.src.startsWith("data:image/")) return null;
  if (value.src.length > MAX_IMAGE_SRC_CHARS) return null;
  if (!finite(value.x) || !finite(value.y)) return null;

  return {
    id: value.id,
    x: value.x,
    y: value.y,
    width: finite(value.width) ? Math.min(Math.max(value.width, 24), 4000) : 320,
    height: finite(value.height) ? Math.min(Math.max(value.height, 24), 4000) : 240,
    src: value.src,
  };
};

const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/**
 * Validates a persisted drawing. A map saved before Drawing Mode existed has
 * no `drawing` key at all — that returns the empty drawing, which *is* the
 * migration (nothing to convert, nothing lost).
 */
export function sanitizeDrawing(value: unknown): MapDrawing {
  if (!isRecord(value)) return createEmptyDrawing();

  return {
    strokes: dedupeById(
      (Array.isArray(value.strokes) ? value.strokes : [])
        .map(sanitizeStroke)
        .filter((s): s is DrawingStroke => s !== null)
    ),
    texts: dedupeById(
      (Array.isArray(value.texts) ? value.texts : [])
        .map(sanitizeText)
        .filter((t): t is DrawingText => t !== null)
    ),
    images: dedupeById(
      (Array.isArray(value.images) ? value.images : [])
        .map(sanitizeImage)
        .filter((i): i is DrawingImage => i !== null)
    ),
  };
}

export const isDrawingEmpty = (drawing: MapDrawing): boolean =>
  drawing.strokes.length === 0 && drawing.texts.length === 0 && drawing.images.length === 0;

// ── Stroke geometry ──────────────────────────────────────────────────────────

interface OutlinePoint {
  x: number;
  y: number;
  /** 0..1 — synthesized pressure from drawing speed (slow = thick). */
  pressure: number;
}

/**
 * Resample the raw pointer trail with a light moving average and synthesize
 * pressure from speed. Mouse/touch report no real pressure; slower movement
 * reading as a heavier line is what makes ink feel like ink.
 */
function smoothPoints(points: number[], size: number): OutlinePoint[] {
  const raw: OutlinePoint[] = [];
  for (let i = 0; i + 1 < points.length; i += 2) {
    raw.push({ x: points[i], y: points[i + 1], pressure: 0.5 });
  }
  if (raw.length === 0) return raw;

  // Speed → pressure: normalize step distance against the stroke size.
  for (let i = 1; i < raw.length; i++) {
    const dx = raw[i].x - raw[i - 1].x;
    const dy = raw[i].y - raw[i - 1].y;
    const speed = Math.min(Math.hypot(dx, dy) / (size * 4), 1);
    const target = 1 - 0.65 * speed;
    // Ease pressure so a sudden stop doesn't blob.
    raw[i].pressure = raw[i - 1].pressure + (target - raw[i].pressure) * 0.35;
  }

  if (raw.length < 3) return raw;
  const smoothed: OutlinePoint[] = [raw[0]];
  for (let i = 1; i < raw.length - 1; i++) {
    smoothed.push({
      x: (raw[i - 1].x + raw[i].x * 2 + raw[i + 1].x) / 4,
      y: (raw[i - 1].y + raw[i].y * 2 + raw[i + 1].y) / 4,
      pressure: raw[i].pressure,
    });
  }
  smoothed.push(raw[raw.length - 1]);
  return smoothed;
}

/**
 * Build a closed variable-width outline around the polyline and return it as
 * an SVG path. Left edge out, right edge back, round caps via arc-ish wedges.
 */
export function strokeToPath(stroke: Pick<DrawingStroke, "points" | "size" | "tool">): string {
  const pts = smoothPoints(stroke.points, stroke.size);
  if (pts.length === 0) return "";

  const base = stroke.size / 2;
  // Pencil keeps a firmer, drier line; pen swells more with pressure.
  const pressureGain = stroke.tool === "pencil" ? 0.5 : 0.9;

  if (pts.length === 1) {
    const r = base;
    const { x, y } = pts[0];
    return `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
  }

  const left: string[] = [];
  const right: string[] = [];

  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    let nx = next.y - prev.y;
    let ny = -(next.x - prev.x);
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;

    const radius = Math.max(0.35, base * (0.55 + pts[i].pressure * pressureGain));
    left.push(`${(pts[i].x + nx * radius).toFixed(2)} ${(pts[i].y + ny * radius).toFixed(2)}`);
    right.push(`${(pts[i].x - nx * radius).toFixed(2)} ${(pts[i].y - ny * radius).toFixed(2)}`);
  }

  right.reverse();
  return `M ${left[0]} L ${left.slice(1).join(" L ")} L ${right.join(" L ")} Z`;
}

/**
 * Distance-based eraser hit test in flow coordinates: true when `point` comes
 * within `radius` of any segment of the stroke (inflated by the stroke size).
 */
export function strokeHitTest(
  stroke: DrawingStroke,
  point: { x: number; y: number },
  radius: number
): boolean {
  const pts = stroke.points;
  const hit = radius + stroke.size / 2;
  const hitSq = hit * hit;

  for (let i = 0; i + 3 < pts.length; i += 2) {
    const x1 = pts[i];
    const y1 = pts[i + 1];
    const x2 = pts[i + 2];
    const y2 = pts[i + 3];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / lenSq));
    const px = x1 + t * dx - point.x;
    const py = y1 + t * dy - point.y;
    if (px * px + py * py <= hitSq) return true;
  }
  // Single-point strokes have one pair; check it directly.
  if (pts.length === 2) {
    const px = pts[0] - point.x;
    const py = pts[1] - point.y;
    return px * px + py * py <= hitSq;
  }
  return false;
}

/** Rough serialized weight of a drawing — used to keep localStorage honest. */
export function drawingByteEstimate(drawing: MapDrawing): number {
  let total = 0;
  for (const stroke of drawing.strokes) total += 40 + stroke.points.length * 8;
  for (const text of drawing.texts) total += 80 + text.text.length;
  for (const image of drawing.images) total += 80 + image.src.length;
  return total;
}

/** Ceiling for one map's drawing payload (localStorage is ~5MB for the app). */
export const DRAWING_BYTE_BUDGET = 2_600_000;
