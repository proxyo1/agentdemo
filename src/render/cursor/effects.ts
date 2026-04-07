// OpenScreen-inspired cursor effects timeline for synthetic cursor/click emphasis.
import type { CoordEvent } from "../../capture/types.js";

export interface CursorKeyframe {
  t: number;
  x: number;
  y: number;
  visible: boolean;
  scale: number;
}

export interface ClickRipple {
  t: number;
  x: number;
  y: number;
  durationMs: number;
  maxRadius: number;
}

export interface CursorEffectsTimeline {
  cursor: CursorKeyframe[];
  ripples: ClickRipple[];
}

export function buildCursorEffects(events: CoordEvent[]): CursorEffectsTimeline {
  const ordered = [...events].sort((a, b) => a.t - b.t);
  const cursor: CursorKeyframe[] = ordered.map((e) => ({
    t: e.t,
    x: e.x,
    y: e.y,
    visible: true,
    scale: e.type === "click" || e.type === "dblclick" ? 0.92 : 1
  }));

  const ripples: ClickRipple[] = ordered
    .filter((e) => e.type === "click" || e.type === "dblclick")
    .map((e) => ({
      t: e.t,
      x: e.x,
      y: e.y,
      durationMs: e.type === "dblclick" ? 420 : 320,
      maxRadius: e.type === "dblclick" ? 52 : 40
    }));

  return { cursor, ripples };
}
