// OpenScreen-inspired cursor effects timeline for synthetic cursor/click emphasis.
import type { CoordEvent } from "../../capture/types.js";
import type { CursorStyleProfile } from "../style-profile.js";

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

export function buildCursorEffects(events: CoordEvent[], style: CursorStyleProfile): CursorEffectsTimeline {
  const ordered = [...events].sort((a, b) => a.t - b.t);
  const cursor: CursorKeyframe[] = ordered.map((e) => ({
    t: e.t,
    x: e.x,
    y: e.y,
    visible: true,
    scale: e.type === "click" || e.type === "dblclick" ? style.clickScale : 1
  }));

  const ripples: ClickRipple[] = ordered
    .filter((e) => e.type === "click" || e.type === "dblclick")
    .map((e) => ({
      t: e.t,
      x: e.x,
      y: e.y,
      durationMs: e.type === "dblclick" ? style.doubleClickDurationMs : style.clickDurationMs,
      maxRadius: e.type === "dblclick" ? style.doubleClickMaxRadius : style.clickMaxRadius
    }));

  return { cursor, ripples };
}
