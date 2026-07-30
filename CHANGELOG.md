# Changelog

## 0.6.0

### Added
- `--safe-aspect <ratio>` on `generate`/`slides`/`batch`: constrains the layout so all content
  survives a center-crop toward the given ratio (e.g. `--safe-aspect 4:3`), for images embedded
  in mismatched `object-fit: cover` containers. Opt-in; no effect when absent.

## 0.5.0

### Added
- Five non-social size presets: `og` (1200×630), `readme-hero` (1280×640),
  `slide-16x9` (1920×1080), `4x3` (1600×1200), `3x2` (1500×1000).
- `align` (`top` | `center` | `bottom` | `spread`) on cards, deck defaults, and slides,
  controlling vertical placement of content.
- `--fit-content` (alias `--trim`) on `generate`/`slides`/`batch`, cropping the output to the
  content bounding box plus theme padding.

### Fixed
- Studio: `size: "custom"` cards and deck slides now render at their given dimensions in preview and export (previously blank).

### Changed
- **Rendering change:** content is now vertically centered by default instead of distributed
  over the full canvas height. Existing cards re-render with content grouped. Add
  `"align": "spread"` to approximate the previous look.

## 0.4.0

### Fixed
- `--version` reported a hardcoded `0.1.0` regardless of the installed version.
- `size: "custom"` produced a blank image at the browser's default viewport. Custom
  dimensions are now applied to both the viewport and the type-scale calculation.

### Changed
- **Breaking:** unknown keys are now rejected by every content and theme schema.
  Files that previously validated with stray keys will now fail, naming the key.
  `meta` and `$schema` remain the supported extension points.
- **Breaking:** `size: "custom"` now requires `width` and `height`. Supplying them
  alongside a preset size is rejected rather than silently ignored.

### Documentation
- Documented the custom-theme workflow (duplicate, edit, render) and custom dimensions.
