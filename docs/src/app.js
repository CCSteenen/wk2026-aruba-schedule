import matches from '../data/matches.json' with { type: 'json' };
import bracketPaths from '../data/bracket_paths.json' with { type: 'json' };
import teamIdentity from '../data/team_identity.json' with { type: 'json' };
import venueLocations from '../data/venue_locations.json' with { type: 'json' };
import sourceRegistry from '../data/source_registry.json' with { type: 'json' };

const groups = 'ABCDEFGHIJKL'.split('');
const navItems = ['overview', 'agenda', 'groups', 'teams', 'venues', 'knockout', 'matches', 'export', 'poster'];
const knockoutStages = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Bronze Final', 'Final'];
const stages = ['All', 'Group Stage', ...knockoutStages];
const statuses = ['All', ...[...new Set(matches.map((m) => m.status))].sort()];
const teamLookup = new Map(teamIdentity.map((t) => [t.code, t]));
const sourceFreshness = sourceRegistry.last_checked_at || sourceRegistry.note || 'Manual seed data, verification required';
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


function getArubaNow() {
  return new Date();
}

function getArubaTodayLabel() {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Aruba', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(getArubaNow());
}

function parseMatchDateTimeAst(match) {
  const clean = String(match.date_ast).replace(/^\w+\s+/, '');
  const [day, monthName] = clean.split(' ');
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].findIndex((m) => m.toLowerCase() === String(monthName).slice(0,3).toLowerCase());
  const [hour, minute] = String(match.kickoff_ast || '00:00').split(':').map(Number);
  return new Date(Date.UTC(2026, month, Number(day), hour + 4, minute || 0));
}

function getTimelineState(match) {
  if (match.status === 'completed') return 'completed';
  const start = parseMatchDateTimeAst(match);
  const now = getArubaNow();
  const diff = start.getTime() - now.getTime();
  if (diff > 0) return 'upcoming';
  if (diff > -2 * 60 * 60 * 1000) return 'live / near-live';
  return 'result pending';
}

function flagMarkup(code) {
  const team = teamLookup.get(code);
  if (!team?.flag) return '<span class="flag flagTbd"></span>';
  const colors = team.flag.colors || ['#f8fafc', '#18c4a3', '#56a6ff'];
  const gradient = team.flag.orientation === 'vertical' ? `linear-gradient(90deg, ${colors.join(', ')})` : `linear-gradient(180deg, ${colors.join(', ')})`;
  return `<span class="flag" title="${esc(team.name)} flag" style="--flag:${esc(gradient)}"></span>`;
}

function teamChip(team) {
  return `<span class="teamChip">${flagMarkup(team.code)}<span class="code">${esc(team.code)}</span><span>${esc(team.name)}</span></span>`;
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
  return `${matchCode(match)}: ${teamSide(match, 1).code} v ${teamSide(match, 2).code}, ${match.date_ast}, ${match.kickoff_ast} AST / UTC-4, ${match.venue}, ${match.city}`;
}

