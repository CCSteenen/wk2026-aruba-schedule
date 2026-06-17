import type { Match } from '../data/types';
import { groupLetters } from '../data/selectors';
import { GroupCard } from './GroupCard';
import { KnockoutBracket } from './KnockoutBracket';

interface Props {
  onOpenMatch: (match: Match) => void;
}

export function MasterPoster({ onOpenMatch }: Props) {
  return (
    <main className="posterGrid" id="poster">
      <section>
        <div className="sectionTitle">
          <h2>Group Stage</h2>
          <span>12 pools</span>
        </div>
        <div className="groupGrid">
          {groupLetters.map((group) => <GroupCard key={group} group={group} onOpenMatch={onOpenMatch} />)}
        </div>
      </section>
      <section>
        <div className="sectionTitle accent">
          <h2>Knockout Stage</h2>
          <span>Match number spine</span>
        </div>
        <KnockoutBracket onOpenMatch={onOpenMatch} />
      </section>
    </main>
  );
}
