# WK 2026 Aruba Schedule Web App Starter

This is a fresh starting point for a Codex-built web application for the World Cup 2026 schedule in Aruba time.

The package starts from the successful approved visual direction: a dark sports-broadcast overview with group cards, a knockout bracket, AST / UTC-4 labeling, match numbers, and a footer legend.

## What this repo does now

- Runs a Vite + React + TypeScript web app.
- Loads all 104 matches from structured JSON data.
- Shows a master overview with Groups A-L and the knockout bracket.
- Provides group, knockout, match-list, and export-center views.
- Includes search and filters.
- Includes a match detail modal.
- Includes a validated data model.
- Includes the approved SVG visual reference.
- Includes the successful Python renderer as a reference implementation.

## One-command local start

```bash
npm install && npm run dev
```

Then open the local URL shown by Vite.

## Codex workflow

Use Codex Cloud to work phase by phase. Start with:

```text
Read README.md, AGENTS.md, docs/codex/PHASE_1_PROMPT.md, and reference/approved_reference.svg.
Then execute only Phase 1.
```

## Core rule

The approved visual quality is the baseline. Technical scaffolding is only useful when it preserves the schedule design.
