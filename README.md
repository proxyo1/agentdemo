# AutoDemo

AutoDemo records a local browser flow with Playwright and exports a polished `mp4`.

## How it works

- You provide a demo script that exports `default async function ({ page, actions }) { ... }`.
- AutoDemo records interaction coordinates through `actions.*` wrappers.
- The render pipeline applies cinematic cursor/zoom effects and writes:
  - Final video: `*.mp4`
  - Sidecar timeline/debug data: `*.zoom.json`

## Agent-first workflow (recommended)

Use the AutoDemo skill in Cursor and ask for a specific user flow.  
Expected agent behavior:

- Generate the full script in your repo (no TODO stubs).
- Run AutoDemo to export the video.
- Verify the output file exists and report the path.

## Local development (this repo)

1. Install dependencies:
  - `npm install`
2. Build:
  - `npm run build`
3. Run:
  - `node dist/cli/index.js run --script <path-to-script.ts> --url <local-url> --out <output.mp4> --fps 60 --startup-wait-ms 2000 --tail-wait-ms 3000 --action-delay-ms 450 --type-char-delay-ms 45`

TypeScript entrypoint (without building first):

- `npm run dev -- run --script <path-to-script.ts> --url <local-url> --out <output.mp4>`

## CLI commands

- `run` - record and render from a script.
- `scaffold` - optional stub generator for manual script authoring.

## Notes

- Default mode composites zoom/cursor/ripple effects into the MP4.
- Default render style is `polished` (Screen Studio-like smoothing/treatment).
- Use `--style classic` (or `--classic`) for legacy behavior.
- `--no-composite` skips pixel compositing for faster iteration.
- If compositing fails, CLI falls back to ffmpeg-only transcode/interpolation.
- Recorder waits for `networkidle`, then applies startup/tail settle windows.
- Script actions are paced by default (`--action-delay-ms`, `--type-char-delay-ms`).

## Custom cursor PNG

- Use repo default at `assets/cursor.png`, or pass `--cursor-png <path>`.
- Hot spot defaults to `(4,2)` and can be overridden with:
  - `--cursor-hotspot-x <n>`
  - `--cursor-hotspot-y <n>`