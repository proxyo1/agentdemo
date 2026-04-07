// Adapted from OpenScreen (MIT): zoomTransform.ts
export interface ZoomTransformInput {
  stageWidth: number;
  stageHeight: number;
  zoomScale: number;
  zoomProgress: number;
  focusX: number;
  focusY: number;
}

export interface AppliedTransform {
  scale: number;
  x: number;
  y: number;
}

export function computeZoomTransform(input: ZoomTransformInput): AppliedTransform {
  if (input.stageWidth <= 0 || input.stageHeight <= 0) {
    return { scale: 1, x: 0, y: 0 };
  }
  const progress = Math.max(0, Math.min(1, input.zoomProgress));
  const focusPxX = input.focusX * input.stageWidth;
  const focusPxY = input.focusY * input.stageHeight;
  const stageCenterX = input.stageWidth / 2;
  const stageCenterY = input.stageHeight / 2;
  const scale = 1 + (input.zoomScale - 1) * progress;
  const finalX = stageCenterX - focusPxX * input.zoomScale;
  const finalY = stageCenterY - focusPxY * input.zoomScale;
  return {
    scale,
    x: finalX * progress,
    y: finalY * progress
  };
}
