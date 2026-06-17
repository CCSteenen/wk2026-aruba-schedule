import type { Match } from '../data/types';
import { getKnockoutMatches, knockoutStages } from '../data/selectors';
import { MatchCard } from './MatchCard';

interface Props {
  onOpenMatch: (match: Match) => void;
}

export function KnockoutBracket({ onOpenMatch }: Props) {
  return (
    <section className="bracket">
      {knockoutStages.map((stage) => {
        const stageMatches = getKnockoutMatches(stage);
        return (
          <div className="bracketRound" key={stage}>
            <h3>{stage}</h3>
            <div className="roundCards">
              {stageMatches.map((match) => (
                <MatchCard key={match.match_no} match={match} compact onOpen={onOpenMatch} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
