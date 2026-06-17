# WK 2026 Aruba Schedule Web App

Fresh zero-dependency starter for a Codex-built World Cup 2026 schedule web app in Aruba time.

## Why zero dependency

Codex returned 403 errors when trying to install React, Vite, and type packages. This starter avoids npm registry dependency problems completely. It uses plain browser JavaScript, CSS, JSON data, and Node built-ins for validation/build scripts.

## One-command check

```bash
npm run codex:check
```

## Local preview

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

## What is included

- all 104 matches in `data/matches.json`
- group stage view
- knockout view
- all-matches search/filter view
- match detail modal
- poster view
- export-center placeholder
- approved visual reference in `reference/`
- successful Python renderer as reference implementation

## Codex next step

Paste this into Codex:

```text
Read README.md, AGENTS.md, docs/codex/PHASE_1_PROMPT.md, and reference/approved_reference.svg.

Execute only Phase 1.

Run:
npm run codex:check

Fix only concrete validation or build errors.
Stop after Phase 1 and report the result.
```
