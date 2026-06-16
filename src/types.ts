export type MatchStatus = 'scheduled' | 'completed' | 'placeholder';
export interface Match { matchNo:number; stage:string; group:string|null; dateAst:string; kickoffAst:string; displayTime:string; team1Code:string|null; team1Name:string|null; team2Code:string|null; team2Name:string|null; venue:string; city:string; slot1:string|null; slot2:string|null; status:MatchStatus; score:string|null; sourceVersion:string; }
export interface Team { code:string; name:string; group:string; }
export interface Venue { name:string; city:string; matchNos:number[]; }
export interface BracketPath { matchNo:number; stage:string; slot1:string; slot2:string; feedsTo:number|null; loserFeedsTo:number|null; }
