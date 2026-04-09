---

## name: frontend-demo-recording
description: Record a cinematic demo video of a user flow in a local frontend app using AgentDemo (Playwright). Use when the user wants a scripted screen recording, walkthrough video, or exported mp4 of an interaction in their web app—any stack (React, Vue, Svelte, Angular, etc.), not tied to a specific repository template.

# Frontend demo recording (AgentDemo)

Use this skill when the user wants a **recorded demo video** of a flow they describe in **whatever frontend app is the current workspace**.

Do not stop at writing the script. The task is complete only when a **video file exists**, or you have clearly reported a **blocking error** after attempting the workflow below.

**Scope:** The workspace is the **user’s application repo**. AgentDemo is a **tool dependency** in that repo (or run ad hoc via `npx` / package-manager equivalents), not the product being built.

## Required inputs

Use sensible defaults unless the user specifies overrides:


| Input         | Default / resolution                                                                          |
| ------------- | --------------------------------------------------------------------------------------------- |
| Local app URL | Resolve from the repo when possible (see below); if unknown, default `http://localhost:3000`. |
| Output video  | `demo.mp4` in project root (or path the user gives).                                          |
| Timing        | Workflow defaults unless the user asks for custom pacing.                                     |


Ask follow-up questions only when a value is **ambiguous or invalid**, or when **preflight fails** and an override is needed.

### Resolving the local URL (any frontend repo)

Before defaulting blindly:

1. Read `**package.json`** scripts (`dev`, `start`, `serve`, `preview`) for `--port`, `-p`, or host hints.
2. If present, check **framework config** for dev server port: e.g. `vite.config.*`, `nuxt.config.*`, `angular.json`, `svelte.config.*`, `next.config.*` (or env like `PORT` in scripts).
3. **Common ports** if still unclear: `3000` (Next, CRA, many React templates), `5173` (Vite), `4200` (Angular), `4321` (Astro), `8080` (various).

Confirm the chosen URL against **preflight reachability**; if connection fails, try the next likely port or ask the user.

## End-to-end workflow

