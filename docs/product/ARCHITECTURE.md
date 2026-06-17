# Architecture

## Stack

- Vite
- React
- TypeScript
- static JSON data
- CSS for the approved sports-broadcast design

## Data

Canonical data lives in `data/`:

- matches.json
- matches.csv
- teams.json
- venues.json
- bracket_paths.json
- source_log.json

## App

The web app reads data through `src/data/selectors.ts` and renders reusable components.

## Future export

The future export route should capture `/poster`. There should be one visual source of truth.
