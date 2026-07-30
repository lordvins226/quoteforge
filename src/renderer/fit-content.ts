import type { Dimensions } from "./dimensions.js";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeContentClip(box: Rect, padding: number, canvas: Dimensions): Rect {
  const left = Math.max(0, box.x - padding);
  const top = Math.max(0, box.y - padding);
  const right = Math.min(canvas.w, box.x + box.width + padding);
  const bottom = Math.min(canvas.h, box.y + box.height + padding);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
