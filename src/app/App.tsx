import { useMemo, useState } from 'react';
import { ExportCenter } from '../components/ExportCenter';
import { FilterBar } from '../components/FilterBar';
import { GroupCard } from '../components/GroupCard';
import { KnockoutBracket } from '../components/KnockoutBracket';
import { MasterPoster } from '../components/MasterPoster';
import { MatchCard } from '../components/MatchCard';
import { MatchDetailModal } from '../components/MatchDetailModal';
import { TopBar } from '../components/TopBar';
import { groupLetters, searchMatches } from '../data/selectors';
import type { Match } from '../data/types';

type View = 'overview' | 'groups' | 'knockout' | 'matches' | 'poster' | 'export';

export function App() {
  const [view, setView] = useState<View>('overview');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('All');
  const [group, setGroup] = useState('All');

  const filteredMatches = useMemo(() => searchMatches(query, stage, group), [query, stage, group]);

  return (
    <>
      <div className={view === 'poster' ? 'posterOnly app' : 'app'}>
        <TopBar />
        {view !== 'poster' && (
          <>
            <nav className="tabs">
              {(['overview', 'groups', 'knockout', 'matches', 'export'] as View[]).map((item) => (
                <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>
                  {item}
                </button>
              ))}
              <button onClick={() => setView('poster')}>poster</button>
            </nav>
            <FilterBar query={query} stage={stage} group={group} setQuery={setQuery} setStage={setStage} setGroup={setGroup} />
          </>
        )}

        {view === 'overview' && <MasterPoster onOpenMatch={setSelectedMatch} />}
        {view === 'poster' && <MasterPoster onOpenMatch={setSelectedMatch} />}
        {view === 'groups' && (
          <main className="pageGrid">
            {groupLetters.map((letter) => <GroupCard key={letter} group={letter} onOpenMatch={setSelectedMatch} />)}
          </main>
        )}
        {view === 'knockout' && <main className="pagePanel"><KnockoutBracket onOpenMatch={setSelectedMatch} /></main>}
        {view === 'matches' && (
          <main className="matchList pagePanel">
            <h2>All matches</h2>
            <p>{filteredMatches.length} matches</p>
            <div className="matchListGrid">
              {filteredMatches.map((match) => <MatchCard key={match.match_no} match={match} onOpen={setSelectedMatch} />)}
            </div>
          </main>
        )}
        {view === 'export' && <ExportCenter />}

        <footer className="legend">
          AST = Atlantic Standard Time, UTC-4 · 1A = Group A winner · 2A = runner-up · 3A* = third place if among best eight · W = winner · L = loser
        </footer>
      </div>
      <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </>
  );
}
