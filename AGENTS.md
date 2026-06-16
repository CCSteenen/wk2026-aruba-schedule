# Repository Instructions

This project generates World Cup 2026 Aruba-time schedule assets from structured data.

- Use TypeScript for source, scripts, and tests.
- Do not manually draw final schedule data in SVG; generate SVG/PNG/PDF outputs from `data/*.json`.
- Display match times in Atlantic Standard Time as 24-hour time ending in `AST`.
- Keep official FIFA marks/logos out of generated assets.
- Future agents should extend the data model and renderer rather than editing generated output files by hand.
