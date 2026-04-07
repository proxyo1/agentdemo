import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

export interface SessionResult {
  videoDir: string;
  close: () => Promise<void>;
}

export async function createPlaywrightSession(videoDir: string, viewport = { width: 1440, height: 900 }): Promise<SessionResult> {
  await mkdir(videoDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    recordVideo: {
      dir: videoDir,
      size: viewport
    }
  });

  return {
    videoDir,
    close: async () => {
      await context.close();
      await browser.close();
    }
  };
}