function matchLabel(match) {
  const left = teamSide(match, 1);
  const right = teamSide(match, 2);
  const middle = match.status === 'completed' && match.score ? match.score : 'v';
  return `${teamChip(left)} <span class="scoreInline">${esc(middle)}</span> ${teamChip(right)}`;
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
    <span class="status ${esc(match.status)}">${esc(match.status)}</span><span class="status timeline ${esc(getTimelineState(match)).replaceAll(' ', '-').replace('/', '')}">${esc(getTimelineState(match))}</span>
    <strong class="matchTeams">${matchLabel(match)}</strong>
    <span class="when">${esc(match.date_ast)} · ${esc(match.kickoff_ast)} AST</span>
    <span class="venue">${esc(venueShort(match))} · ${esc(match.city)}</span>
  </button>`;
}

function groupCard(group, compact = false) {
  const teams = groupTeams(group).map((t) => `<div class="teamRow">${teamChip(t)}</div>`).join('');
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

function nextMatches(limit = 6) {
  return matches.filter((m) => ['upcoming', 'live / near-live'].includes(getTimelineState(m))).sort((a, b) => parseMatchDateTimeAst(a) - parseMatchDateTimeAst(b)).slice(0, limit);
}
function recentMatches(limit = 6) {
  return matches.filter((m) => ['completed', 'result pending'].includes(getTimelineState(m))).sort((a, b) => parseMatchDateTimeAst(b) - parseMatchDateTimeAst(a)).slice(0, limit);
}

function topbar() {
  return `<header class="topbar">
    <div><p class="eyebrow">WK 2026 Aruba Schedule</p><h1>World Cup 2026 match command center</h1><p class="lede">All 104 matches, group pools, date agendas, team paths, venues, and knockout spine in Aruba time.</p></div>
    <div class="topMeta"><span class="pill">AST / UTC-4</span><span>Today in Aruba: ${esc(getArubaTodayLabel())}</span><span>${matches.length} data-driven matches</span></div>
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
  const counts = { total: matches.length, upcoming: matches.filter((m) => ['upcoming', 'live / near-live'].includes(getTimelineState(m))).length, completed: matches.filter((m) => m.status === 'completed').length, pending: matches.filter((m) => getTimelineState(m) === 'result pending').length };
  const actions = [['Agenda','agenda'],['Groups','groups'],['Teams','teams'],['Venues','venues'],['Knockout','knockout'],['Matches','matches'],['Poster','poster']];
  return `<main class="overviewPage">
    <section class="heroPanel commandHero"><div><p class="eyebrow">Command center</p><h2>WK 2026 Aruba Schedule</h2><p>AST / UTC-4 · Today in Aruba: <strong>${esc(getArubaTodayLabel())}</strong></p><p class="sourceLine">External source: ${esc(sourceRegistry.external_source)} · Internal data: ${esc(sourceRegistry.internal_source)} · ${esc(sourceFreshness)}</p></div>
    <div class="statGrid"><div><strong>${counts.total}</strong><span>total matches</span></div><div><strong>${counts.upcoming}</strong><span>upcoming matches</span></div><div><strong>${counts.completed}</strong><span>completed in data</span></div><div><strong>${counts.pending}</strong><span>result pending</span></div><div><strong>${allVenues().length}</strong><span>venues</span></div><div><strong>${allTeams().length}</strong><span>teams</span></div></div></section>
    <section class="actionGrid">${actions.map(([label, route]) => `<a class="actionCard" href="#${route}"><strong>${label}</strong><span>Open ${label.toLowerCase()}</span></a>`).join('')}</section>
    <section class="featureGrid"><div class="featurePanel"><div class="sectionTitle"><h2>Next up</h2><span>from current Aruba time</span></div><div class="featureCards">${nextMatches(8).map((m) => matchCard(m, 'featured')).join('') || '<p class="emptyState">No upcoming matches found.</p>'}</div></div>
    <div class="featurePanel"><div class="sectionTitle accent"><h2>Recently completed / result pending</h2><span>official status + timeline</span></div><div class="featureCards">${recentMatches(8).map((m) => matchCard(m)).join('')}</div></div></section>
  </main>`;
}

function agendaSection(title, rows) {
  const byDate = new Map();
  rows.forEach((match) => { if (!byDate.has(match.date_ast)) byDate.set(match.date_ast, []); byDate.get(match.date_ast).push(match); });
  return `<section class="agendaBlock"><div class="sectionTitle"><h2>${title}</h2><span>AST / UTC-4</span></div>${[...byDate.entries()].map(([date, dateMatches]) => `<section class="agendaDay"><header><h3>${esc(date)}</h3><span>${dateMatches.length} matches · AST / UTC-4</span></header><div class="matchList agendaMatches">${dateMatches.sort((a, b) => parseMatchDateTimeAst(a) - parseMatchDateTimeAst(b)).map((m) => matchCard(m)).join('')}</div></section>`).join('') || '<p class="emptyState">No matches in this section.</p>'}</section>`;
}
function agendaPage() {
  const upcoming = matches.filter((m) => ['upcoming', 'live / near-live'].includes(getTimelineState(m))).sort((a, b) => parseMatchDateTimeAst(a) - parseMatchDateTimeAst(b));
  const historical = matches.filter((m) => !['upcoming', 'live / near-live'].includes(getTimelineState(m))).sort((a, b) => parseMatchDateTimeAst(b) - parseMatchDateTimeAst(a));
  return `<main class="pagePanel"><div class="pageIntro"><h2>Agenda</h2><p>Upcoming first, historical below · Today in Aruba: ${esc(getArubaTodayLabel())}</p></div><div class="agendaList">${agendaSection('Upcoming matches', upcoming)}${agendaSection('Historical matches', historical)}</div></main>`;
}

