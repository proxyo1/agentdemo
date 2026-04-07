import { execa } from "execa";

export interface ExecuteGeneratedScriptInput {
  scriptPath: string;
  url: string;
  out: string;
}

export async function executeGeneratedScript(input: ExecuteGeneratedScriptInput): Promise<void> {
  await execa("node", ["dist/cli/index.js", "run", "--script", input.scriptPath, "--url", input.url, "--out", input.out], {
    stdio: "inherit"
  });
}
