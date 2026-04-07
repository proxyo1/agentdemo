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
   - `node dist/cli/index.js run --script playwright/scripts/example-flow.ts --url http://localhost:3000 --out demo.mp4`

For development with TypeScript entrypoint:
- `npm run dev -- run --script playwright/scripts/example-flow.ts --url http://localhost:3000 --out demo.mp4`

## Notes

- Rendering is currently an ffmpeg normalization pass with a validated `coords.json`.
- PixiJS cinematic cursor/camera compositor is the next step.
