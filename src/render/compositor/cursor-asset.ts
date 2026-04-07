import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadImage, type Image } from "@napi-rs/canvas";

/** Project root (works from `src/...` and `dist/...` after compile). */
function packageRootFromHere(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
}

export function defaultCursorPngPath(): string {
  return join(packageRootFromHere(), "assets", "cursor.png");
}

export async function tryLoadCursorPng(resolvedPath: string): Promise<Image | null> {
  if (!existsSync(resolvedPath)) {
    return null;
  }
  try {
    return await loadImage(resolvedPath);
  } catch {
    return null;
  }
}
