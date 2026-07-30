import { SIZES } from "../cli/utils/validator.js";
import type { SizeName } from "../cli/utils/validator.js";

export interface Dimensions {
  w: number;
  h: number;
}

export interface SizedContent {
  size: SizeName;
  width?: number;
  height?: number;
}

export function resolveDimensions(input: SizedContent): Dimensions {
  if (input.size === "custom") {
    if (input.width === undefined || input.height === undefined) {
      throw new Error('size "custom" requires both "width" and "height"');
    }
    return { w: input.width, h: input.height };
  }

  const preset = SIZES[input.size as keyof typeof SIZES];
  return { w: preset.w, h: preset.h };
}
