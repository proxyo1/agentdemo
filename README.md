# AgentDemo

AgentDemo creates polished demo videos of local web app flows using a cinematic-first pipeline: plan scenes first, execute interactions second, and composite effects from intentional cues.

## Quick Start (Agent-First)

Use this package through Cursor+ the AgentDemo skill. The user experience should be:

1. Install AgentDemo in your app repo.
2. Install the AgentDemo skill.
3. Ask the agent for the demo flow.
4. Agent plans scenes/effects first, executes the flow, and exports a polished video.

### 1) Install in your app repo

```bash
npm install agentdemo
```

### 2) Install the skill

Run this command in your repo to download and add the AgentDemo skill:

```bash
npx skills add proxyo1/agentdemo
```

### 3) Ask the agent

Example prompt pattern:

- "Create and export a demo video of login -> open dashboard -> create item -> view details."

The agent should handle defaults automatically:

- URL: `http://localhost:3000`
- Output: `demo.mp4`
- Plan path: `.agentdemo/cinematic-plan.json`

## How It Works

1. **Plan (Prompt + Codebase):** the agent builds director notes and a normalized cinematic timeline.
2. **Compile + Execute:** the timeline is compiled into executable browser actions.
3. **Capture + Composite:** AgentDemo records the run and applies zoom/cursor/ripple effects from plan cues.
4. **Stop On Blockers:** on first critical failure, AgentDemo stops and writes a blocker report.

## What AgentDemo Outputs

- Final video: `*.mp4`
- Sidecar timeline/debug data: `*.zoom.json`
- Blocker report on failure: `*.mp4.blocker.json`

## Notes

- Compositing is enabled by default (window frame, background, zoom, cursor, ripples).
- If compositing fails, AgentDemo falls back to ffmpeg transcode.
- On first run in some environments, Playwright may require browser install (`chromium`).

## Advanced / Manual CLI (Optional)

Manual usage is available for debugging and maintainer workflows:

```bash
npx agentdemo run --script <path-to-script.ts> --url <local-url> --out <output.mp4>
```

Plan-first mode (recommended for agent workflows):

```bash
npx agentdemo run --prompt "login via email, open jobs, search software engineer, filter linkedin" --url <local-url>
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

