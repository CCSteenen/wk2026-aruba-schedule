# WK 2026 Aruba Schedule

A TypeScript foundation for generating a data-driven World Cup 2026 schedule in Aruba time.

The generator reads `inputs/world_cup_2026_master_schedule_aruba_time_data.csv`, normalizes it into structured files in `data/`, validates schedule rules, and renders publication assets in `outputs/`.

## Aruba time

All displayed match times use Atlantic Standard Time (AST, UTC-4) in 24-hour format, for example `15:00 AST`.

## Commands

```bash
npm install
npm run validate:data
npm run test
npm run render:all
npm run build
```

## Data outputs

- `data/matches.json` and `data/matches.csv` contain normalized matches.
- `data/teams.json` contains group-stage teams.
- `data/venues.json` contains venues and hosted match numbers.
- `data/bracket_paths.json` captures knockout placeholders and winner/loser feeds.
- `data/source_log.json` records source provenance.

## Visual outputs

- `outputs/master_a0.svg` is the main editable vector render.
- `outputs/master_tv_3840x2160.png` is a TV/social raster export.
- `outputs/master_a0.pdf` is a print/review export.
- `outputs/qa_report.html` summarizes render QA.

## Future work

Future agents should improve the visual design, add richer QA checks, and update confirmed results through structured data normalization instead of manually editing generated SVG/PNG/PDF files.
