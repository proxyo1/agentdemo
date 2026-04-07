import { readdir, writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { execa } from "execa";
import { makeTempDir, removeDir } from "../../core/fs-utils.js";
import { logger } from "../../core/logger.js";
import { activeRipplesAtTime, interpolateCursorAtTime } from "../cursor/interpolate.js";
import type { CursorEffectsTimeline } from "../cursor/effects.js";
import type { MotionSample } from "../zoom/motion.js";
import type { ZoomFrame } from "../zoom/timeline.js";
import { defaultCursorPngPath, tryLoadCursorPng } from "./cursor-asset.js";
import { drawCompositedFrame } from "./draw-frame.js";

function naturalPngSort(a: string, b: string): number {
  const na = parseInt(a.replace(/\D/g, "") || "0", 10);
  const nb = parseInt(b.replace(/\D/g, "") || "0", 10);
  return na - nb;
}

async function listPngFrames(dir: string): Promise<string[]> {
  const names = await readdir(dir);
  return names.filter((n) => n.toLowerCase().endsWith(".png")).sort(naturalPngSort);
}

export interface RenderCompositeParams {
  ffmpegPath: string;
  rawVideoPath: string;
  outputPath: string;
  fps: number;
  width: number;
  height: number;
  zoomFrames: ZoomFrame[];
  cursorEffects: CursorEffectsTimeline;
  motionSamples: MotionSample[];
  /** Absolute or relative path; default `assets/cursor.png` under package root. */
  cursorPngPath?: string;
  cursorHotspotX?: number;
  cursorHotspotY?: number;
}

export async function renderCompositeMp4(params: RenderCompositeParams): Promise<void> {
  const tempIn = await makeTempDir("autodemo-in-");
  const tempOut = await makeTempDir("autodemo-out-");

  try {
    await execa(params.ffmpegPath, [
      "-y",
      "-i",
      params.rawVideoPath,
      "-vf",
      `fps=${params.fps},scale=${params.width}:${params.height}:flags=lanczos`,
      join(tempIn, "frame_%06d.png")
    ]);

    const extracted = await listPngFrames(tempIn);
    if (extracted.length === 0) {
      throw new Error("Frame extraction produced no PNGs.");
    }

    const frameMs = 1000 / Math.max(1, params.fps);
    const total = extracted.length;
    logger.info(`Compositing ${total} frames (camera zoom, cursor, ripples)...`);

    const cursorPath = params.cursorPngPath
      ? isAbsolute(params.cursorPngPath)
        ? params.cursorPngPath
        : join(process.cwd(), params.cursorPngPath)
      : defaultCursorPngPath();
    const cursorImage = await tryLoadCursorPng(cursorPath);
    if (cursorImage) {
      logger.info(`Using cursor PNG: ${cursorPath}`);
    } else {
      logger.info("No cursor PNG found at assets/cursor.png; using built-in vector cursor.");
    }

    for (let i = 0; i < total; i += 1) {
      const timeMs = i * frameMs;
      const zi = Math.min(i, Math.max(0, params.zoomFrames.length - 1));
      const zf = params.zoomFrames[zi] ?? { transform: { scale: 1, x: 0, y: 0 } };
      const mi = Math.min(i, Math.max(0, params.motionSamples.length - 1));
      const motion =
        params.motionSamples.length > 0
          ? params.motionSamples[mi]
          : { t: timeMs, velocity: 0, blurAmount: 0 };

      const cursorKf = interpolateCursorAtTime(params.cursorEffects.cursor, timeMs);
      const cursor = cursorKf ? { x: cursorKf.x, y: cursorKf.y, scale: cursorKf.scale } : null;
      const ripples = activeRipplesAtTime(params.cursorEffects.ripples, timeMs);

      const png = await drawCompositedFrame({
        framePath: join(tempIn, extracted[i]),
        width: params.width,
        height: params.height,
        transform: zf.transform,
        cursor,
        ripples,
        motionBlurAmount: motion?.blurAmount ?? 0,
        cursorImage,
        cursorHotspotX: params.cursorHotspotX,
        cursorHotspotY: params.cursorHotspotY
      });

      const outName = `comp_${String(i + 1).padStart(6, "0")}.png`;
      await writeFile(join(tempOut, outName), png);

      if (i > 0 && i % Math.max(1, Math.floor(total / 10)) === 0) {
        logger.info(`Compositing progress: ${Math.round((i / total) * 100)}%`);
      }
    }

    await execa(params.ffmpegPath, [
      "-y",
      "-framerate",
      String(params.fps),
      "-i",
      join(tempOut, "comp_%06d.png"),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "18",
      "-preset",
      "medium",
      "-movflags",
      "+faststart",
      params.outputPath
    ]);
  } finally {
    await removeDir(tempIn);
    await removeDir(tempOut);
  }
}
