export type Stage =
  | 'Group Stage'
  | 'Round of 32'
  | 'Round of 16'
  | 'Quarter-final'
  | 'Semi-final'
  | 'Bronze Final'
  | 'Final';

export type MatchStatus = 'completed' | 'scheduled' | 'upcoming' | string;

export interface Match {
  match_no: number;
  stage: Stage | string;
  group: string;
  date_ast: string;
  kickoff_ast: string;
  team_1_code: string;
  team_1_name: string;
  team_2_code: string;
  team_2_name: string;
  venue: string;
  city: string;
  slot_1: string;
  slot_2: string;
  status: MatchStatus;
  score: string;
  source_version: string;
}

export interface Team {
  code: string;
  name: string;
  shortName: string;
}

export interface BracketPath {
  from_match: number;
  winner_feeds_to?: number;
  loser_feeds_to?: number;
}
