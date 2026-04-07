import { execa } from "execa";

export interface VideoProbe {
  durationSec: number;
  width: number;
  height: number;
}

export async function probeVideo(ffmpegPath: string, videoPath: string): Promise<VideoProbe> {
  const result = await execa(ffmpegPath, ["-hide_banner", "-i", videoPath], {
    reject: false,
    stderr: "pipe"
  });
  const text = `${result.stderr ?? ""}${result.stdout ?? ""}`;

  const durMatch = text.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
  let durationSec = 0;
  if (durMatch) {
    const h = parseInt(durMatch[1], 10);
    const m = parseInt(durMatch[2], 10);
    const s = parseFloat(durMatch[3]);
    durationSec = h * 3600 + m * 60 + s;
  }

  const sizeMatch = text.match(/Video:.*?,\s*(\d{2,5})x(\d{2,5})/);
  const width = sizeMatch ? parseInt(sizeMatch[1], 10) : 1440;
  const height = sizeMatch ? parseInt(sizeMatch[2], 10) : 900;

  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    durationSec = 5;
  } else {
    durationSec = Math.max(0.05, durationSec);
  }

  return { durationSec, width, height };
}
