# AGENTS.md

## Prime directive

Build the WK 2026 Aruba Schedule as a polished data-driven web application. Preserve the approved dark sports-broadcast visual style from `reference/approved_reference.svg`.

## Operating model

Work in small phases. Stop after each major phase and ask for review. Provide exact commands run, files changed, and known limitations.

## Quality requirements

- all 104 matches must come from data files
- AST / UTC-4 must be visible wherever match times appear
- the master overview must show Groups A-L and knockout matches M73-M104
- no blank visual output
- no title-only export
- generated files belong in `outputs/` or `output/`
- do not commit generated PNG, PDF, zip, screenshots, `dist`, or `node_modules`

## Required checks

Run these before reporting success:

```bash
npm run validate:data
npm run build
```

If a phase touches data selectors or validation, also run:

```bash
npm run test
```

## PR or task summary format

```text
Summary
- ...

Testing
- ...

Visual review
- ...

Next recommended phase
- ...
```
