import { useState, useEffect, useRef } from "react";
import type { CardContent, SizeName } from "../../types";
import { SIZES } from "../../types";

interface PreviewPaneProps {
  card: CardContent;
  theme: string;
  size: SizeName;
  slideIndex?: number;
  slideTotal?: number;
  showCounter?: boolean;
}

export function PreviewPane({ card, theme, size, slideIndex = 0, slideTotal = 1, showCounter = false }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overflows, setOverflows] = useState(false);
  const [scale, setScale] = useState(0.5);

  const sizeInfo = SIZES[size];
  const cardW = size === "custom" ? card.width || 1200 : sizeInfo?.w || 1200;
  const cardH = size === "custom" ? card.height || 675 : sizeInfo?.h || 675;

  useEffect(() => {
    function updateScale() {
      const container = containerRef.current;
      if (!container) return;
      const pad = 48;
      const availW = container.clientWidth - pad;
      const availH = container.clientHeight - pad;
      setScale(Math.min(availW / cardW, availH / cardH, 1));
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [cardW, cardH]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card, theme, size, slideIndex, slideTotal, showCounter }),
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Preview failed (${r.status})`);
        return r.text();
      })
      .then((h) => { setHtml(h); setError(null); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("Preview unavailable");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [card, theme, size, slideIndex, slideTotal, showCounter]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    setOverflows(false);
    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      const el = doc.querySelector(".card");
      if (el) {
        setOverflows(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
      }
    }
  }, [html]);

  const scaledW = Math.ceil(cardW * scale);
  const scaledH = Math.ceil(cardH * scale);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-neutral-950 p-6 overflow-hidden">
      {error ? (
        <div className="text-neutral-500 text-sm">{error}</div>
      ) : loading && !html ? (
        <div className="text-neutral-600 text-xs animate-pulse">Loading preview…</div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {overflows && (
            <div className="text-neutral-500 text-sm">
              ⚠ Content overflows the canvas — some text or blocks may be cut off.
            </div>
          )}
          <div style={{ width: scaledW, height: scaledH, position: "relative" }}>
            <iframe
              ref={iframeRef}
              className="shadow-2xl rounded"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: cardW,
                height: cardH,
                border: "none",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                pointerEvents: "none",
              }}
              title="Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
