// ================================================================
// WIZARD STATE AND MANAGEMENT
// ================================================================

const WZ = {
  name: '',
  pid: null,
  step: 'welcome',
  groups: {},
  ko: {},
  champion: '',
  locked: false,
};

let stepIdx = -1;
const TOTAL_STEPS = 20;

function currentStepLabel() {
  if (stepIdx < 0) return 'Bienvenida';
  if (stepIdx <= 11) return `Grupo ${GROUPS_DEF[stepIdx].id}`;
  if (stepIdx <= 17) return KO_PHASES[stepIdx-12].label;
  if (stepIdx === 18) return 'Campeón';
  return '¡Completado!';
}

function progressPct() {
  if (stepIdx < 0) return 0;
  return Math.round(((stepIdx+1) / TOTAL_STEPS) * 100);
}

function renderProgress() {
  if (stepIdx < 0) return '';
  const pct = progressPct();
  const dots = Array.from({length: TOTAL_STEPS}, (_,i) => {
    const cls = i < stepIdx ? 'done' : (i === stepIdx ? 'active' : '');
    return `<div class="dot ${cls}"></div>`;
  }).join('');
  return `<div class="progress-wrap">
    <div class="progress-label"><span>Paso ${stepIdx+1}/${TOTAL_STEPS}</span><span>${pct}% completado</span></div>
    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
    <div class="step-dots">${dots}</div>
  </div>`;
}

function setG(key, val) {
  WZ.groups[key] = val;
}

function setKO(key, val) {
  WZ.ko[key] = val;
  if (stepIdx >= 12 && stepIdx <= 17) render();
}

async function saveToApp() {
  let appState = loadAppState();
  if (!appState) {
    appState = { players: [], data: {}, groupPlayerView: null, koPlayerView: null };
  }
  const pid = playerDocId(WZ.name);
  let player = appState.players.find(p => p.name.toLowerCase() === WZ.name.toLowerCase());
  if (!player) {
    player = { id: pid, name: WZ.name };
    appState.players.push(player);
  } else if (player.id !== pid) {
    player.id = pid;
  }
  WZ.pid = player.id;

  const classif = {};
  GROUPS_DEF.forEach(g => {
    const s = calcGroupStandings(g.id);
    if (s[0].pj > 0) { classif[g.id+'_1'] = s[0].name; classif[g.id+'_2'] = s[1].name; }
  });

  const thirds = {};
  calcBest8Thirds().forEach((t,i) => { thirds['t'+i] = t.team; });

  appState.data[player.id] = {
    groups: WZ.groups,
    classif: classif,
    thirds: thirds,
    ko: WZ.ko,
    champion: WZ.champion,
    locked: WZ.locked || false,
  };
  appState.groupPlayerView = player.id;
  appState.koPlayerView = player.id;

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); } catch(e) {}
  await dbSavePlayer();
}
