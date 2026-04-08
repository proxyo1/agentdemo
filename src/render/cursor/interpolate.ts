import type { ClickRipple, CursorKeyframe } from "./effects.js";
import { easeInOutCubic } from "../zoom/math.js";
import type { CursorStyleProfile } from "../style-profile.js";

export function interpolateCursorAtTime(
  keyframes: CursorKeyframe[],
  t: number,
  style: CursorStyleProfile
): CursorKeyframe | null {
  if (keyframes.length === 0) return null;
  if (t <= keyframes[0].t) return keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (t >= last.t) return last;

  let lo = 0;
  let hi = keyframes.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >>> 1;
    if (keyframes[mid].t <= t) lo = mid;
    else hi = mid;
  }

  const a = keyframes[lo];
  const b = keyframes[hi];
  const span = b.t - a.t;
  const u = span > 0 ? (t - a.t) / span : 0;
  /** Ease-in-out along the segment so speed is low at takeoff/landing (human-like hand motion). */
  const eased = easeInOutCubic(u);
  const baseX = a.x + (b.x - a.x) * eased;
  const baseY = a.y + (b.y - a.y) * eased;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const segmentLen = Math.sqrt(dx * dx + dy * dy);
  let arcX = 0;
  let arcY = 0;
  if (segmentLen > 10) {
    const nx = -dy / segmentLen;
    const ny = dx / segmentLen;
    const dirSign = lo % 2 === 0 ? 1 : -1;
    const amplitude = Math.min(style.arcAmplitudeMax, Math.max(1.25, segmentLen * style.arcAmplitudeFactor));
    const arc = Math.sin(Math.PI * u) * amplitude * dirSign;
    arcX = nx * arc;
    arcY = ny * arc;
  }

  return {
    t,
    x: baseX + arcX,
    y: baseY + arcY,
    visible: true,
    scale: a.scale + (b.scale - a.scale) * eased
  };
}

export interface ActiveRippleDraw {
  x: number;
  y: number;
  progress: number;
  maxRadius: number;
}

export function activeRipplesAtTime(ripples: ClickRipple[], t: number): ActiveRippleDraw[] {
  const out: ActiveRippleDraw[] = [];
  for (const r of ripples) {
    const dt = t - r.t;
    if (dt < 0 || dt > r.durationMs) continue;
    out.push({
      x: r.x,
      y: r.y,
      progress: dt / r.durationMs,
      maxRadius: r.maxRadius
    });
  }
  return out;
}
