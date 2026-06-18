import matches from '../data/matches.json' with { type: 'json' };
import bracketPaths from '../data/bracket_paths.json' with { type: 'json' };

const groups = 'ABCDEFGHIJKL'.split('');
const navItems = ['overview', 'agenda', 'groups', 'teams', 'venues', 'knockout', 'matches', 'export', 'poster'];
const knockoutStages = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Bronze Final', 'Final'];
const stages = ['All', 'Group Stage', ...knockoutStages];
const statuses = ['All', ...[...new Set(matches.map((m) => m.status))].sort()];
const app = document.querySelector('#app');
const defaultState = { q: '', stage: 'All', group: 'All', status: 'All', selected: null, selectedTeam: '', selectedVenue: '', copyText: '', copyStatus: '' };
let state = { view: routeFromHash(), ...defaultState };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function routeFromHash() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  return navItems.includes(hash) ? hash : 'overview';
}

function setRoute(view) {
  if (!navItems.includes(view)) return;
  window.location.hash = view;
  state.view = view;
}

function matchCode(match) {
  return `M${String(match.match_no).padStart(2, '0')}`;
}

function teamSide(match, side) {
  const code = match[`team_${side}_code`] || match[`slot_${side}`];
  const name = match[`team_${side}_name`] || 'To be determined';
  return { code, name };
}

function matchSummary(match) {
  return `${matchCode(match)}: ${teamSide(match, 1).code} v ${teamSide(match, 2).code}, ${match.date_ast}, ${match.kickoff_ast} AST, ${match.venue}, ${match.city}`;
}

function matchLabel(match) {
  const left = teamSide(match, 1).code;
  const right = teamSide(match, 2).code;
  if (match.status === 'completed' && match.score) return `${left} ${match.score} ${right}`;
  return `${left} v ${right}`;
}

function venueShort(match) {
  return String(match.venue).replace(' Stadium', '').replace('New York New Jersey Stadium', 'NY/NJ').replace('San Francisco Bay Area Stadium', 'SF Bay Area');
}

function groupMatches(group) {
  return matches.filter((m) => m.stage === 'Group Stage' && m.group === group).sort((a, b) => a.match_no - b.match_no);
}

function groupTeams(group) {
  const seen = new Map();
  groupMatches(group).forEach((m) => {
    if (m.team_1_code) seen.set(m.team_1_code, m.team_1_name);
    if (m.team_2_code) seen.set(m.team_2_code, m.team_2_name);
  });
  return [...seen.entries()].map(([code, name]) => ({ code, name, group }));
}

function allTeams() {
  const seen = new Map();
  groups.forEach((group) => groupTeams(group).forEach((team) => seen.set(team.code, team)));
  return [...seen.values()].sort((a, b) => a.code.localeCompare(b.code));
}

function teamMatches(code) {
  return matches.filter((m) => m.team_1_code === code || m.team_2_code === code).sort((a, b) => a.match_no - b.match_no);
}

function venueKey(match) {
  return `${match.venue}|||${match.city}`;
}

function allVenues() {
  const venues = new Map();
  matches.forEach((match) => {
    const key = venueKey(match);
    if (!venues.has(key)) venues.set(key, { venue: match.venue, city: match.city, matches: [] });
    venues.get(key).matches.push(match);
  });
  return [...venues.values()].map((venue) => ({ ...venue, matches: venue.matches.sort((a, b) => a.match_no - b.match_no) })).sort((a, b) => a.city.localeCompare(b.city));
}

function bracketPath(matchNo) {
  return bracketPaths.filter((p) => p.from_match === matchNo);
}

function matchCard(match, variant = '') {
  return `<button class="matchCard ${variant}" data-match="${match.match_no}">
    <span class="matchNo">${matchCode(match)}</span>
    <span class="status ${esc(match.status)}">${esc(match.status)}</span>
    <strong>${esc(matchLabel(match))}</strong>
    <span class="when">${esc(match.date_ast)} · ${esc(match.kickoff_ast)} AST</span>
    <span class="venue">${esc(venueShort(match))} · ${esc(match.city)}</span>
  </button>`;
}

