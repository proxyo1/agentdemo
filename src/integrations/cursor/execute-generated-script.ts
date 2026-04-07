import { execa } from "execa";

export interface ExecuteGeneratedScriptInput {
  scriptPath: string;
  url: string;
  out: string;
  cursorPng?: string;
  cursorHotspotX?: number;
  cursorHotspotY?: number;
}

export async function executeGeneratedScript(input: ExecuteGeneratedScriptInput): Promise<void> {
  const args = ["dist/cli/index.js", "run", "--script", input.scriptPath, "--url", input.url, "--out", input.out];
  if (input.cursorPng) {
    args.push("--cursor-png", input.cursorPng);
    args.push("--cursor-hotspot-x", String(input.cursorHotspotX ?? 4));
    args.push("--cursor-hotspot-y", String(input.cursorHotspotY ?? 2));
  }
  await execa("node", args, {
    stdio: "inherit",
    cwd: process.cwd()
  });
}
