import { createCanvas, loadImage, type Image, type SKRSContext2D } from "@napi-rs/canvas";
import type { ActiveRippleDraw } from "../cursor/interpolate.js";
import type { FrameStyleProfile } from "../style-profile.js";
import type { AppliedTransform } from "../zoom/transform.js";

const MAX_MOTION_BLUR_PX = 4;

/** Letterbox margin around the framed window. */
function stageMargin(videoW: number, videoH: number, style: FrameStyleProfile): number {
  const m = Math.round(Math.min(videoW, videoH) * style.marginRatio);
  return Math.min(style.marginMax, Math.max(style.marginMin, m));
}

/** Browser-style title bar (traffic lights + URL pill). */
function browserChromeHeight(videoW: number): number {
  const h = Math.round(Math.min(52, Math.max(40, videoW * 0.032)));
  return h;
}

function drawDarkBackdrop(ctx: SKRSContext2D, outW: number, outH: number): void {
  const g = ctx.createLinearGradient(0, 0, outW, outH);
  g.addColorStop(0, "#14161c");
  g.addColorStop(0.4, "#1c2029");
  g.addColorStop(1, "#252a35");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, outW, outH);

  const v = ctx.createRadialGradient(outW * 0.2, outH * 0.15, 0, outW * 0.5, outH * 0.45, outW * 0.85);
  v.addColorStop(0, "rgba(80, 120, 200, 0.12)");
  v.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, outW, outH);

  const vignette = ctx.createRadialGradient(outW * 0.5, outH * 0.48, outW * 0.2, outW * 0.5, outH * 0.5, outW * 0.9);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.26)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, outW, outH);
}

function roundRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBrowserToolbar(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  chromeH: number,
  videoW: number,
  topR: number
): void {
  ctx.save();
  ctx.fillStyle = "#e8e8ea";
  ctx.beginPath();
  ctx.moveTo(x + topR, y);
  ctx.lineTo(x + w - topR, y);
  ctx.arcTo(x + w, y, x + w, y + topR, topR);
  ctx.lineTo(x + w, y + chromeH);
  ctx.lineTo(x, y + chromeH);
  ctx.lineTo(x, y + topR);
  ctx.arcTo(x, y, x + topR, y, topR);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + chromeH - 0.5);
  ctx.lineTo(x + w, y + chromeH - 0.5);
  ctx.stroke();

  const cy = y + chromeH / 2;
  const lights = [
    { color: "#ff5f57", dx: 0 },
    { color: "#febc2e", dx: 18 },
    { color: "#28c840", dx: 36 }
  ];
  for (const L of lights) {
    ctx.beginPath();
    ctx.fillStyle = L.color;
    ctx.arc(x + 18 + L.dx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }

  const pillX = x + 92;
  const pillY = y + (chromeH - 28) / 2;
  const pillW = Math.max(120, w - 110);
  const pillH = 28;
  roundRect(ctx, pillX, pillY, pillW, pillH, 8);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const fs = Math.min(14, Math.round(videoW * 0.011));
  ctx.font = `${fs}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textBaseline = "middle";
  const textX = pillX + 14;
  const textY = pillY + pillH / 2;
  ctx.fillStyle = "#8e8e93";
  ctx.fillText("https://", textX, textY);
  const prefixW = ctx.measureText("https://").width;
  ctx.fillStyle = "#3c3c43";
  ctx.fillText("localhost", textX + prefixW, textY);
  ctx.restore();
}

function drawWindowFrame(
  ctx: SKRSContext2D,
  margin: number,
  innerW: number,
  innerH: number,
  style: FrameStyleProfile
): void {
  const x = margin;
  const y = margin;

  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${style.shadowAlpha})`;
  if (style.shadowBlur > 0) {
    ctx.shadowColor = "rgba(0,0,0,0.32)";
    ctx.shadowBlur = style.shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
  }
  roundRect(ctx, x + style.shadowOffsetX, y + style.shadowOffsetY, innerW, innerH, style.windowRadius + 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#f2f2f3";
  roundRect(ctx, x, y, innerW, innerH, style.windowRadius);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/**
 * Classic arrow pointer (hot spot at tip). Drawn in a local frame then rotated so it points up-left like macOS.
 * Avoids self-intersecting paths that looked like a lambda.
 */
function drawRasterCursor(
  ctx: SKRSContext2D,
  cursorImage: Image,
  tipX: number,
  tipY: number,
  scaleHint: number,
  hotspotX: number,
  hotspotY: number
): void {
  const iw = cursorImage.width;
  const ih = cursorImage.height;
  const targetMax = 80;
  const k = (targetMax / Math.max(iw, ih)) * Math.max(0.85, Math.min(1.15, scaleHint));
  const dw = iw * k;
  const dh = ih * k;
  const hx = hotspotX * k;
  const hy = hotspotY * k;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.drawImage(cursorImage, tipX - hx, tipY - hy, dw, dh);
  ctx.restore();
}

function drawMacCursor(ctx: SKRSContext2D, tipX: number, tipY: number, scaleHint: number): void {
  const s = 2.5 * Math.max(0.85, Math.min(1.15, scaleHint));

  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(-Math.PI / 4);
  ctx.scale(s, s);
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 22);
  ctx.lineTo(5.5, 17.5);
  ctx.lineTo(9.5, 32);
  ctx.lineTo(14, 30);
  ctx.lineTo(10, 15.5);
  ctx.lineTo(18, 14.5);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.88)";
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
}

