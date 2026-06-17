import type { Match } from '../data/types';
import { bracketPaths, getMatchLabel } from '../data/selectors';

interface Props {
  match: Match | null;
  onClose: () => void;
}

export function MatchDetailModal({ match, onClose }: Props) {
  if (!match) return null;
  const path = bracketPaths.filter((item) => item.from_match === match.match_no);

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <article className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>×</button>
        <p className="eyebrow">{match.stage}</p>
        <h2>M{match.match_no}: {getMatchLabel(match)}</h2>
        <dl>
          <div><dt>Date</dt><dd>{match.date_ast}</dd></div>
          <div><dt>Kickoff</dt><dd>{match.kickoff_ast} AST</dd></div>
          <div><dt>Venue</dt><dd>{match.venue}, {match.city}</dd></div>
          <div><dt>Status</dt><dd>{match.status}</dd></div>
          <div><dt>Source</dt><dd>{match.source_version}</dd></div>
          {path.map((item) => (
            <div key={`${item.from_match}-${item.winner_feeds_to}-${item.loser_feeds_to}`}>
              <dt>Bracket path</dt>
              <dd>
                {item.winner_feeds_to && <>Winner feeds to M{item.winner_feeds_to}. </>}
                {item.loser_feeds_to && <>Loser feeds to M{item.loser_feeds_to}. </>}
              </dd>
            </div>
          ))}
        </dl>
      </article>
    </div>
  );
}
