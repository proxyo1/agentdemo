// Adapted from OpenScreen (MIT): zoomRegionUtils.ts (simplified for AgentDemo)
import type { CoordEvent } from "../../capture/types.js";

export interface ZoomRegion {
  id: string;
  startMs: number;
  endMs: number;
  strength: number;
}

const CHAIN_GAP_MS = 1500;
const DEFAULT_WINDOW_MS = 1300;

export function buildZoomRegions(events: CoordEvent[]): ZoomRegion[] {
  const anchors = events
    .filter((e) => e.type === "click" || e.type === "dblclick" || e.type === "type")
    .sort((a, b) => a.t - b.t);

  if (anchors.length === 0) {
    return [];
  }

  const regions: ZoomRegion[] = [];
  let current: ZoomRegion | null = null;

  for (const anchor of anchors) {
    const start = Math.max(0, anchor.t - 250);
    const end = anchor.t + DEFAULT_WINDOW_MS;
    if (!current) {
      current = { id: `region-0`, startMs: start, endMs: end, strength: 1 };
      continue;
    }
    if (start - current.endMs <= CHAIN_GAP_MS) {
      current.endMs = Math.max(current.endMs, end);
      current.strength = Math.min(1.5, current.strength + 0.1);
    } else {
      regions.push(current);
      current = { id: `region-${regions.length}`, startMs: start, endMs: end, strength: 1 };
    }
  }

  if (current) {
    regions.push(current);
  }

  return regions;
}

export function computeRegionStrength(region: ZoomRegion, timeMs: number): number {
  if (timeMs < region.startMs || timeMs > region.endMs) return 0;
  const duration = Math.max(1, region.endMs - region.startMs);
  const local = (timeMs - region.startMs) / duration;
  if (local < 0.2) return local / 0.2;
  if (local > 0.85) return (1 - local) / 0.15;
  return 1;
}
