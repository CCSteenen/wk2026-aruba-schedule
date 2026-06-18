import matches from '../data/matches.json' with { type: 'json' };
import bracketPaths from '../data/bracket_paths.json' with { type: 'json' };

const groups = 'ABCDEFGHIJKL'.split('');
const knockoutStages = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Bronze Final', 'Final'];
const app = document.querySelector('#app');

let state = { view: 'overview', q: '', stage: 'All', group: 'All', selected: null };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function matchLabel(match) {
  const left = match.team_1_code || match.slot_1;
  const right = match.team_2_code || match.slot_2;
  if (match.status === 'completed' && match.score) return `${left} ${match.score} ${right}`;
  return `${left} v ${right}`;
}

function venueShort(match) {
  return String(match.venue).replace(' Stadium', '').replace('New York New Jersey Stadium', 'NY/NJ').replace('San Francisco Bay Area Stadium', 'SF Bay Area');
}

function groupTeams(group) {
  const seen = new Map();
  matches.filter((m) => m.stage === 'Group Stage' && m.group === group).forEach((m) => {
    if (m.team_1_code) seen.set(m.team_1_code, m.team_1_name);
    if (m.team_2_code) seen.set(m.team_2_code, m.team_2_name);
  });
  return [...seen.entries()].map(([code, name]) => ({ code, name }));
}

function matchCard(match) {
  return `<button class="matchCard" data-match="${match.match_no}">
    <span class="matchNo">M${String(match.match_no).padStart(2, '0')}</span>
    <span class="when">${esc(match.date_ast)} · ${esc(match.kickoff_ast)} AST</span>
    <strong>${esc(matchLabel(match))}</strong>
    <span class="venue">${esc(venueShort(match))}</span>
  </button>`;
}

function groupCard(group) {
  const teamRows = groupTeams(group).map((t) => `<div class="teamRow"><span class="code">${esc(t.code)}</span><span>${esc(t.name)}</span></div>`).join('');
  const groupMatches = matches.filter((m) => m.stage === 'Group Stage' && m.group === group).sort((a,b) => a.match_no - b.match_no);
  return `<section class="groupCard group${group}">
    <header><h3>Group ${group}</h3><span>1${group} · 2${group} · 3${group}*</span></header>
    <div class="teams">${teamRows}</div>
    <div class="cards">${groupMatches.map(matchCard).join('')}</div>
  </section>`;
}

function bracket() {
  return `<section class="bracket">
    ${knockoutStages.map((stage) => {
      const stageMatches = matches.filter((m) => m.stage === stage).sort((a,b) => a.match_no - b.match_no);
      return `<div class="round"><h3>${esc(stage)}</h3>${stageMatches.map(matchCard).join('')}</div>`;
    }).join('')}
  </section>`;
}

function filteredMatches() {
  const q = state.q.trim().toLowerCase();
  return matches.filter((m) => {
    if (state.stage !== 'All' && m.stage !== state.stage) return false;
    if (state.group !== 'All' && m.group !== state.group) return false;
    if (!q) return true;
    return [
      `M${m.match_no}`, m.match_no, m.stage, m.group, m.team_1_code, m.team_1_name, m.team_2_code, m.team_2_name,
      m.slot_1, m.slot_2, m.date_ast, m.kickoff_ast, m.venue, m.city, m.status, m.score
    ].join(' ').toLowerCase().includes(q);
  });
}

function topbar() {
  return `<header class="topbar">
    <div><p class="eyebrow">World Cup 2026</p><h1>Schedule - Aruba Time</h1></div>
    <div class="topMeta"><span class="pill">AST / UTC-4</span><span>24-hour match times</span></div>
  </header>`;
}

function nav() {
  const items = ['overview', 'groups', 'knockout', 'matches', 'export', 'poster'];
  return `<nav class="tabs">${items.map((item) => `<button class="${state.view === item ? 'active' : ''}" data-view="${item}">${item}</button>`).join('')}</nav>`;
}

