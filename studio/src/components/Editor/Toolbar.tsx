import type { ContentMode, SizeName, Align } from "../../types";
import { TemplatePicker } from "./TemplatePicker";
import { ThemePicker } from "./ThemePicker";
import { SizePicker } from "./SizePicker";
import { AlignPicker } from "./AlignPicker";
import { Button } from "../ui/Button";
import { Download, FolderArchive, Undo2, Redo2 } from "lucide-react";

interface ToolbarProps {
  mode: ContentMode;
  template: string;
  theme: string;
  size: SizeName;
  width?: number;
  height?: number;
  align: Align | undefined;
  fitContent: boolean;
  onTemplateChange: (name: string) => void;
  onThemeChange: (name: string) => void;
  onSizeChange: (size: SizeName) => void;
  onDimensionsChange: (width: number, height: number) => void;
  onAlignChange: (align: Align) => void;
  onFitContentChange: (fitContent: boolean) => void;
  onExportPng: () => void;
  onExportDeck?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
}

export function Toolbar({
  mode, template, theme, size, width, height, align, fitContent,
  onTemplateChange, onThemeChange, onSizeChange, onDimensionsChange, onAlignChange, onFitContentChange,
  onExportPng, onExportDeck,
  onUndo, onRedo, canUndo, canRedo,
  isDirty,
}: ToolbarProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-2 bg-neutral-900 border-b border-neutral-800">
      <span className="text-sm font-bold text-teal-400 mr-2">QuoteForge</span>
      {isDirty && <span className="w-2 h-2 rounded-full bg-yellow-400" title="Unsaved changes" />}

      <div className="flex-1" />

      <TemplatePicker current={template} onChange={onTemplateChange} />
      <ThemePicker current={theme} onChange={onThemeChange} />
      <SizePicker current={size} onChange={onSizeChange} mode={mode} />
      {size === "custom" && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="w-16 px-1.5 py-1 text-xs bg-neutral-800 border border-neutral-700 rounded text-neutral-200"
            value={width ?? ""}
            onChange={(e) => {
              const w = Number(e.target.value);
              if (e.target.value !== "" && Number.isFinite(w) && w > 0) onDimensionsChange(w, height ?? 0);
            }}
            title="Width"
          />
          <span className="text-neutral-600 text-xs">×</span>
          <input
            type="number"
            className="w-16 px-1.5 py-1 text-xs bg-neutral-800 border border-neutral-700 rounded text-neutral-200"
            value={height ?? ""}
            onChange={(e) => {
              const h = Number(e.target.value);
              if (e.target.value !== "" && Number.isFinite(h) && h > 0) onDimensionsChange(width ?? 0, h);
            }}
            title="Height"
          />
        </div>
      )}
      <AlignPicker current={align} onChange={onAlignChange} />

      <div className="w-px h-5 bg-neutral-700" />

      <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo2 size={14} />
      </Button>
      <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        <Redo2 size={14} />
      </Button>

      <div className="w-px h-5 bg-neutral-700" />

      <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer select-none">
        <input type="checkbox" checked={fitContent} onChange={(e) => onFitContentChange(e.target.checked)} />
        Fit content
      </label>

      <Button variant="primary" size="sm" onClick={onExportPng}>
        <Download size={14} className="mr-1" /> PNG
      </Button>
      {mode === "deck" && onExportDeck && (
        <Button variant="primary" size="sm" onClick={onExportDeck}>
          <FolderArchive size={14} className="mr-1" /> ZIP
        </Button>
      )}
    </header>
  );
}
