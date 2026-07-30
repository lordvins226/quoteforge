import type { Dimensions } from "./dimensions.js";

export interface SafeInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function parseAspectRatio(input: string): number {
  const trimmed = input.trim();
  const pair = trimmed.match(/^(\d*\.?\d+)\s*[:x]\s*(\d*\.?\d+)$/i);
  if (pair) {
    const tw = Number(pair[1]);
    const th = Number(pair[2]);
    if (tw > 0 && th > 0) return tw / th;
    throw new Error(`Invalid aspect ratio "${input}": both parts must be positive`);
  }
  const decimal = Number(trimmed);
  if (Number.isFinite(decimal) && decimal > 0) return decimal;
  throw new Error(`Invalid aspect ratio "${input}": use W:H (e.g. 4:3), WxH, or a positive decimal`);
}

export function computeSafeInset(dimensions: Dimensions, ratio: number): SafeInset {
  const canvasRatio = dimensions.w / dimensions.h;
  const zero: SafeInset = { top: 0, right: 0, bottom: 0, left: 0 };

  if (ratio > canvasRatio) {
    const safeHeight = dimensions.w / ratio;
    const inset = (dimensions.h - safeHeight) / 2;
    return { ...zero, top: inset, bottom: inset };
  }
  if (ratio < canvasRatio) {
    const safeWidth = dimensions.h * ratio;
    const inset = (dimensions.w - safeWidth) / 2;
    return { ...zero, left: inset, right: inset };
  }
  return zero;
}
