import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

/**
 * Windows Defender and Search often lock files under %TEMP% while Playwright/ffmpeg finalize WebM.
 * Prefer a workspace under the project (typically already excluded or less aggressively scanned).
 */
export async function makeTempDir(prefix = "autodemo-"): Promise<string> {
  if (process.platform === "win32") {
    const underProject = join(process.cwd(), "node_modules", ".cache", "autodemo-workspaces");
    try {
      await mkdir(underProject, { recursive: true });
      return mkdtemp(join(underProject, prefix));
    } catch {
      /* fall through to OS temp */
    }
  }
  return mkdtemp(join(tmpdir(), prefix));
}

function isWindowsFileLockError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException)?.code;
  return code === "EBUSY" || code === "EPERM" || code === "ENOTEMPTY";
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Recursive delete with retries — Windows often returns EBUSY while AV/indexers release handles. */
export async function removeDir(path: string): Promise<void> {
  const maxAttempts = 12;
  const baseDelayMs = 75;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await rm(path, { recursive: true, force: true });
      return;
    } catch (err) {
      if (!isWindowsFileLockError(err) || attempt === maxAttempts) {
        throw err;
      }
      await sleep(baseDelayMs * attempt);
    }
  }
}
