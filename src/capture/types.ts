import type { Locator, Page } from "playwright";

export type ActionType = "hover" | "click" | "dblclick" | "type";

export interface CoordEvent {
  t: number;
  type: ActionType;
  x: number;
  y: number;
  detail?: Record<string, string | number | boolean>;
}

export interface CaptureArtifacts {
  rawVideoPath: string;
  coordsPath: string;
}

export interface LoggedActions {
  hover(locator: Locator): Promise<void>;
  click(locator: Locator): Promise<void>;
  dblclick(locator: Locator): Promise<void>;
  type(locator: Locator, text: string): Promise<void>;
}

export interface DemoContext {
  page: Page;
  actions: LoggedActions;
}

export type DemoScript = (context: DemoContext) => Promise<void>;
