# AutoDemo

AutoDemo records a local Playwright flow and renders a polished local `mp4`.

## Current status

- v1 path is script-required.
- Input script contract:
  - `export default async function ({ page, actions }) { ... }`
- `actions.*` methods are coordinate-logged for post-processing.

## Quick start

1. Install dependencies:
  - `npm install`
2. Build:
  - `npm run build`
3. Run:
  - `node dist/cli/index.js run --script playwright/scripts/example-flow.ts --url http://localhost:3000 --out demo.mp4 --fps 60 --startup-wait-ms 2000 --tail-wait-ms 3000 --action-delay-ms 450 --type-char-delay-ms 45`
4. Diff-driven skill flow:
  - `node dist/cli/index.js from-diff --url http://localhost:3000 --out demo.mp4 --base origin/master`

For development with TypeScript entrypoint:

- `npm run dev -- run --script playwright/scripts/example-flow.ts --url http://localhost:3000 --out demo.mp4 --fps 60 --startup-wait-ms 2000 --tail-wait-ms 3000`
- `npm run dev -- run --script playwright/scripts/example-flow.ts --url http://localhost:3000 --out demo.mp4 --fps 60 --startup-wait-ms 2000 --tail-wait-ms 3000 --action-delay-ms 450 --type-char-delay-ms 45`

Faster path without per-frame compositing (transcode only):

- Add `--no-composite` to skip zoom/cursor drawing in pixels (still writes `demo.mp4.zoom.json`).

## Notes

- **Default:** cinematic compositing is baked into the MP4 (camera zoom/pan from timeline, synthetic cursor, click ripples, light motion blur on fast camera moves) via `@napi-rs/canvas` + ffmpeg frame I/O.
- **Fallback:** if compositing throws, the CLI logs a warning and runs ffmpeg transcode/interpolation only (same as `--no-composite`).
- With `--no-interpolate`, only the ffmpeg fallback path uses a simple fps filter; compositing path encodes from PNGs at `--fps`.
- Recorder waits for `networkidle`, then applies startup/tail settle windows to avoid early cutoff.
- Scripted interactions are paced by default (`--action-delay-ms 450`, `--type-char-delay-ms 45`) to avoid rushed demos.
- Sidecar `demo.mp4.zoom.json` still includes zoom frames/regions, cursor keyframes/ripples, and motion samples for debugging.
- `from-diff` generates `.autodemo/tmp/generated-demo.ts` from changed files and runs the full pipeline.

### Custom cursor (PNG)

- Put your pointer image at `[assets/cursor.png](assets/cursor.png)` (repo root), **or** pass `--cursor-png <path>`.
- Default hot spot is `(4,2)` in PNG pixels. Override with `--cursor-hotspot-x` / `--cursor-hotspot-y`.
- Example:
  - `node dist/cli/index.js run --script playwright/scripts/example-flow.ts --url http://localhost:3000 --out demo.mp4 --cursor-png ./my-cursor.png --cursor-hotspot-x 4 --cursor-hotspot-y 2`