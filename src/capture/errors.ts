export class SceneExecutionError extends Error {
  constructor(
    readonly sceneId: string,
    readonly actionId: string,
    cause: unknown
  ) {
    super(
      `Scene "${sceneId}" action "${actionId}" failed: ${cause instanceof Error ? cause.message : String(cause)}`
    );
    this.name = "SceneExecutionError";
  }
}
