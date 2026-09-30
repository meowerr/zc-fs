# Archive: Original Theme (Y2K Chrome & Midnight)

This directory contains a standalone archive of the original application theme and component styling before the **Clean Cyber Racing** redesign.

## Git Branches & Tags
The full codebase state of the old theme is permanently preserved in Git:
- **Git Branch:** `backup/old-theme` (pushed to remote `origin`)
- **Git Tag:** `backup-old-theme` (pointing to commit `e712722`)

To view or checkout the complete repository at the exact state of the old theme:
```bash
git checkout backup/old-theme
# or
git checkout backup-old-theme
```

## Preserved Files in this Directory
- `tailwind.config.js`: Original Tailwind theme tokens (`chrome-50..900`, `midnight-800..950`, `telemetry-*`).
- `index.css`: Original CSS variables (`--color-chrome-*`, `--color-midnight-*`, `--gradient-holo`, etc.).
- `GlossyButton.tsx`: Original button with rainbow holo gradient and Y2K gloss.
- `GlowInput.tsx`: Original input component.
- `GlassCard.tsx`: Original frosted glass card component.
- `GhostButton.tsx`: Original ghost button component.
- `LedStatusChip.tsx`: Original LED status indicator chips.
