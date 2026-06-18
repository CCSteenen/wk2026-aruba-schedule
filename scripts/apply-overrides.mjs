import fs from 'node:fs/promises';

const matchesPath = 'data/matches.json';
const overridesPath = 'data/results_override.csv';
const updateLogPath = 'data/update_log.json';
const requiredHeader = ['match_no', 'status', 'score', 'team_1_code', 'team_2_code', 'source_name', 'source_url', 'checked_at', 'notes'];

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (quoted) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

function fail(message) {
  throw new Error(`apply-overrides failed: ${message}`);
}

const [matchesText, overridesText, logText] = await Promise.all([
  fs.readFile(matchesPath, 'utf8'),
  fs.readFile(overridesPath, 'utf8'),
  fs.readFile(updateLogPath, 'utf8').catch(() => '{"version":1,"runs":[]}')
]);
const matches = JSON.parse(matchesText);
const rows = parseCsv(overridesText);
if (!rows.length) fail('results_override.csv is missing a header row');
const header = rows[0].map((v) => v.trim());
const missingHeaders = requiredHeader.filter((name) => !header.includes(name));
if (missingHeaders.length) fail(`results_override.csv missing columns: ${missingHeaders.join(', ')}`);
const records = rows.slice(1).map((row, index) => Object.fromEntries(header.map((name, i) => [name, (row[i] ?? '').trim()]))).filter((record) => Object.values(record).some(Boolean));

if (!records.length) {
  console.log('No override rows found; data/matches.json unchanged.');
  process.exit(0);
}

const matchesByNo = new Map(matches.map((match) => [String(match.match_no), match]));
const applied = [];
for (const record of records) {
  const rowNumber = records.indexOf(record) + 2;
  if (!record.match_no) fail(`row ${rowNumber}: match_no is missing`);
  if (!matchesByNo.has(record.match_no)) fail(`row ${rowNumber}: match_no ${record.match_no} does not exist`);
  if (record.score && record.status !== 'completed') fail(`row ${rowNumber}: score is set but status is not completed`);
  if (record.status === 'completed' && !record.score) fail(`row ${rowNumber}: completed status has no score`);
  if (!record.source_url) fail(`row ${rowNumber}: source_url is missing`);
  if (!record.checked_at) fail(`row ${rowNumber}: checked_at is missing`);
  if (!record.source_name) fail(`row ${rowNumber}: source_name is missing`);

  const match = matchesByNo.get(record.match_no);
  for (const field of ['status', 'score', 'team_1_code', 'team_2_code']) {
    if (record[field]) match[field] = record[field];
  }
  match.source_version = `${record.source_name}, checked ${record.checked_at}`;
  applied.push({ match_no: Number(record.match_no), status: record.status || match.status, source_name: record.source_name, source_url: record.source_url, checked_at: record.checked_at, notes: record.notes || '' });
}

await fs.writeFile(matchesPath, `${JSON.stringify(matches, null, 2)}\n`);
const log = JSON.parse(logText);
if (!Array.isArray(log.runs)) log.runs = [];
log.runs.push({ ran_at: new Date().toISOString(), overrides_file: overridesPath, matches_file: matchesPath, applied_count: applied.length, applied });
await fs.writeFile(updateLogPath, `${JSON.stringify(log, null, 2)}\n`);
console.log(`Applied ${applied.length} override row(s) to data/matches.json.`);
