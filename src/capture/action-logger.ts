import { performance } from "node:perf_hooks";
import type { Locator } from "playwright";
import type { CoordEvent, LoggedActions } from "./types.js";

async function centerOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) {
    return { x: 0, y: 0 };
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export function createLoggedActions(events: CoordEvent[]): LoggedActions {
  const start = performance.now();
  const now = () => Math.max(0, Math.round(performance.now() - start));

  async function push(type: CoordEvent["type"], locator: Locator, detail?: CoordEvent["detail"]) {
    const { x, y } = await centerOf(locator);
    events.push({ t: now(), type, x, y, detail });
  }

  return {
    async hover(locator) {
      await push("hover", locator);
      await locator.hover();
    },
    async click(locator) {
      await push("click", locator);
      await locator.click();
    },
    async dblclick(locator) {
      await push("dblclick", locator, { clickCount: 2 });
      await locator.dblclick();
    },
    async type(locator, text) {
      await push("type", locator, { chars: text.length });
      await locator.fill(text);
    }
  };
}
