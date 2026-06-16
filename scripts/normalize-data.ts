import fs from 'node:fs/promises';
import path from 'node:path';
import { dataDir, inputCsv } from '../src/paths.js';
import { normalizeRows, readSourceCsv } from '../src/data.js';

const rows = await readSourceCsv(inputCsv);
const normalized = normalizeRows(rows);
await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(path.join(dataDir, 'matches.json'), JSON.stringify(normalized.matches, null, 2) + '\n');
await fs.writeFile(path.join(dataDir, 'teams.json'), JSON.stringify(normalized.teams, null, 2) + '\n');
await fs.writeFile(path.join(dataDir, 'venues.json'), JSON.stringify(normalized.venues, null, 2) + '\n');
await fs.writeFile(path.join(dataDir, 'bracket_paths.json'), JSON.stringify(normalized.bracketPaths, null, 2) + '\n');
const header = Object.keys(rows[0]).join(',');
await fs.writeFile(path.join(dataDir, 'matches.csv'), [header, ...rows.map(r => Object.values(r).map(csv).join(','))].join('\n') + '\n');
await fs.writeFile(path.join(dataDir, 'source_log.json'), JSON.stringify({ generatedAt:new Date().toISOString(), source: path.relative(process.cwd(), inputCsv), sourceRows: rows.length, sourceVersions:[...new Set(rows.map(r=>r.source_version))] }, null, 2) + '\n');
console.log(`Normalized ${normalized.matches.length} matches into data/.`);
function csv(v: unknown) { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replaceAll('"','""')}"` : s; }
