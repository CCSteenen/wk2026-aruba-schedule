import { groupLetters, knockoutStages } from '../data/selectors';

interface Props {
  query: string;
  stage: string;
  group: string;
  setQuery: (value: string) => void;
  setStage: (value: string) => void;
  setGroup: (value: string) => void;
}

export function FilterBar({ query, stage, group, setQuery, setStage, setGroup }: Props) {
  return (
    <section className="filters">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team, venue, city, M73..." />
      <select value={stage} onChange={(event) => setStage(event.target.value)}>
        <option>All</option>
        <option>Group Stage</option>
        {knockoutStages.map((item) => <option key={item}>{item}</option>)}
      </select>
      <select value={group} onChange={(event) => setGroup(event.target.value)}>
        <option>All</option>
        {groupLetters.map((item) => <option key={item}>{item}</option>)}
      </select>
    </section>
  );
}
