import { execa } from "execa";

export interface FfmpegRunOptions {
  ffmpegPath: string;
  inputPath: string;
  outputPath: string;
  fps: number;
  interpolate: boolean;
}

export async function runFfmpegWithFallback(opts: FfmpegRunOptions): Promise<void> {
  const primaryVf = opts.interpolate
    ? `minterpolate=fps=${opts.fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`
    : `fps=${opts.fps}`;

  try {
    await execa(
      opts.ffmpegPath,
      [
        "-y",
        "-i",
        opts.inputPath,
        "-vf",
        primaryVf,
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        opts.outputPath
      ],
      { timeout: 120_000 }
    );
  } catch {
    // Fallback keeps export resilient when minterpolate fails on some ffmpeg builds.
    await execa(
      opts.ffmpegPath,
      [
        "-y",
        "-i",
        opts.inputPath,
        "-vf",
        `fps=${opts.fps}`,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        opts.outputPath
      ],
      { timeout: 120_000 }
    );
  }
}
