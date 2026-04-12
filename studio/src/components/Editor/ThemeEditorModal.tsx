import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ColorPicker } from "../ui/ColorPicker";
import { useToast } from "../ui/Toast";
import type { Theme, ThemeColors } from "../../types";

interface ThemeEditorModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}

const DEFAULT_COLORS: ThemeColors = {
  background: "#1a1a1a",
  headline: "#ffffff",
  accent: "#00ff88",
  body: "#cccccc",
  label: "#00ff88",
  "blockquote-border": "#00ff88",
  "blockquote-text": "#dddddd",
  "callout-bg": "#252525",
  "callout-border": "#333333",
  "bullet-dot": "#00ff88",
  "slide-counter-bg": "#00000066",
  "slide-counter-text": "#ffffff",
};

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  background: "Background",
  headline: "Headline",
  accent: "Accent",
  body: "Body text",
  label: "Label",
  "blockquote-border": "Quote border",
  "blockquote-text": "Quote text",
  "callout-bg": "Callout bg",
  "callout-border": "Callout border",
  "bullet-dot": "Bullet dot",
  "slide-counter-bg": "Counter bg",
  "slide-counter-text": "Counter text",
};

export function ThemeEditorModal({ open, onClose, onCreated }: ThemeEditorModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [colors, setColors] = useState<ThemeColors>({ ...DEFAULT_COLORS });
  const [headlineFont, setHeadlineFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [saving, setSaving] = useState(false);

  function updateColor(key: keyof ThemeColors, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast("Theme name is required", "error");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      toast("Use kebab-case for theme name", "error");
      return;
    }

    const theme: Theme = {
      name,
      displayName: displayName || name.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" "),
      colors,
      typography: {
        "font-headline": headlineFont,
        "font-headline-url": `https://fonts.googleapis.com/css2?family=${headlineFont.replace(/\s/g, "+")}:wght@700`,
        "font-body": bodyFont,
        "font-body-url": `https://fonts.googleapis.com/css2?family=${bodyFont.replace(/\s/g, "+")}:wght@400;700`,
        "headline-size": "clamp(3rem, 7vw, 5rem)",
        "body-size": "1rem",
        "line-height": "1.5",
      },
      spacing: {
        padding: "64px",
        "block-gap": "2rem",
      },
    };

    setSaving(true);
    try {
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      if (res.status === 409) {
        toast("Theme already exists", "error");
        return;
      }
      if (!res.ok) throw new Error();
      toast(`Theme "${name}" created`, "success");
      onCreated(name);
      onClose();
    } catch {
      toast("Failed to save theme", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Theme">
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Name (kebab-case)" value={name} onChange={(e) => setName(e.target.value)} placeholder="my-brand" />
          <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="My Brand" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Headline Font" value={headlineFont} onChange={(e) => setHeadlineFont(e.target.value)} placeholder="Inter" />
          <Input label="Body Font" value={bodyFont} onChange={(e) => setBodyFont(e.target.value)} placeholder="Inter" />
        </div>

        <div>
          <span className="text-xs text-neutral-400 mb-2 block">Colors</span>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(COLOR_LABELS) as (keyof ThemeColors)[]).map((key) => (
              <ColorPicker
                key={key}
                label={COLOR_LABELS[key]}
                value={colors[key]}
                onChange={(v) => updateColor(key, v)}
              />
            ))}
          </div>
        </div>

        <div
          className="rounded-lg p-4 flex items-center gap-3"
          style={{ backgroundColor: colors.background }}
        >
          <span style={{ color: colors.headline, fontWeight: 700, fontSize: 18 }}>Aa</span>
          <span style={{ color: colors.accent, fontWeight: 700, fontSize: 14 }}>Accent</span>
          <span style={{ color: colors.body, fontSize: 13 }}>Body text</span>
          <span style={{ backgroundColor: colors["callout-bg"], border: `1px solid ${colors["callout-border"]}`, borderRadius: 4, padding: "2px 8px", color: colors.label, fontSize: 11 }}>Callout</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Create Theme"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
