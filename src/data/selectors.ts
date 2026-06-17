import matchesRaw from '../../data/matches.json';
import teamsRaw from '../../data/teams.json';
import bracketPathsRaw from '../../data/bracket_paths.json';
import type { Match, Team, BracketPath } from './types';

export const matches = matchesRaw as Match[];
export const teams = teamsRaw as Team[];
export const bracketPaths = bracketPathsRaw as BracketPath[];

export const groupLetters = 'ABCDEFGHIJKL'.split('');

export const knockoutStages = [
  'Round of 32',
  'Round of 16',
  'Quarter-final',
  'Semi-final',
  'Bronze Final',
  'Final',
];

export function getGroupMatches(group: string): Match[] {
  return matches
    .filter((match) => match.stage === 'Group Stage' && match.group === group)
    .sort((a, b) => a.match_no - b.match_no);
}

export function getGroupTeams(group: string): Team[] {
  const byCode = new Map<string, Team>();
  for (const match of getGroupMatches(group)) {
    if (match.team_1_code) byCode.set(match.team_1_code, { code: match.team_1_code, name: match.team_1_name, shortName: match.team_1_name });
    if (match.team_2_code) byCode.set(match.team_2_code, { code: match.team_2_code, name: match.team_2_name, shortName: match.team_2_name });
  }
  return [...byCode.values()];
}

export function getKnockoutMatches(stage?: string): Match[] {
  return matches
    .filter((match) => match.stage !== 'Group Stage' && (!stage || match.stage === stage))
    .sort((a, b) => a.match_no - b.match_no);
}

export function getMatchLabel(match: Match): string {
  const left = match.team_1_code || match.slot_1;
  const right = match.team_2_code || match.slot_2;
  if (match.status === 'completed' && match.score) return `${left} ${match.score} ${right}`;
  return `${left} v ${right}`;
}

export function getMatchByNumber(matchNo: number): Match | undefined {
  return matches.find((match) => match.match_no === matchNo);
}

export function searchMatches(query: string, stage = 'All', group = 'All'): Match[] {
  const normalized = query.trim().toLowerCase();
  return matches.filter((match) => {
    if (stage !== 'All' && match.stage !== stage) return false;
    if (group !== 'All' && match.group !== group) return false;
    if (!normalized) return true;
    const haystack = [
      `M${match.match_no}`,
      String(match.match_no),
      match.stage,
      match.group,
      match.team_1_code,
      match.team_1_name,
      match.team_2_code,
      match.team_2_name,
      match.slot_1,
      match.slot_2,
      match.date_ast,
      match.kickoff_ast,
      match.venue,
      match.city,
      match.status,
      match.score,
    ].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
}

export function venueShort(match: Match): string {
  return match.venue.replace(' Stadium', '').replace('New York New Jersey Stadium', 'NY/NJ');
}