function groupCard(group, compact = false) {
  const teams = groupTeams(group).map((t) => `<div class="teamRow"><span class="code">${esc(t.code)}</span><span>${esc(t.name)}</span></div>`).join('');
  const cards = groupMatches(group).map((m) => matchCard(m, compact ? 'compact' : '')).join('');
  return `<section class="groupCard group${group}">
    <header><h3>Group ${group}</h3><span>1${group} · 2${group} · 3${group}*</span></header>
    <div class="teams">${teams}</div>
    <div class="cards">${cards}</div>
  </section>`;
}

function bracket(compact = false) {
  return `<section class="bracket ${compact ? 'compactBracket' : ''}">
    ${knockoutStages.map((stage) => {
      const stageMatches = matches.filter((m) => m.stage === stage).sort((a, b) => a.match_no - b.match_no);
      return `<div class="round"><h3>${esc(stage)}</h3>${stageMatches.map((m) => matchCard(m, compact ? 'compact' : '')).join('')}</div>`;
    }).join('')}
  </section>`;
}

function nextMatches() {
  const active = matches.filter((m) => m.status !== 'completed').slice(0, 4);
  return active.length ? active : matches.slice(0, 4);
}

function topbar() {
  return `<header class="topbar">
    <div><p class="eyebrow">WK 2026 Aruba Schedule</p><h1>World Cup 2026 match command center</h1><p class="lede">All 104 matches, group pools, date agendas, team paths, venues, and knockout spine in Aruba time.</p></div>
    <div class="topMeta"><span class="pill">AST / UTC-4</span><span>24-hour match times</span><span>${matches.length} data-driven matches</span></div>
  </header>`;
}

function nav() {
  return `<nav class="tabs" aria-label="Primary navigation">${navItems.map((item) => `<a class="${state.view === item ? 'active' : ''}" href="#${item}">${item}</a>`).join('')}</nav>`;
}

