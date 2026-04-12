import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import {
  install,
  computeExecutablePath,
  Browser,
  resolveBuildId,
  detectBrowserPlatform,
} from "@puppeteer/browsers";

export interface ResolvedChrome {
  executablePath: string;
  source: "env" | "system" | "cache";
}

function browserCacheDir(): string {
  const xdg = process.env.XDG_CACHE_HOME;
  const base = xdg && xdg.length > 0 ? xdg : join(homedir(), ".cache");
  return join(base, "quoteforge", "chrome");
}

function probeSystemChrome(): string | null {
  const os = platform();

  const candidates: string[] = [];

  if (os === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    );
  } else if (os === "linux") {
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium",
      "/usr/bin/microsoft-edge",
    );
  } else if (os === "win32") {
    const pf = process.env["PROGRAMFILES"] ?? "C\\:\\Program Files";
    const pfx86 = process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)";
    const localApp = process.env["LOCALAPPDATA"] ?? join(homedir(), "AppData", "Local");
    candidates.push(
      join(pf, "Google", "Chrome", "Application", "chrome.exe"),
      join(pfx86, "Google", "Chrome", "Application", "chrome.exe"),
      join(localApp, "Google", "Chrome", "Application", "chrome.exe"),
      join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
      join(pfx86, "Microsoft", "Edge", "Application", "msedge.exe"),
    );
  }

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

async function ensureCachedChrome(): Promise<string> {
  const cacheDir = browserCacheDir();
  const detectedPlatform = detectBrowserPlatform();
  if (!detectedPlatform) {
    throw new Error(
      "QuoteForge could not detect your platform for Chrome installation. " +
        "Set $QUOTEFORGE_CHROME to an existing Chrome/Chromium executable.",
    );
  }

  const buildId = await resolveBuildId(Browser.CHROME, detectedPlatform, "stable");
  const existing = computeExecutablePath({
    browser: Browser.CHROME,
    buildId,
    cacheDir,
  });
  if (existsSync(existing)) return existing;

  process.stderr.write(
    `QuoteForge: Chrome not found. Downloading Chrome for Testing (stable, ~170MB) to ${cacheDir}…\n`,
  );
  const installed = await install({
    browser: Browser.CHROME,
    buildId,
    cacheDir,
  });
  return installed.executablePath;
}

export async function resolveChrome(): Promise<ResolvedChrome> {
  const envPath = process.env["QUOTEFORGE_CHROME"];
  if (envPath && existsSync(envPath)) {
    return { executablePath: envPath, source: "env" };
  }

  const system = probeSystemChrome();
  if (system) {
    return { executablePath: system, source: "system" };
  }

  const cached = await ensureCachedChrome();
  return { executablePath: cached, source: "cache" };
}
