import type { CoordEvent } from "../../capture/types.js";
import {
  ACTIVE_ZOOM_SCALE,
  AUTO_FOLLOW_RAMP_DISTANCE,
  AUTO_FOLLOW_SMOOTHING_FACTOR,
  AUTO_FOLLOW_SMOOTHING_FACTOR_MAX,
  DEFAULT_FOCUS,
  IDLE_ZOOM_SCALE,
  TRANSITION_WINDOW_MS,
  ZOOM_IN_TRANSITION_WINDOW_MS
} from "./constants.js";
import { adaptiveSmoothFactor, clampFocusToScale, interpolateCursorAt, smoothCursorFocus, type CursorPoint, type ZoomFocus } from "./focus.js";
import { clamp01, easeOutScreenStudio } from "./math.js";
import { buildZoomRegions, computeRegionStrength } from "./regions.js";
import { computeZoomTransform, type AppliedTransform } from "./transform.js";

export interface ZoomFrame {
  t: number;
  focus: ZoomFocus;
  zoomScale: number;
  transform: AppliedTransform;
}

function toTelemetry(events: CoordEvent[], stageWidth: number, stageHeight: number): CursorPoint[] {
  return events
    .filter((e) => e.x >= 0 && e.y >= 0)
    .map((e) => ({
      timeMs: e.t,
      cx: clamp01(e.x / Math.max(1, stageWidth)),
      cy: clamp01(e.y / Math.max(1, stageHeight))
    }))
    .sort((a, b) => a.timeMs - b.timeMs);
}

function activeStrengthAt(t: number, regions: ReturnType<typeof buildZoomRegions>): number {
  let strength = 0;
  for (const region of regions) {
    strength = Math.max(strength, computeRegionStrength(region, t) * region.strength);
  }
  return Math.max(0, Math.min(1, strength));
}

export function buildZoomTimeline(params: {
  events: CoordEvent[];
  durationMs: number;
  fps: number;
  stageWidth: number;
  stageHeight: number;
}): ZoomFrame[] {
  const telemetry = toTelemetry(params.events, params.stageWidth, params.stageHeight);
  const regions = buildZoomRegions(params.events);
  const frameMs = 1000 / Math.max(1, params.fps);
  const frames: ZoomFrame[] = [];
  let smoothedFocus: ZoomFocus = DEFAULT_FOCUS;
  let prevScale = IDLE_ZOOM_SCALE;

  for (let t = 0; t <= params.durationMs; t += frameMs) {
    const rawFocus = interpolateCursorAt(telemetry, t) ?? smoothedFocus;
    const smoothFactor = adaptiveSmoothFactor(
      rawFocus,
      smoothedFocus,
      AUTO_FOLLOW_SMOOTHING_FACTOR,
      AUTO_FOLLOW_SMOOTHING_FACTOR_MAX,
      AUTO_FOLLOW_RAMP_DISTANCE
    );
    smoothedFocus = smoothCursorFocus(rawFocus, smoothedFocus, smoothFactor);

    const active = activeStrengthAt(t, regions);
    const targetScale = IDLE_ZOOM_SCALE + (ACTIVE_ZOOM_SCALE - IDLE_ZOOM_SCALE) * active;
    if (Math.abs(targetScale - prevScale) > 0.0001) {
      const duration = targetScale > prevScale ? ZOOM_IN_TRANSITION_WINDOW_MS : TRANSITION_WINDOW_MS;
      const transitionProgress = Math.min(1, frameMs / duration);
      const eased = easeOutScreenStudio(transitionProgress);
      prevScale = prevScale + (targetScale - prevScale) * eased;
    } else {
      prevScale = targetScale;
    }

    const boundedFocus = clampFocusToScale(smoothedFocus, Math.max(1, prevScale));
    const zoomProgress = clamp01((prevScale - 1) / Math.max(0.0001, ACTIVE_ZOOM_SCALE - 1));
    const transform = computeZoomTransform({
      stageWidth: params.stageWidth,
      stageHeight: params.stageHeight,
      zoomScale: prevScale,
      zoomProgress,
      focusX: boundedFocus.cx,
      focusY: boundedFocus.cy
    });

    frames.push({
      t: Math.round(t),
      focus: boundedFocus,
      zoomScale: prevScale,
      transform
    });
  }

  return frames;
}
