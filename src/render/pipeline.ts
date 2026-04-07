import { copyFile, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { execa } from "execa";
import { ensureDir } from "../core/fs-utils.js";
import type { RenderInput } from "./types.js";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static") as string | null;

async function verifyCoords(coordsPath: string): Promise<void> {
  const raw = await readFile(coordsPath, "utf-8");
  const parsed = JSON.parse(raw) as { events?: unknown[] };
  if (!Array.isArray(parsed.events)) {
    throw new Error("Invalid coords.json format.");
  }
}

export async function renderPolishedVideo(input: RenderInput): Promise<void> {
  await verifyCoords(input.coordsPath);
  await ensureDir(dirname(resolve(input.outputPath)));

  if (!ffmpegPath) {
    await copyFile(input.rawVideoPath, input.outputPath);
    return;
  }

  await execa(ffmpegPath, [
    "-y",
    "-i",
    input.rawVideoPath,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    input.outputPath
  ]);
}
