import { copyFile, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { ensureDir } from "../core/fs-utils.js";
import { logger } from "../core/logger.js";
import type { CoordEvent } from "../capture/types.js";
import { renderCompositeMp4 } from "./compositor/render-composite.js";
import { buildCursorEffects } from "./cursor/effects.js";
import { runFfmpegWithFallback } from "./export/ffmpeg-runner.js";
import { probeVideo } from "./probe.js";
import type { RenderInput } from "./types.js";
import { buildMotionSamples } from "./zoom/motion.js";
import { buildZoomRegions } from "./zoom/regions.js";
import { buildZoomTimeline } from "./zoom/timeline.js";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static") as string | null;

async function verifyCoords(coordsPath: string): Promise<CoordEvent[]> {
  const raw = await readFile(coordsPath, "utf-8");
  const parsed = JSON.parse(raw) as { events?: unknown[] };
  if (!Array.isArray(parsed.events)) {
    throw new Error("Invalid coords.json format.");
  }
  return parsed.events as CoordEvent[];
}

export async function renderPolishedVideo(input: RenderInput): Promise<void> {
  const events = await verifyCoords(input.coordsPath);
  await ensureDir(dirname(resolve(input.outputPath)));

  let stageWidth = 1440;
  let stageHeight = 900;
  let durationMs = Math.max(3000, events.length > 0 ? Math.max(...events.map((e) => e.t)) + 1000 : 3000);

  if (ffmpegPath) {
    try {
      const probe = await probeVideo(ffmpegPath, input.rawVideoPath);
      stageWidth = probe.width;
      stageHeight = probe.height;
      durationMs = Math.max(500, Math.ceil(probe.durationSec * 1000));
    } catch {
      logger.warn("Could not probe video; using default stage size and heuristic duration.");
    }
  }

  const zoomTimeline = buildZoomTimeline({
    events,
    durationMs,
    fps: input.fps,
    stageWidth,
    stageHeight
  });
  const zoomRegions = buildZoomRegions(events);
  const cursorEffects = buildCursorEffects(events);
  const motionSamples = buildMotionSamples(zoomTimeline);
  await writeFile(
    `${input.outputPath}.zoom.json`,
    JSON.stringify(
      {
        layers: ["background", "video", "cameraZoom", "syntheticCursor", "clickRipples"],
        zoom: { frames: zoomTimeline, regions: zoomRegions },
        cursor: cursorEffects,
        motion: motionSamples
      },
      null,
      2
    ),
    "utf-8"
  );

  if (!ffmpegPath) {
    await copyFile(input.rawVideoPath, input.outputPath);
    return;
  }

  if (input.composite) {
    try {
      await renderCompositeMp4({
        ffmpegPath,
        rawVideoPath: input.rawVideoPath,
        outputPath: input.outputPath,
        fps: input.fps,
        width: stageWidth,
        height: stageHeight,
        zoomFrames: zoomTimeline,
        cursorEffects,
        motionSamples,
        cursorPngPath: input.cursorPng,
        cursorHotspotX: input.cursorHotspotX,
        cursorHotspotY: input.cursorHotspotY
      });
      return;
    } catch (error) {
      logger.warn(
        `Cinematic compositing failed (${error instanceof Error ? error.message : String(error)}); falling back to ffmpeg transcode.`
      );
    }
  }

  await runFfmpegWithFallback({
    ffmpegPath,
    inputPath: input.rawVideoPath,
    outputPath: input.outputPath,
    fps: input.fps,
    interpolate: input.interpolate
  });
}
