import type { ContentMode, SizeName, Align } from "../../types";
import { ThemePicker } from "./ThemePicker";
import { SizePicker } from "./SizePicker";
import { AlignPicker } from "./AlignPicker";
import { Button } from "../ui/Button";
import { Download, FolderArchive, Undo2, Redo2 } from "lucide-react";

interface ToolbarProps {
  mode: ContentMode;
  theme: string;
  size: SizeName;
  align: Align | undefined;
  fitContent: boolean;
  onThemeChange: (name: string) => void;
  onSizeChange: (size: SizeName) => void;
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
  mode, theme, size, align, fitContent,
  onThemeChange, onSizeChange, onAlignChange, onFitContentChange,
  onExportPng, onExportDeck,
  onUndo, onRedo, canUndo, canRedo,
  isDirty,
}: ToolbarProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-2 bg-neutral-900 border-b border-neutral-800">
      <span className="text-sm font-bold text-teal-400 mr-2">QuoteForge</span>
      {isDirty && <span className="w-2 h-2 rounded-full bg-yellow-400" title="Unsaved changes" />}

      <div className="flex-1" />

      <ThemePicker current={theme} onChange={onThemeChange} />
      <SizePicker current={size} onChange={onSizeChange} mode={mode} />
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
