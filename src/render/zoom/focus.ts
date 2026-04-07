// Adapted from OpenScreen (MIT): cursorFollowUtils.ts + focusUtils.ts
import { clamp01 } from "./math.js";

export interface ZoomFocus {
  cx: number;
  cy: number;
}

export interface CursorPoint {
  timeMs: number;
  cx: number;
  cy: number;
}

export function interpolateCursorAt(telemetry: CursorPoint[], timeMs: number): ZoomFocus | null {
  if (telemetry.length === 0) return null;
  if (timeMs <= telemetry[0].timeMs) return { cx: telemetry[0].cx, cy: telemetry[0].cy };
  const last = telemetry[telemetry.length - 1];
  if (timeMs >= last.timeMs) return { cx: last.cx, cy: last.cy };

  let lo = 0;
  let hi = telemetry.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >>> 1;
    if (telemetry[mid].timeMs <= timeMs) lo = mid;
    else hi = mid;
  }

  const before = telemetry[lo];
  const after = telemetry[hi];
  const span = after.timeMs - before.timeMs;
  const t = span > 0 ? (timeMs - before.timeMs) / span : 0;
  return {
    cx: before.cx + (after.cx - before.cx) * t,
    cy: before.cy + (after.cy - before.cy) * t
  };
}

export function adaptiveSmoothFactor(
  raw: ZoomFocus,
  prev: ZoomFocus,
  minFactor: number,
  maxFactor: number,
  rampDistance: number
): number {
  const dx = raw.cx - prev.cx;
  const dy = raw.cy - prev.cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const t = Math.min(1, distance / rampDistance);
  return minFactor + (maxFactor - minFactor) * t;
}

export function smoothCursorFocus(raw: ZoomFocus, prev: ZoomFocus, factor: number): ZoomFocus {
  return {
    cx: prev.cx + (raw.cx - prev.cx) * factor,
    cy: prev.cy + (raw.cy - prev.cy) * factor
  };
}

export function clampFocusToScale(focus: ZoomFocus, zoomScale: number): ZoomFocus {
  const base = { cx: clamp01(focus.cx), cy: clamp01(focus.cy) };
  const marginX = Math.min(0.5, 1 / (2 * zoomScale));
  const marginY = Math.min(0.5, 1 / (2 * zoomScale));
  return {
    cx: Math.max(marginX, Math.min(1 - marginX, base.cx)),
    cy: Math.max(marginY, Math.min(1 - marginY, base.cy))
  };
}
