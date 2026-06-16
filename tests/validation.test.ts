import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { test } from 'node:test';
import { inputCsv } from '../src/paths.js';
import { normalizeRows, readSourceCsv } from '../src/data.js';
import { renderHtml, renderSvg } from '../src/render.js';

test('normalizes 104 matches and required collections', async () => {
  const n = normalizeRows(await readSourceCsv(inputCsv));
  assert.equal(n.matches.length, 104);
  assert.equal(n.teams.length, 48);
  assert.ok(n.venues.length > 0);
  assert.equal(n.bracketPaths.length, 32);
});

test('render is data-driven and includes required labels', async () => {
  const n = normalizeRows(await readSourceCsv(inputCsv));
  const svg = renderSvg(n.matches, n.teams);
  const html = renderHtml(n.matches, n.teams);
  for (const token of ['World Cup 2026 Schedule - Aruba Time', 'Group A', 'Group L', 'M1', 'M73', 'M104', 'AST']) {
    assert.ok(svg.includes(token), `SVG missing ${token}`);
    assert.ok(html.includes(token), `HTML missing ${token}`);
  }
});

test('render script no longer contains blank placeholder exporters', async () => {
  const script = String(await fs.readFile('scripts/render-all.ts', 'utf8'));
  assert.ok(!script.includes('function makePng'), 'blank makePng placeholder exporter must not return');
  assert.ok(!script.includes('function makePdf'), 'title-only makePdf placeholder exporter must not return');
  assert.match(script, /rasterizeStaticPoster/);
  assert.match(script, /runVisualQa/);
  assert.match(script, /wk2026_aruba_master_overview/);
});
