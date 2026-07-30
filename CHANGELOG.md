# Changelog

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
