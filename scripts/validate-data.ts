import fs from 'node:fs/promises';
import path from 'node:path';
import { dataDir, inputCsv } from '../src/paths.js';
import { normalizeRows, readSourceCsv } from '../src/data.js';
import type { Match } from '../src/types.js';

await ensureData();
const matches: Match[] = JSON.parse(await fs.readFile(path.join(dataDir, 'matches.json'), 'utf8'));
const errors: string[] = [];
const expectRange = (from:number,to:number,stage:string) => { for (let n=from;n<=to;n++) if (matches.find(m=>m.matchNo===n)?.stage !== stage) errors.push(`M${n} must be ${stage}`); };
if (matches.length !== 104) errors.push(`Expected 104 matches, found ${matches.length}`);
expectRange(1,72,'Group Stage'); expectRange(73,88,'Round of 32'); expectRange(89,96,'Round of 16'); expectRange(97,100,'Quarter-final'); expectRange(101,102,'Semi-final'); expectRange(103,103,'Bronze Final'); expectRange(104,104,'Final');
for (const m of matches) {
  if (!/^\d{2}:\d{2} AST$/.test(m.displayTime)) errors.push(`M${m.matchNo} displayTime must end with AST in 24-hour form`);
  if (m.score && m.status !== 'completed') errors.push(`M${m.matchNo} has score but is not completed`);
  if (m.matchNo >= 73 && m.status === 'placeholder' && (m.team1Code || m.team1Name || m.team2Code || m.team2Name)) errors.push(`M${m.matchNo} knockout placeholder has confirmed team data`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Data validation passed.');
async function ensureData() { try { await fs.access(path.join(dataDir, 'matches.json')); } catch { const { normalizeRows } = await import('../src/data.js'); const rows = await readSourceCsv(inputCsv); const n = normalizeRows(rows); await fs.mkdir(dataDir,{recursive:true}); await fs.writeFile(path.join(dataDir,'matches.json'), JSON.stringify(n.matches,null,2)+'\n'); } }