function groupsPage() {
  return `<main><div class="pageIntro"><h2>Groups A-L</h2><p>Every group card stays visible and data-driven from the match file.</p></div><div class="pageGrid">${groups.map((g) => groupCard(g)).join('')}</div></main>`;
}

function teamsPage() {
  const teams = allTeams();
  const selected = state.selectedTeam ? teams.find((team) => team.code === state.selectedTeam) : null;
  const selectedMatches = selected ? teamMatches(selected.code) : [];
  return `<main class="pagePanel"><div class="pageIntro"><h2>Teams</h2><p>${teams.length} teams · click a card to inspect matches</p></div>
    <div class="teamGrid">${teams.map((team) => `<button class="teamCard ${state.selectedTeam === team.code ? 'active' : ''}" data-team="${esc(team.code)}">${flagMarkup(team.code)}<span class="teamCode">${esc(team.code)}</span><strong>${esc(team.name)}</strong><span>Group ${esc(team.group)}</span><small>${teamMatches(team.code).length} matches in data</small></button>`).join('')}</div>
    <section class="focusPanel"><div class="sectionTitle"><h2>${selected ? `${esc(selected.code)} schedule` : 'Select a team'}</h2><span>${selected ? `${selectedMatches.length} matches · Group ${esc(selected.group)}` : 'Team-focused view'}</span></div>${selected ? `<div class="matchList">${selectedMatches.map((m) => matchCard(m)).join('')}</div>` : '<p class="emptyState">Choose any team card above to show that team’s current match path.</p>'}</section>
  </main>`;
}

function venuesPage() {
  const venues = allVenues();
  const selected = state.selectedVenue ? venues.find((venue) => venueKey(venue.matches[0]) === state.selectedVenue) : null;
  return `<main class="pagePanel"><div class="pageIntro"><h2>Venues</h2><p>${venues.length} host venues · click a venue to inspect hosted matches · Map-ready later foundation added</p></div>
    <div class="venueGrid">${venues.map((venue) => `<button class="venueCard ${state.selectedVenue === venueKey(venue.matches[0]) ? 'active' : ''}" data-venue="${esc(venueKey(venue.matches[0]))}"><strong>${esc(venue.venue)}</strong><span>${esc(venue.city)}</span><small>${venue.matches.length} hosted matches · Map-ready later</small></button>`).join('')}</div>
    <section class="focusPanel"><div class="sectionTitle accent"><h2>${selected ? esc(selected.venue) : 'Select a venue'}</h2><span>${selected ? `${esc(selected.city)} · ${selected.matches.length} matches` : 'Venue-focused view'}</span></div>${selected ? `<div class="matchList">${selected.matches.map((m) => matchCard(m)).join('')}</div>` : '<p class="emptyState">Choose a venue card above to show every match hosted there.</p>'}</section>
  </main>`;
}

function knockoutPage() {
  return `<main class="pagePanel"><div class="pageIntro"><h2>Knockout bracket spine</h2><p>Round of 32 through Final, including all placeholders from M73-M104.</p></div>${bracket()}</main>`;
}

