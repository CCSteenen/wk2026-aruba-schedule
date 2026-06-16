import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inputCsv } from '../src/paths.js';
import { normalizeRows, readSourceCsv } from '../src/data.js';
import { renderSvg } from '../src/render.js';

test('normalizes 104 matches and required collections', async () => {
  const n = normalizeRows(await readSourceCsv(inputCsv));
  assert.equal(n.matches.length, 104);
  assert.equal(n.teams.length, 48);
  assert.ok(n.venues.length > 0);
  assert.equal(n.bracketPaths.length, 32);
});

test('render is data-driven and includes required labels', async () => {
  const n = normalizeRows(await readSourceCsv(inputCsv));
  const svg = renderSvg(n.matches);
  assert.match(svg, /World Cup 2026 Schedule - Aruba Time/);
  assert.match(svg, /Group A/);
  assert.match(svg, /Group L/);
  assert.match(svg, /M73/);
  assert.match(svg, /M104/);
  assert.match(svg, /AST = Atlantic Standard Time/);
});
