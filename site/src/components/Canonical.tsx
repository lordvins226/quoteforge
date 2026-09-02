import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_ORIGIN = "https://quoteforge.kevwilfried.dev";

export function Canonical() {
  const { pathname } = useLocation();
  useEffect(() => {
    const href = SITE_ORIGIN + (pathname === "/" ? "/" : pathname.replace(/\/+$/, ""));
    document.querySelector("link[rel='canonical']")?.setAttribute("href", href);
    document.querySelector("meta[property='og:url']")?.setAttribute("content", href);
  }, [pathname]);
  return null;
}