1. **Resolve inputs** — Apply defaults for URL/output/timing; only re-confirm user-provided overrides.
2. **Preflight app reachability** — Verify the app responds at the resolved URL. If unreachable, report the error and do not claim export success.
3. **Preflight AgentDemo availability**
  - Check `package.json` (`dependencies`, `devDependencies`, `scripts`) for `agentdemo` before installing anything.
  - If present, run via `**npx agentdemo`** from project root, or the repo’s package-manager equivalent: `**pnpm exec agentdemo**`, `**yarn agentdemo**`, `**bunx agentdemo**`—match the lockfile or documented package manager (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`).
  - If AgentDemo is **not** in the repo, ask whether to add it to the **current** repo or use another path/setup.
  - Only run `**npm install agentdemo`** (or `pnpm add -D`, `yarn add -D`, etc.) after **explicit user confirmation**.
  - If the CLI fails due to package/build issues, install a release that ships `dist/`, or follow maintainer docs when applicable.
4. **Preflight Playwright browser** — On missing Chromium / browser executable errors, run `**npx playwright install chromium`** (or the same via `pnpm exec` / `yarn`). Retry from project root.
5. **Cinematic planning (required, no approval gate)**
  - Build a plan from the user prompt + **light codebase reading** (routes, pages, key components, visible copy, `data-testid` conventions).
  - Produce a hybrid artifact: **director notes** (beats, pacing) + **normalized JSON timeline** (scene / action / effect cues).
  - Prioritize cinematic quality: intentional zoom beats, readable holds, smooth narrative progression.
6. **Compile + execute** — Compile the timeline into executable browser actions. Use **immediate-stop** on first critical blocker.
7. **Export video (required)**

```bash
npx agentdemo run \
  --script <path-to-script.ts> \
  --url <local-url>
```

Use optional flags only when the user asks (for example `--out`, `--fps`, `--startup-wait-ms`, `--tail-wait-ms`, `--action-delay-ms`, `--type-char-delay-ms`).

1. **Verify output** — Confirm the final `.mp4` exists at the requested path. On failure, report the blocking step and command error. Include `***.mp4.blocker.json`** path when present.

## Cinematic planning rules

Treat the demo as a **real user session**: cursor movement and pauses should match someone **reading the page**, using **global chrome**, then acting in **content**—not a robot hopping only between distant controls.

### Realistic flow (cursor + pacing)

- **Path:** Alternate **global UI** (nav, logo, shell) with **in-viewport content** (headings, hero, the section that just scrolled into view, forms). That gives natural arcs for interpolated cursor and camera, instead of nav-only hops or jumps off-screen.
- **Dwell time:** Use `settle()` after loads and meaningful DOM changes; use `step()` with a **short hold (~350–600ms)** after actions so layout and copy are glanceable.
- **After navigation or scroll:** Optionally **hover a small, visible content anchor** in the area the user would focus on before the next header/footer action when the story needs it—not an instant jump back to nav.
- **Pre-input transitions:** Skip decorative hovers between an obvious intent pair (e.g. “Sign in” → email field). For forms/modals, go to the first relevant input unless a short wait is needed for interactivity.
- **Typing:** Prefer `actions.type` on the real input for human-like character delays; avoid paste/instant fill unless the user asks.
- **Rhythm:** No burst of clicks with no pauses; order steps as a person would (land → orient → navigate or search → see result).

### Locators and coordinates (Playwright + AgentDemo)

- **Strict mode:** Every locator must resolve to **exactly one** element. If labels repeat (nav + footer), **scope** with landmarks: `getByRole("navigation")`, `getByRole("main")`, region/testid patterns the repo already uses. Avoid page-wide `getByRole("link", { name: "…" })` when duplicates exist.
- Keep `**settle()`** after meaningful interactions and `**step()**` with a short hold (~350–600ms).
- For high-intent chains (auth, search, checkout), slightly **tighter** holds (~200–350ms) between directly related steps.
- Avoid long chains of **only** top-nav clicks without viewport interaction.
- **Recorded cursor position** is the locator’s **bounding-box center**. Huge or mostly off-screen boxes pull the composited cursor toward the **bottom or outside the viewport** between steps.
- **Do not** use `actions.hover` on **document-scale wrappers** whose center is usually off-screen. Examples by stack (not exhaustive): `main`, `body`, `**#root`** (typical React/Vite/CRA), `**#__next**` (Next.js), `**#app**` (Vue/Svelte often), `**#__nuxt**`, `**app-root**` (Angular), or full-page layout wrappers.
- **Do** use **small, in-viewport anchors** after scroll or in-page navigation: visible headings (`getByRole("heading", { level: 1 })`, section-scoped headings), cards, primary blocks, the search `form`—chosen from the **actual** DOM/routes in this repo so targets exist and stay unique.
- After **hash / in-page** jumps (e.g. `/#features`, client-router sections), prefer a heading or block **inside that section**. After returning to the top, prefer hero heading or primary hero content again.
- Prefer targets in the **visible content area**, not only header/nav.

### Adapting to the repo’s frontend style

- **Routing:** Infer from `app/`, `pages/`, `src/routes/`, `src/router/`, or framework conventions whether flows use **history**, **hash**, or **file-based** routes; align URLs in the script.
- **Auth / env:** If the flow needs login or feature flags, read how the app gates access (cookies, localStorage keys, env-driven toggles) and reflect that in the script or ask the user for test credentials only when necessary.
- **Stable selectors:** Prefer roles, accessible names, and project `**data-testid`** (or similar) when the codebase uses them consistently.

## Quality bar

- The timeline must compile into a **complete runnable** flow.
- The demo should feel like a **credible user session** (pace, cursor path, focus on content), not a stress test of the navbar.
- Avoid obvious framing issues: camera stuck in nav only, abrupt snap-pans, cursor disconnected from the read/scroll area, cursor jumping off-screen because a hover target’s **center** is below the fold.
- If the capture still looks poor, **iterate the script structure** and rerun export rather than hand-patching generated output in downstream repos.

