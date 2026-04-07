export interface RenderInput {
  rawVideoPath: string;
  coordsPath: string;
  outputPath: string;
  fps: number;
  interpolate: boolean;
  /** Apply OpenScreen-style zoom/cursor/ripple compositing into pixels (slower). */
  composite: boolean;
}
