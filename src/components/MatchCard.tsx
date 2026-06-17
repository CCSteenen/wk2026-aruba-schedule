import type { Match } from '../data/types';
import { getMatchLabel, venueShort } from '../data/selectors';

interface Props {
  match: Match;
  compact?: boolean;
  onOpen?: (match: Match) => void;
}

export function MatchCard({ match, compact, onOpen }: Props) {
  return (
    <button className={compact ? 'matchCard compact' : 'matchCard'} onClick={() => onOpen?.(match)}>
      <span className="matchNo">M{String(match.match_no).padStart(2, '0')}</span>
      <span className="matchWhen">{match.date_ast} · {match.kickoff_ast} AST</span>
      <strong>{getMatchLabel(match)}</strong>
      <span className="venue">{venueShort(match)}</span>
    </button>
  );
}
