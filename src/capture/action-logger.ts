import { performance } from "node:perf_hooks";
import type { Locator } from "playwright";
import type { CoordEvent, LoggedActions } from "./types.js";

interface ActionPacing {
  actionDelayMs: number;
  typeCharDelayMs: number;
  microPauseMinMs: number;
  microPauseMaxMs: number;
  humanizeSeed: number;
}

async function centerOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) {
    return { x: 0, y: 0 };
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Deterministic PRNG for reproducible “random” micro-pauses between runs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomIntInclusive(rng: () => number, min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

export function createLoggedActions(events: CoordEvent[], pacing: ActionPacing): LoggedActions {
  const start = performance.now();
  const now = () => Math.max(0, Math.round(performance.now() - start));
  const rng = mulberry32(pacing.humanizeSeed);

  const microPauseMs = () =>
    randomIntInclusive(rng, pacing.microPauseMinMs, pacing.microPauseMaxMs);

  return {
    async hover(locator, detail) {
      await locator.hover();
      const { x, y } = await centerOf(locator);
      events.push({ t: now(), type: "hover", x, y, detail });
      await sleep(pacing.actionDelayMs);
    },
    async click(locator, detail) {
      await locator.hover();
      const { x, y } = await centerOf(locator);
      events.push({ t: now(), type: "position", x, y, detail });
      await sleep(microPauseMs());
      events.push({ t: now(), type: "click", x, y, detail });
      await locator.click();
      await sleep(pacing.actionDelayMs);
    },
    async dblclick(locator, detail) {
      await locator.hover();
      const { x, y } = await centerOf(locator);
      events.push({ t: now(), type: "position", x, y, detail });
      await sleep(microPauseMs());
      events.push({ t: now(), type: "dblclick", x, y, detail: { clickCount: 2, ...(detail ?? {}) } });
      await locator.dblclick();
      await sleep(pacing.actionDelayMs);
    },
    async type(locator, text, detail) {
      await locator.hover();
      const { x, y } = await centerOf(locator);
      events.push({ t: now(), type: "position", x, y, detail });
      await sleep(microPauseMs());
      events.push({ t: now(), type: "type", x, y, detail: { chars: text.length, ...(detail ?? {}) } });
      await locator.click();
      await locator.pressSequentially(text, { delay: pacing.typeCharDelayMs });
      // Hold camera focus on the field until typing (and a short read beat) finish; otherwise the
      // zoom path interpolates toward the next click for the whole pressSequentially duration.
      await sleep(Math.max(pacing.actionDelayMs, 450));
      events.push({ t: now(), type: "position", x, y, detail });
    }
  };
}
