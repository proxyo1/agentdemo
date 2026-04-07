import { writeFile } from "node:fs/promises";
import type { CoordEvent } from "./types.js";

export async function writeCoords(path: string, events: CoordEvent[]): Promise<void> {
  await writeFile(path, JSON.stringify({ events }, null, 2), "utf-8");
}
