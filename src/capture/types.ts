import type { Locator, Page } from "playwright";

/** `position` = same-point cursor sample for camera path only (no zoom anchor, no ripples). */
export type ActionType = "hover" | "click" | "dblclick" | "type" | "position";

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
  hover(locator: Locator, detail?: Record<string, string | number | boolean>): Promise<void>;
  click(locator: Locator, detail?: Record<string, string | number | boolean>): Promise<void>;
  dblclick(locator: Locator, detail?: Record<string, string | number | boolean>): Promise<void>;
  type(locator: Locator, text: string, detail?: Record<string, string | number | boolean>): Promise<void>;
}

export interface DemoContext {
  page: Page;
  actions: LoggedActions;
}

export type DemoScript = (context: DemoContext) => Promise<void>;
