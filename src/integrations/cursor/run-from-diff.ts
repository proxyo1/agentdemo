import { resolve } from "node:path";
import { generateScriptFromDiff } from "./generate-script-from-diff.js";
import { executeGeneratedScript } from "./execute-generated-script.js";

export interface RunFromDiffInput {
  url: string;
  out: string;
  baseRef: string;
  scriptPath?: string;
  cursorPng?: string;
  cursorHotspotX?: number;
  cursorHotspotY?: number;
}

export async function runFromDiff(input: RunFromDiffInput): Promise<{ scriptPath: string; fileCount: number }> {
  const scriptPath = resolve(input.scriptPath ?? ".autodemo/tmp/generated-demo.ts");
  const generated = await generateScriptFromDiff({
    baseRef: input.baseRef,
    outputScriptPath: scriptPath,
    url: input.url
  });

  await executeGeneratedScript({
    scriptPath,
    url: input.url,
    out: input.out,
    cursorPng: input.cursorPng,
    cursorHotspotX: input.cursorHotspotX,
    cursorHotspotY: input.cursorHotspotY
  });

  return {
    scriptPath,
    fileCount: generated.fileCount
  };
}