function filters() {
  return `<section class="filters" aria-label="Match filters">
    <label>Search<input id="search" value="${esc(state.q)}" placeholder="Team, match number, city, venue..."></label>
    <label>Stage<select id="stage">${stages.map((s) => `<option ${state.stage === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
    <label>Group<select id="group">${['All', ...groups].map((g) => `<option ${state.group === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></label>
    <label>Status<select id="status">${statuses.map((s) => `<option ${state.status === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
    <button class="reset" data-reset="true">Reset filters</button>
  </section>`;
}

function overview() {
  const completed = matches.filter((m) => m.status === 'completed').length;
  return `<main class="overviewPage">
    <section class="heroPanel">
      <div><p class="eyebrow">Master overview</p><h2>From matchday agenda to team and venue lookup.</h2><p>Browse featured fixtures, daily schedules, group cards, team paths, host venues, complete search, or the broadcast-style poster.</p></div>
      <div class="statGrid"><div><strong>${matches.length}</strong><span>matches</span></div><div><strong>${allTeams().length}</strong><span>teams in data</span></div><div><strong>${allVenues().length}</strong><span>venues</span></div><div><strong>${completed}</strong><span>completed</span></div></div>
    </section>
    <section class="featureGrid">
      <div class="featurePanel"><div class="sectionTitle"><h2>Next / featured matches</h2><span>AST / UTC-4</span></div><div class="featureCards">${nextMatches().map((m) => matchCard(m, 'featured')).join('')}</div></div>
      <div class="featurePanel"><div class="sectionTitle accent"><h2>Knockout at a glance</h2><span>M73-M104</span></div>${bracket(true)}</div>
    </section>
    <section><div class="sectionTitle"><h2>Group stage</h2><span>12 prominent pools</span></div><div class="groupGrid overviewGroups">${groups.map((g) => groupCard(g, true)).join('')}</div></section>
  </main>`;
}

function agendaPage() {
  const byDate = new Map();
  matches.forEach((match) => {
    if (!byDate.has(match.date_ast)) byDate.set(match.date_ast, []);
    byDate.get(match.date_ast).push(match);
  });
  return `<main class="pagePanel"><div class="pageIntro"><h2>Date agenda</h2><p>Daily match cards in match-number order · AST / UTC-4</p></div><div class="agendaList">
    ${[...byDate.entries()].map(([date, dateMatches]) => `<section class="agendaDay"><header><h3>${esc(date)}</h3><span>${dateMatches.length} matches · AST / UTC-4</span></header><div class="matchList agendaMatches">${dateMatches.sort((a, b) => a.match_no - b.match_no).map((m) => matchCard(m)).join('')}</div></section>`).join('')}
  </div></main>`;
}

function groupsPage() {
  return `<main><div class="pageIntro"><h2>Groups A-L</h2><p>Every group card stays visible and data-driven from the match file.</p></div><div class="pageGrid">${groups.map((g) => groupCard(g)).join('')}</div></main>`;
}

function teamsPage() {
  const teams = allTeams();
  const selected = state.selectedTeam ? teams.find((team) => team.code === state.selectedTeam) : null;
  const selectedMatches = selected ? teamMatches(selected.code) : [];
  return `<main class="pagePanel"><div class="pageIntro"><h2>Teams</h2><p>${teams.length} teams · click a card to inspect matches</p></div>
    <div class="teamGrid">${teams.map((team) => `<button class="teamCard ${state.selectedTeam === team.code ? 'active' : ''}" data-team="${esc(team.code)}"><span class="teamCode">${esc(team.code)}</span><strong>${esc(team.name)}</strong><span>Group ${esc(team.group)}</span><small>${teamMatches(team.code).length} matches in data</small></button>`).join('')}</div>
    <section class="focusPanel"><div class="sectionTitle"><h2>${selected ? `${esc(selected.code)} schedule` : 'Select a team'}</h2><span>${selected ? `${selectedMatches.length} matches · Group ${esc(selected.group)}` : 'Team-focused view'}</span></div>${selected ? `<div class="matchList">${selectedMatches.map((m) => matchCard(m)).join('')}</div>` : '<p class="emptyState">Choose any team card above to show that team’s current match path.</p>'}</section>
  </main>`;
}

function venuesPage() {
  const venues = allVenues();
  const selected = state.selectedVenue ? venues.find((venue) => venueKey(venue.matches[0]) === state.selectedVenue) : null;
  return `<main class="pagePanel"><div class="pageIntro"><h2>Venues</h2><p>${venues.length} host venues · click a venue to inspect hosted matches</p></div>
    <div class="venueGrid">${venues.map((venue) => `<button class="venueCard ${state.selectedVenue === venueKey(venue.matches[0]) ? 'active' : ''}" data-venue="${esc(venueKey(venue.matches[0]))}"><strong>${esc(venue.venue)}</strong><span>${esc(venue.city)}</span><small>${venue.matches.length} hosted matches</small></button>`).join('')}</div>
    <section class="focusPanel"><div class="sectionTitle accent"><h2>${selected ? esc(selected.venue) : 'Select a venue'}</h2><span>${selected ? `${esc(selected.city)} · ${selected.matches.length} matches` : 'Venue-focused view'}</span></div>${selected ? `<div class="matchList">${selected.matches.map((m) => matchCard(m)).join('')}</div>` : '<p class="emptyState">Choose a venue card above to show every match hosted there.</p>'}</section>
  </main>`;
}

function knockoutPage() {
  return `<main class="pagePanel"><div class="pageIntro"><h2>Knockout bracket spine</h2><p>Round of 32 through Final, including all placeholders from M73-M104.</p></div>${bracket()}</main>`;
}

function searchableText(m) {
  return [`M${m.match_no}`, matchCode(m), m.match_no, m.stage, m.group, m.team_1_code, m.team_1_name, m.team_2_code, m.team_2_name, m.slot_1, m.slot_2, m.date_ast, m.kickoff_ast, m.venue, m.city, m.status, m.score].join(' ').toLowerCase();
}

function filteredMatches() {
  const q = state.q.trim().toLowerCase();
  return matches.filter((m) => {
    if (state.stage !== 'All' && m.stage !== state.stage) return false;
    if (state.group !== 'All' && m.group !== state.group) return false;
    if (state.status !== 'All' && m.status !== state.status) return false;
    return !q || searchableText(m).includes(q);
  });
}

function matchesMarkup() {
  const rows = filteredMatches();
  return `<div class="pageIntro"><h2>All matches</h2><p><span id="matchCount">${rows.length}</span> matches match the current filters.</p></div><div id="matchResults" class="matchList">${rows.map((m) => matchCard(m)).join('')}</div>`;
}

function matchesPage() {
  return `<main class="pagePanel">${matchesMarkup()}</main>`;
}

function updateMatchesResults() {
  if (state.view !== 'matches') return false;
  const count = document.querySelector('#matchCount');
  const results = document.querySelector('#matchResults');
  if (!count || !results) return false;
  const rows = filteredMatches();
  count.textContent = String(rows.length);
  results.innerHTML = rows.map((m) => matchCard(m)).join('');
  return true;
}

function exportPage() {
  return `<main class="pagePanel exportPanel"><p class="eyebrow">Export center</p><h2>Static preview and future export handoff</h2><p>This zero-dependency app is ready for GitHub Pages via the generated <code>docs/</code> preview. Browser export actions can be connected in a later phase.</p><div class="exportGrid"><div><strong>Poster route</strong><span><a href="#poster">#poster</a></span></div><div><strong>Pages path</strong><span>/wk2026-aruba-schedule/</span></div><div><strong>Data source</strong><span>data/matches.json</span></div></div></main>`;
}

function posterPage() {
  return `<main class="posterSheet"><nav class="posterEscape" aria-label="Poster navigation"><a href="#overview">Back to overview</a><a href="#matches">Matches</a><a href="#groups">Groups</a></nav><div class="posterHeader"><div><p class="eyebrow">World Cup 2026 Schedule</p><h2>Aruba Time · AST / UTC-4</h2></div><strong>Groups + Knockout</strong></div><div class="posterLayout"><section><div class="sectionTitle"><h2>Group stage - 12 pools</h2><span>A-L</span></div><div class="groupGrid posterGroups">${groups.map((g) => groupCard(g, true)).join('')}</div></section><section><div class="sectionTitle accent"><h2>Knockout stage</h2><span>M73-M104</span></div>${bracket(true)}</section></div></main>`;
}

function modal() {
  if (!state.selected) return '';
  const m = state.selected;
  const left = teamSide(m, 1);
  const right = teamSide(m, 2);
  const paths = bracketPath(m.match_no);
  const summary = matchSummary(m);
  return `<div class="modalBackdrop" data-close="true">
    <article class="modal" role="dialog" aria-modal="true" aria-label="Match details">
      <button class="close" data-close="true" aria-label="Close">×</button>
      <p class="eyebrow">${esc(m.stage)} ${m.group ? `· Group ${esc(m.group)}` : ''}</p>
      <h2>${matchCode(m)} · ${esc(left.code)} vs ${esc(right.code)}</h2>
      <div class="modalTeams"><div><span>${esc(left.code)}</span><strong>${esc(left.name)}</strong></div><div class="scoreBox">${esc(m.score || 'vs')}</div><div><span>${esc(right.code)}</span><strong>${esc(right.name)}</strong></div></div>
      <div class="copyBox"><button class="copyButton" data-copy="${m.match_no}">Copy match summary</button>${state.copyStatus ? `<span>${esc(state.copyStatus)}</span>` : ''}<textarea readonly>${esc(state.copyText || summary)}</textarea></div>
      <dl>
        <div><dt>Date</dt><dd>${esc(m.date_ast)}</dd></div><div><dt>Kickoff</dt><dd>${esc(m.kickoff_ast)} AST / UTC-4</dd></div>
        <div><dt>Venue / city</dt><dd>${esc(m.venue)} · ${esc(m.city)}</dd></div><div><dt>Status</dt><dd>${esc(m.status)}</dd></div>
        <div><dt>Source version</dt><dd>${esc(m.source_version)}</dd></div>
        ${paths.length ? paths.map((p) => `<div><dt>Bracket path</dt><dd>${p.winner_feeds_to ? `Winner feeds to M${p.winner_feeds_to}. ` : ''}${p.loser_feeds_to ? `Loser feeds to M${p.loser_feeds_to}.` : ''}</dd></div>`).join('') : '<div><dt>Bracket path</dt><dd>No downstream bracket path recorded for this match.</dd></div>'}
      </dl>
    </article>
  </div>`;
}

function content() {
  if (state.view === 'agenda') return agendaPage();
  if (state.view === 'groups') return groupsPage();
  if (state.view === 'teams') return teamsPage();
  if (state.view === 'venues') return venuesPage();
  if (state.view === 'knockout') return knockoutPage();
  if (state.view === 'matches') return matchesPage();
  if (state.view === 'export') return exportPage();
  if (state.view === 'poster') return posterPage();
  return overview();
}

function render() {
  document.body.className = state.view === 'poster' ? 'posterMode' : '';
  app.innerHTML = `<div class="shell">${topbar()}${nav()}${state.view === 'matches' ? filters() : ''}${content()}<footer class="legend">AST = Atlantic Standard Time, UTC-4 · Groups A-L remain visible · Knockout M73-M104 remains visible · all match content is loaded from data/matches.json</footer>${modal()}</div>`;
}

window.addEventListener('hashchange', () => { state.view = routeFromHash(); state.selected = null; state.copyText = ''; state.copyStatus = ''; render(); });

app.addEventListener('click', async (event) => {
  const route = event.target.closest('a[href^="#"]');
  if (route) { setRoute(route.getAttribute('href').slice(1)); return; }
  const teamBtn = event.target.closest('[data-team]');
  if (teamBtn) { state.selectedTeam = teamBtn.dataset.team; render(); return; }
  const venueBtn = event.target.closest('[data-venue]');
  if (venueBtn) { state.selectedVenue = venueBtn.dataset.venue; render(); return; }
  const copyBtn = event.target.closest('[data-copy]');
  if (copyBtn) {
    const match = matches.find((m) => m.match_no === Number(copyBtn.dataset.copy));
    state.copyText = matchSummary(match);
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(state.copyText);
      state.copyStatus = 'Copied';
    } catch {
      state.copyStatus = 'Clipboard unavailable — select the text below';
    }
    render();
    return;
  }
  const matchBtn = event.target.closest('[data-match]');
  if (matchBtn) { state.selected = matches.find((m) => m.match_no === Number(matchBtn.dataset.match)); state.copyText = ''; state.copyStatus = ''; render(); return; }
  if (event.target.closest('[data-reset]')) { state = { ...state, ...defaultState, view: state.view }; render(); return; }
  if (event.target.closest('[data-close]')) { state.selected = null; state.copyText = ''; state.copyStatus = ''; render(); }
});

app.addEventListener('input', (event) => {
  if (event.target.id === 'search') {
    state.q = event.target.value;
    updateMatchesResults();
  }
});

app.addEventListener('input', (event) => { if (event.target.id === 'search') { state.q = event.target.value; render(); } });
app.addEventListener('change', (event) => {
  if (event.target.id === 'stage') state.stage = event.target.value;
  if (event.target.id === 'group') state.group = event.target.value;
  if (event.target.id === 'status') state.status = event.target.value;
  if (!updateMatchesResults()) render();
});

render();