function filters() {
  return `<section class="filters">
    <input id="search" value="${esc(state.q)}" placeholder="Search team, venue, city, M73...">
    <select id="stage">
      ${['All','Group Stage',...knockoutStages].map((s) => `<option ${state.stage === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
    </select>
    <select id="group">
      ${['All',...groups].map((g) => `<option ${state.group === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}
    </select>
  </section>`;
}

function overview() {
  return `<main class="posterGrid">
    <section><div class="sectionTitle"><h2>Group Stage</h2><span>12 pools</span></div><div class="groupGrid">${groups.map(groupCard).join('')}</div></section>
    <section><div class="sectionTitle accent"><h2>Knockout Stage</h2><span>Match number spine</span></div>${bracket()}</section>
  </main>`;
}

function groupsPage() {
  return `<main class="pageGrid">${groups.map(groupCard).join('')}</main>`;
}

function knockoutPage() {
  return `<main class="pagePanel">${bracket()}</main>`;
}

function matchesPage() {
  const rows = filteredMatches();
  return `<main class="pagePanel"><h2>All matches</h2><p>${rows.length} matches</p><div class="matchList">${rows.map(matchCard).join('')}</div></main>`;
}

function exportPage() {
  return `<main class="pagePanel">
    <h2>Export Center</h2>
    <p>The approved reference renderer is included in <code>reference/render_wk2026_aruba.py</code>.</p>
    <p>The next phase can connect the browser poster route to PNG, SVG and PDF export.</p>
    <ul><li>Master PNG 3840 x 2160</li><li>Editable SVG</li><li>Print PDF</li><li>QA report</li></ul>
  </main>`;
}

function modal() {
  if (!state.selected) return '';
  const m = state.selected;
  const path = bracketPaths.filter((p) => p.from_match === m.match_no);
  return `<div class="modalBackdrop" data-close="true">
    <article class="modal">
      <button class="close" data-close="true">×</button>
      <p class="eyebrow">${esc(m.stage)}</p>
      <h2>M${m.match_no}: ${esc(matchLabel(m))}</h2>
      <dl>
        <div><dt>Date</dt><dd>${esc(m.date_ast)}</dd></div>
        <div><dt>Kickoff</dt><dd>${esc(m.kickoff_ast)} AST</dd></div>
        <div><dt>Venue</dt><dd>${esc(m.venue)}, ${esc(m.city)}</dd></div>
        <div><dt>Status</dt><dd>${esc(m.status)}</dd></div>
        <div><dt>Source</dt><dd>${esc(m.source_version)}</dd></div>
        ${path.map((p) => `<div><dt>Bracket path</dt><dd>${p.winner_feeds_to ? `Winner feeds to M${p.winner_feeds_to}. ` : ''}${p.loser_feeds_to ? `Loser feeds to M${p.loser_feeds_to}.` : ''}</dd></div>`).join('')}
      </dl>
    </article>
  </div>`;
}

function content() {
  if (state.view === 'groups') return groupsPage();
  if (state.view === 'knockout') return knockoutPage();
  if (state.view === 'matches') return matchesPage();
  if (state.view === 'export') return exportPage();
  return overview();
}

function render() {
  document.body.className = state.view === 'poster' ? 'posterMode' : '';
  app.innerHTML = `<div class="shell">
    ${topbar()}
    ${state.view === 'poster' ? '' : nav() + filters()}
    ${content()}
    <footer class="legend">AST = Atlantic Standard Time, UTC-4 · 1A = Group A winner · 2A = runner-up · 3A* = third place if among best eight · W = winner · L = loser</footer>
    ${modal()}
  </div>`;
}

app.addEventListener('click', (event) => {
  const viewBtn = event.target.closest('[data-view]');
  if (viewBtn) {
    state.view = viewBtn.dataset.view;
    render();
    return;
  }
  const matchBtn = event.target.closest('[data-match]');
  if (matchBtn) {
    state.selected = matches.find((m) => m.match_no === Number(matchBtn.dataset.match));
    render();
    return;
  }
  if (event.target.closest('[data-close]')) {
    state.selected = null;
    render();
  }
});

app.addEventListener('input', (event) => {
  if (event.target.id === 'search') {
    state.q = event.target.value;
    render();
  }
});

app.addEventListener('change', (event) => {
  if (event.target.id === 'stage') state.stage = event.target.value;
  if (event.target.id === 'group') state.group = event.target.value;
  render();
});

render();
