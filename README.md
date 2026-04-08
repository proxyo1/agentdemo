# AgentDemo

AgentDemo creates polished demo videos of local web app flows using Playwright capture plus cinematic compositing (camera zoom, synthetic cursor, click ripples).

## Quick Start (Agent-First)

Use this package through Cursor+ the AgentDemo skill. The user experience should be:

1. Install AgentDemo in your app repo.
2. Install the AgentDemo skill.
3. Ask the agent what flow to demo.
4. Agent generates the script, runs AgentDemo, and returns the output video path.

### 1) Install in your app repo

```bash
npm install agentdemo
```

### 2) Install the skill

Add the AgentDemo skill in your Cursor setup for that repo.

### 3) Ask the agent

Example prompt pattern:

- "Create and export a demo video of login -> open dashboard -> create item -> view details."

The agent should handle defaults automatically:

- URL: `http://localhost:3000`
- Output: `demo.mp4`
- Script path: `.agentdemo/demo-flow.ts`

## What AgentDemo Outputs

- Final video: `*.mp4`
- Sidecar timeline/debug data: `*.zoom.json`

## Notes

- Compositing is enabled by default (window frame, background, zoom, cursor, ripples).
- If compositing fails, AgentDemo falls back to ffmpeg transcode.
- On first run in some environments, Playwright may require browser install (`chromium`).

## Advanced / Manual CLI (Optional)

Manual usage is available for debugging and maintainer workflows:

```bash
npx agentdemo run --script <path-to-script.ts> --url <local-url> --out <output.mp4>
```

For AgentDemo source development:

```bash
npm run build
node dist/cli/index.js run --script <path-to-script.ts> --url <local-url> --out <output.mp4>
```

## Custom Cursor PNG (Optional)

- Default cursor asset is loaded from `assets/cursor.png` in the AgentDemo package.
- Override with `--cursor-png <path>`.
- Hotspot defaults to `(4,2)` and can be changed with:
  - `--cursor-hotspot-x <n>`
  - `--cursor-hotspot-y <n>`