/** Clip video to area under toolbar; bottom corners rounded to match window. */
function clipVideoArea(
  ctx: SKRSContext2D,
  margin: number,
  chromeH: number,
  videoW: number,
  videoH: number,
  r: number
): void {
  const x = margin;
  const y = margin + chromeH;
  const w = videoW;
  const h = videoH;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.clip();
}

function mapContentPoint(
  contentX: number,
  contentY: number,
  transform: AppliedTransform,
  x: number,
  y: number
): { x: number; y: number } {
  return {
    x: contentX + transform.x + x * transform.scale,
    y: contentY + transform.y + y * transform.scale
  };
}

export async function drawCompositedFrame(params: {
  framePath: string;
  width: number;
  height: number;
  transform: AppliedTransform;
  cursor: { x: number; y: number; scale: number } | null;
  ripples: ActiveRippleDraw[];
  motionBlurAmount: number;
  cursorImage?: Image | null;
  cursorHotspotX?: number;
  cursorHotspotY?: number;
  style: FrameStyleProfile;
}): Promise<Buffer> {
  const img: Image = await loadImage(params.framePath);
  const margin = stageMargin(params.width, params.height, params.style);
  const chromeH = browserChromeHeight(params.width);
  const innerW = params.width;
  const innerH = chromeH + params.height;
  const outW = innerW + margin * 2;
  const outH = innerH + margin * 2;

  const contentX = margin;
  const contentY = margin + chromeH;

  const canvas = createCanvas(outW, outH);
  const ctx = canvas.getContext("2d");

  drawDarkBackdrop(ctx, outW, outH);
  drawWindowFrame(ctx, margin, innerW, innerH, params.style);
  drawBrowserToolbar(ctx, margin, margin, innerW, chromeH, params.width, params.style.windowRadius);

  const blurPx = Math.min(MAX_MOTION_BLUR_PX, Math.max(0, params.motionBlurAmount) * MAX_MOTION_BLUR_PX);

  ctx.save();
  clipVideoArea(ctx, margin, chromeH, params.width, params.height, params.style.windowRadius);

  if (blurPx > 0.25) {
    ctx.filter = `blur(${blurPx}px)`;
  }

  const { transform } = params;
  ctx.setTransform(
    transform.scale,
    0,
    0,
    transform.scale,
    contentX + transform.x,
    contentY + transform.y
  );
  ctx.drawImage(img, 0, 0, params.width, params.height);
  ctx.filter = "none";
  ctx.restore();

  for (const r of params.ripples) {
    const radius = r.progress * r.maxRadius * transform.scale;
    const alpha = (1 - r.progress) * params.style.rippleAlpha;
    const mapped = mapContentPoint(contentX, contentY, transform, r.x, r.y);
    const rx = mapped.x;
    const ry = mapped.y;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = params.style.rippleStrokeWidth;
    ctx.beginPath();
    ctx.arc(rx, ry, Math.max(1, radius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rx, ry, Math.max(1, radius) + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (params.cursor) {
    const { x, y, scale } = params.cursor;
    const mapped = mapContentPoint(contentX, contentY, transform, x, y);
    const tipX = mapped.x;
    const tipY = mapped.y;
    if (params.cursorImage) {
      drawRasterCursor(
        ctx,
        params.cursorImage,
        tipX,
        tipY,
        scale * transform.scale,
        params.cursorHotspotX ?? 4,
        params.cursorHotspotY ?? 2
      );
    } else {
      drawMacCursor(ctx, tipX, tipY, scale * transform.scale);
    }
  }

  return canvas.encodeSync("png");
}
