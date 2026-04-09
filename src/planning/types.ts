export type FailurePolicy = "immediate_stop";

export interface SelectorRef {
  role?: string;
  name?: string;
  exact?: boolean;
  testId?: string;
  css?: string;
  text?: string;
}

export interface EffectCue {
  zoomScale?: number;
  cursorScale?: number;
  rippleRadius?: number;
  rippleDurationMs?: number;
  holdMs?: number;
}

export interface PlannedAction {
  id: string;
  kind: "navigate" | "click" | "dblclick" | "type" | "hover" | "wait" | "assert_url";
  target?: SelectorRef;
  value?: string;
  waitMs?: number;
  cue?: EffectCue;
}

export interface CinematicScene {
  id: string;
  title: string;
  goal: string;
  actions: PlannedAction[];
}

export interface CinematicPlan {
  version: "1";
  generatedAt: string;
  prompt: string;
  codebaseSummary: string[];
  directorNotes: string[];
  failurePolicy: FailurePolicy;
  scenes: CinematicScene[];
}

export interface CompiledAction {
  id: string;
  kind: PlannedAction["kind"];
  target?: SelectorRef;
  value?: string;
  waitMs?: number;
  cue?: EffectCue;
}

export interface CompiledScene {
  id: string;
  title: string;
  goal: string;
  actions: CompiledAction[];
}

export interface CompiledDemoFlow {
  failurePolicy: FailurePolicy;
  scenes: CompiledScene[];
}
