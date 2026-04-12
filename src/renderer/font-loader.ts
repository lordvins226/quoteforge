import type { Theme } from "../cli/utils/validator.js";

export function buildFontImports(theme: Theme): string {
  const urls: string[] = [];

  if (theme.typography["font-headline-url"]) {
    urls.push(theme.typography["font-headline-url"]);
  }
  if (theme.typography["font-body-url"]) {
    urls.push(theme.typography["font-body-url"]);
  }

  return urls.map((url) => `<link rel="stylesheet" href="${url}">`).join("\n");
}
