import fs from 'node:fs';

const matches = JSON.parse(fs.readFileSync('data/matches.json', 'utf8'));

function fail(message) {
  console.error(`DATA VALIDATION FAILED: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

assert(matches.length === 104, `Expected 104 matches, got ${matches.length}`);

const byNo = new Map(matches.map((match) => [Number(match.match_no), match]));
for (let i = 1; i <= 104; i += 1) assert(byNo.has(i), `Missing M${i}`);

for (const match of matches) {
  assert(match.kickoff_ast && /^\d{2}:\d{2}$/.test(match.kickoff_ast), `Invalid kickoff for M${match.match_no}`);
  assert(match.date_ast, `Missing date for M${match.match_no}`);
  assert(match.venue, `Missing venue for M${match.match_no}`);
  assert(match.city, `Missing city for M${match.match_no}`);
  if (match.status === 'completed') assert(match.score, `Completed match M${match.match_no} has no score`);
  if (match.status !== 'completed') assert(!match.score, `Upcoming match M${match.match_no} has a score`);
  if (match.match_no <= 72) assert(match.stage === 'Group Stage', `M${match.match_no} should be Group Stage`);
  if (match.match_no >= 73 && match.match_no <= 88) assert(match.stage === 'Round of 32', `M${match.match_no} should be Round of 32`);
  if (match.match_no >= 89 && match.match_no <= 96) assert(match.stage === 'Round of 16', `M${match.match_no} should be Round of 16`);
  if (match.match_no >= 97 && match.match_no <= 100) assert(match.stage === 'Quarter-final', `M${match.match_no} should be Quarter-final`);
  if (match.match_no >= 101 && match.match_no <= 102) assert(match.stage === 'Semi-final', `M${match.match_no} should be Semi-final`);
  if (match.match_no === 103) assert(match.stage === 'Bronze Final', 'M103 should be Bronze Final');
  if (match.match_no === 104) assert(match.stage === 'Final', 'M104 should be Final');
}

console.log('Data validation passed: 104 matches, AST kickoff format, stage ranges, score rules.');
