import type { ClickRipple, CursorKeyframe } from "./effects.js";

export function interpolateCursorAtTime(keyframes: CursorKeyframe[], t: number): CursorKeyframe | null {
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
  return {
    t,
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
    visible: true,
    scale: a.scale + (b.scale - a.scale) * u
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
