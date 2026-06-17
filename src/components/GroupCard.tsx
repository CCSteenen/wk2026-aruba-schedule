import { getGroupMatches, getGroupTeams } from '../data/selectors';
import type { Match } from '../data/types';
import { MatchCard } from './MatchCard';
import { TeamBadge } from './TeamBadge';

interface Props {
  group: string;
  onOpenMatch: (match: Match) => void;
}

export function GroupCard({ group, onOpenMatch }: Props) {
  const teams = getGroupTeams(group);
  const matches = getGroupMatches(group);

  return (
    <section className={`groupCard group${group}`}>
      <div className="groupHeader">
        <h3>Group {group}</h3>
        <span>1{group} · 2{group} · 3{group}*</span>
      </div>
      <div className="teamRows">
        {teams.map((team) => <TeamBadge key={team.code} code={team.code} name={team.name} />)}
      </div>
      <div className="matchRows">
        {matches.map((match) => <MatchCard key={match.match_no} match={match} compact onOpen={onOpenMatch} />)}
      </div>
    </section>
  );
}
