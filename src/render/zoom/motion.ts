// Adapted from OpenScreen camera-velocity blur gating idea.
import type { ZoomFrame } from "./timeline.js";
import type { MotionStyleProfile } from "../style-profile.js";

export interface MotionSample {
  t: number;
  velocity: number;
  blurAmount: number;
}

export function buildMotionSamples(frames: ZoomFrame[], style: MotionStyleProfile): MotionSample[] {
  if (frames.length === 0) return [];
  const out: MotionSample[] = [{ t: frames[0].t, velocity: 0, blurAmount: 0 }];
  for (let i = 1; i < frames.length; i += 1) {
    const prev = frames[i - 1];
    const curr = frames[i];
    const dt = Math.max(1, curr.t - prev.t) / 1000;
    const dx = curr.transform.x - prev.transform.x;
    const dy = curr.transform.y - prev.transform.y;
    // Scale-only transitions (especially zoom-out) were causing harsh full-frame blur spikes.
    // Only apply a reduced contribution for zoom-in movement.
    const ds = Math.max(0, curr.transform.scale - prev.transform.scale) * style.zoomInVelocityScale;
    const v = Math.sqrt((dx / dt) ** 2 + (dy / dt) ** 2) + ds / dt;
    const n = Math.min(1, v / style.peakVelocity);
    const blurAmount =
      v < style.velocityThreshold ? 0 : Math.min(style.maxBlur, n * n * style.blurCurveFactor);
    out.push({ t: curr.t, velocity: v, blurAmount });
  }
  return out;
}
