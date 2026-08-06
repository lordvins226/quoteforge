export interface OverflowBox {
  scrollW: number;
  scrollH: number;
  clientW: number;
  clientH: number;
}

export function contentOverflows(box: OverflowBox): boolean {
  return box.scrollW > box.clientW || box.scrollH > box.clientH;
}
