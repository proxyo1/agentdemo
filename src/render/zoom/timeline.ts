import type { CoordEvent } from "../../capture/types.js";
import {
  DEFAULT_FOCUS,
  IDLE_ZOOM_SCALE
} from "./constants.js";
import type { CameraStyleProfile } from "../style-profile.js";
import { clampFocusToScale, interpolateCursorAt, type CursorPoint, type ZoomFocus } from "./focus.js";
import { clamp01, easeInOutCubic, easeOutScreenStudio } from "./math.js";
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

function blendFocus(a: ZoomFocus, b: ZoomFocus, t: number): ZoomFocus {
  return {
    cx: a.cx + (b.cx - a.cx) * t,
    cy: a.cy + (b.cy - a.cy) * t
  };
}

function focusDistance(a: ZoomFocus, b: ZoomFocus): number {
  const dx = a.cx - b.cx;
  const dy = a.cy - b.cy;
  return Math.hypot(dx, dy);
}

/**
 * Chase `to` from `from` with a max speed in normalized stage units/sec, independent of how fast
 * underlying telemetry steps (avoids one-frame teleports when ROI jumps, e.g. modal + email field).
 */
function panTowardCinematic(
  from: ZoomFocus,
  to: ZoomFocus,
  dtSec: number,
  maxSpeed: number,
  easeInMul: number,
  easeOutNear: number
): ZoomFocus {
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-7) {
    return { cx: to.cx, cy: to.cy };
  }
  const easeOutMul = 0.4 + 0.6 * clamp01(dist / Math.max(0.02, easeOutNear));
  const maxTravel = maxSpeed * dtSec * easeInMul * easeOutMul;
  const step = Math.min(dist, maxTravel);
  const k = step / dist;
  return {
    cx: from.cx + dx * k,
    cy: from.cy + dy * k
  };
}

export function buildZoomTimeline(params: {
  events: CoordEvent[];
  durationMs: number;
  fps: number;
  stageWidth: number;
  stageHeight: number;
  style: CameraStyleProfile;
}): ZoomFrame[] {
  const telemetry = toTelemetry(params.events, params.stageWidth, params.stageHeight);
  const regions = buildZoomRegions(params.events);
  const frameMs = 1000 / Math.max(1, params.fps);
  const frames: ZoomFrame[] = [];
  let smoothedFocus: ZoomFocus = DEFAULT_FOCUS;
  let prevScale = IDLE_ZOOM_SCALE;
  let prevGuided: ZoomFocus = { ...DEFAULT_FOCUS };
  let easeInFramesRemaining = 0;

  for (let t = 0; t <= params.durationMs; t += frameMs) {
    const rawFocus = interpolateCursorAt(telemetry, t) ?? smoothedFocus;
    const edgeTop = clamp01((0.24 - rawFocus.cy) / 0.24);
    const edgeSide = clamp01((Math.abs(rawFocus.cx - 0.5) - 0.34) / 0.16);
    // Slight left bias when interacting with the top band so left rails (filters, nav) stay visible.
    const revealTarget: ZoomFocus = {
      cx: edgeTop > 0.12 ? 0.46 : 0.5,
      cy: 0.5
    };
    const active = activeStrengthAt(t, regions);
    // De-tether framing from strict cursor following for top-nav interactions.
    // This keeps resulting UI changes in-frame after clicks.
    const contextualBlend = clamp01(active * 0.26 + edgeTop * 0.42 + edgeSide * 0.18);
    const guidedFocus = blendFocus(rawFocus, revealTarget, contextualBlend);

    if (focusDistance(guidedFocus, prevGuided) > params.style.cameraGuidedJumpThreshold) {
      easeInFramesRemaining = Math.max(easeInFramesRemaining, params.style.cameraEaseInFrames);
    }
    prevGuided = guidedFocus;

    const easeInMul =
      easeInFramesRemaining > 0
        ? 0.22 +
          0.78 *
            easeInOutCubic(
              (params.style.cameraEaseInFrames - easeInFramesRemaining) / params.style.cameraEaseInFrames
            )
        : 1;
    easeInFramesRemaining = Math.max(0, easeInFramesRemaining - 1);

    const dtSec = frameMs / 1000;
    smoothedFocus = panTowardCinematic(
      smoothedFocus,
      guidedFocus,
      dtSec,
      params.style.cameraPanMaxSpeed,
      easeInMul,
      params.style.cameraEaseOutNear
    );

    const targetScale = IDLE_ZOOM_SCALE + (params.style.activeZoomScale - IDLE_ZOOM_SCALE) * active;
    if (Math.abs(targetScale - prevScale) > 0.0001) {
      const duration =
        targetScale > prevScale ? params.style.zoomInTransitionWindowMs : params.style.transitionWindowMs;
      const transitionProgress = Math.min(1, frameMs / duration);
      const eased = easeOutScreenStudio(transitionProgress);
      prevScale = prevScale + (targetScale - prevScale) * eased;
    } else {
      prevScale = targetScale;
    }

    const boundedFocus = clampFocusToScale(smoothedFocus, Math.max(1, prevScale));
    const zoomProgress = clamp01((prevScale - 1) / Math.max(0.0001, params.style.activeZoomScale - 1));
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
