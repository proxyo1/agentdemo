import type { CinematicPlan, CompiledAction, CompiledDemoFlow } from "./types.js";

function assertActionShape(action: CompiledAction, sceneId: string): void {
  if ((action.kind === "click" || action.kind === "dblclick" || action.kind === "hover" || action.kind === "type") && !action.target) {
    throw new Error(`Scene "${sceneId}" action "${action.id}" requires a target.`);
  }
  if (action.kind === "navigate" && !action.value) {
    throw new Error(`Scene "${sceneId}" action "${action.id}" requires a URL/path value.`);
  }
  if (action.kind === "type" && typeof action.value !== "string") {
    throw new Error(`Scene "${sceneId}" action "${action.id}" requires a text value.`);
  }
  if (action.kind === "wait" && typeof action.waitMs !== "number") {
    throw new Error(`Scene "${sceneId}" action "${action.id}" requires waitMs.`);
  }
}

export function compileCinematicPlan(plan: CinematicPlan): CompiledDemoFlow {
  const scenes = plan.scenes.map((scene) => {
    const actions: CompiledAction[] = scene.actions.map((action) => ({
      id: action.id,
      kind: action.kind,
      target: action.target,
      value: action.value,
      waitMs: action.waitMs,
      cue: action.cue
    }));
    for (const action of actions) {
      assertActionShape(action, scene.id);
    }
    return {
      id: scene.id,
      title: scene.title,
      goal: scene.goal,
      actions
    };
  });

  return {
    failurePolicy: plan.failurePolicy,
    scenes
  };
}
