export interface RenderInput {
  rawVideoPath: string;
  coordsPath: string;
  outputPath: string;
  fps: number;
  interpolate: boolean;
  /** Apply OpenScreen-style zoom/cursor/ripple compositing into pixels (slower). */
  composite: boolean;
  /** Optional PNG for synthetic cursor (default: `<repo>/assets/cursor.png`). */
  cursorPng?: string;
  /** Hot spot in PNG pixels from top-left (default 0,0 = tip at top-left of image). */
  cursorHotspotX?: number;
  cursorHotspotY?: number;
}