function normalizeSearch(value) {
  return String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function searchTokens(value) { return normalizeSearch(value).split(/\s+/).filter(Boolean); }
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
function searchableFields(m) {
  const teams = [teamLookup.get(m.team_1_code), teamLookup.get(m.team_2_code)].filter(Boolean);
  return [matchCode(m), `M${m.match_no}`, m.match_no, m.stage, m.group, m.team_1_code, m.team_1_name, m.team_2_code, m.team_2_name, m.slot_1, m.slot_2, m.date_ast, m.kickoff_ast, m.venue, m.city, m.status, m.score, ...teams.flatMap((t) => [t.code, t.name, ...(t.aliases || [])])];
}
function matchSearchScore(m, q) {
  const nq = normalizeSearch(q);
  if (!nq) return 1;
  const hay = normalizeSearch(searchableFields(m).join(' '));
  if (hay.includes(nq)) return 100;
  const hayTokens = new Set(searchTokens(hay));
  return searchTokens(nq).reduce((score, token) => {
    if (hayTokens.has(token)) return score + 20;
    if (token.length >= 4 && [...hayTokens].some((candidate) => candidate.length >= 4 && levenshtein(token, candidate) <= (token.length <= 6 ? 1 : 2))) return score + 8;
    return -999;
  }, 0);
}
function filteredMatches() {
  const q = state.q.trim();
  return matches.map((m) => ({ m, score: matchSearchScore(m, q) })).filter(({ m, score }) => {
    if (state.stage !== 'All' && m.stage !== state.stage) return false;
    if (state.group !== 'All' && m.group !== state.group) return false;
    if (state.status !== 'All' && m.status !== state.status) return false;
    return !q || score > 0;
  }).sort((a, b) => (b.score - a.score) || (a.m.match_no - b.m.match_no)).map(({ m }) => m);
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
  const m = state.selected; const left = teamSide(m, 1); const right = teamSide(m, 2); const paths = bracketPath(m.match_no); const summary = matchSummary(m);
  return `<div class="modalBackdrop" data-close="true"><article class="modal professionalModal" role="dialog" aria-modal="true" aria-label="Match details"><button class="close" data-close="true" aria-label="Close">×</button>
    <header class="modalHeader"><p class="eyebrow">${matchCode(m)} · ${esc(m.stage)}</p><h2>${esc(m.group ? `Group ${m.group}` : m.stage)}</h2><div><span class="status ${esc(m.status)}">${esc(m.status)}</span><span class="status timeline">${esc(getTimelineState(m))}</span></div></header>
    <div class="modalTeams pro"><div class="teamBlock">${flagMarkup(left.code)}<span>${esc(left.code)}</span><strong>${esc(left.name)}</strong></div><div class="scoreBox">${esc(m.status === 'completed' && m.score ? m.score : 'vs')}</div><div class="teamBlock">${flagMarkup(right.code)}<span>${esc(right.code)}</span><strong>${esc(right.name)}</strong></div></div>
    <div class="copyBox proCopy"><button class="copyButton primary" data-copy="${m.match_no}">Copy match summary</button>${state.copyStatus ? `<span>${esc(state.copyStatus)}</span>` : ''}<label>Selectable fallback text<textarea readonly>${esc(state.copyText || summary)}</textarea></label></div>
    <dl><div><dt>Date</dt><dd>${esc(m.date_ast)}</dd></div><div><dt>Kickoff AST / UTC-4</dt><dd>${esc(m.kickoff_ast)}</dd></div><div><dt>Venue</dt><dd>${esc(m.venue)}</dd></div><div><dt>City</dt><dd>${esc(m.city)}</dd></div><div><dt>Source version</dt><dd>${esc(m.source_version)}</dd></div><div><dt>Status</dt><dd>Official: ${esc(m.status)} · Timeline: ${esc(getTimelineState(m))}</dd></div>${paths.length ? paths.map((p) => `<div><dt>Bracket path</dt><dd>${p.winner_feeds_to ? `Winner feeds to M${p.winner_feeds_to}. ` : ''}${p.loser_feeds_to ? `Loser feeds to M${p.loser_feeds_to}.` : ''}</dd></div>`).join('') : '<div><dt>Bracket path</dt><dd>No downstream bracket path recorded for this match.</dd></div>'}</dl>
  </article></div>`;
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
  app.innerHTML = `<div class="shell">${topbar()}${nav()}${state.view === 'matches' ? filters() : ''}${content()}<footer class="legend">AST = Atlantic Standard Time, UTC-4 · External source: ${esc(sourceRegistry.external_source)} · Internal data: ${esc(sourceRegistry.internal_source)} · ${esc(sourceFreshness)} · Groups A-L and Knockout M73-M104 remain visible</footer>${modal()}</div>`;
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
