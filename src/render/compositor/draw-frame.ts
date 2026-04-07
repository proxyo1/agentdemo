import { createCanvas, loadImage, type Image } from "@napi-rs/canvas";
import type { ActiveRippleDraw } from "../cursor/interpolate.js";
import type { AppliedTransform } from "../zoom/transform.js";

const MAX_MOTION_BLUR_PX = 12;

export async function drawCompositedFrame(params: {
  framePath: string;
  width: number;
  height: number;
  transform: AppliedTransform;
  cursor: { x: number; y: number; scale: number } | null;
  ripples: ActiveRippleDraw[];
  motionBlurAmount: number;
}): Promise<Buffer> {
  const img: Image = await loadImage(params.framePath);
  const canvas = createCanvas(params.width, params.height);
  const ctx = canvas.getContext("2d");

  const blurPx = Math.min(MAX_MOTION_BLUR_PX, Math.max(0, params.motionBlurAmount) * MAX_MOTION_BLUR_PX);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, params.width, params.height);
  ctx.clip();

  if (blurPx > 0.25) {
    ctx.filter = `blur(${blurPx}px)`;
  }

  const { transform } = params;
  ctx.setTransform(transform.scale, 0, 0, transform.scale, transform.x, transform.y);
  ctx.drawImage(img, 0, 0, params.width, params.height);
  ctx.filter = "none";
  ctx.restore();

  for (const r of params.ripples) {
    const radius = r.progress * r.maxRadius;
    const alpha = (1 - r.progress) * 0.55;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, Math.max(1, radius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r.x, r.y, Math.max(1, radius) + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (params.cursor) {
    const { x, y, scale } = params.cursor;
    const r = 9 * scale;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  return canvas.encodeSync("png");
}
