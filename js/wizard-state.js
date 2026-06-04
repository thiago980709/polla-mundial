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
  gameClosed: false,
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

function saveWizardProgressLocal() {
  const appState = loadAppState() || { players: [], data: {}, groupPlayerView: null, koPlayerView: null };
  const pid = playerDocId(WZ.name || '');
  if (!pid) return;
  let player = appState.players.find(p => p.id === pid || p.name.toLowerCase() === String(WZ.name).toLowerCase());
  if (!player) {
    player = { id: pid, name: WZ.name };
    appState.players.push(player);
  } else {
    player.id = pid;
    player.name = WZ.name;
  }
  appState.data[pid] = {
    groups: WZ.groups,
    ko: WZ.ko,
    champion: WZ.champion,
    locked: WZ.locked || false,
  };
  appState.groupPlayerView = pid;
  appState.koPlayerView = pid;
  if (typeof WZ.gameClosed === 'boolean') {
    appState.gameClosed = WZ.gameClosed;
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); } catch(e) {}
}

async function loadGameClosedState() {
  const appState = loadAppState() || {};
  let closed = !!appState.gameClosed;
  if (initFirebase()) {
    const fbData = await dbLoadGameState();
    if (fbData && typeof fbData.gameClosed === 'boolean') {
      closed = fbData.gameClosed;
      appState.gameClosed = closed;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); } catch(e) {}
    }
  }
  return closed;
}

function setG(key, val) {
  WZ.groups[key] = val;
  saveWizardProgressLocal();
}

function setKO(key, val) {
  WZ.ko[key] = val;
  saveWizardProgressLocal();
  if (key.endsWith('_h') || key.endsWith('_a')) {
    const rkey = key.split('_').slice(0, -1).join('_');
    updateKoPenaltyVisibility(rkey);
  }
  // No rerender aquí para que el teclado y el foco no se cierren
  // mientras el usuario escribe resultados en las fases KO.
}

function updateKoPenaltyVisibility(rkey) {
  const el = document.getElementById(`pen-${rkey}`);
  if (!el) return;
  const h = WZ.ko[`${rkey}_h`];
  const a = WZ.ko[`${rkey}_a`];
  el.style.display = (h !== '' && a !== '' && h === a) ? 'flex' : 'none';
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
  if (typeof WZ.gameClosed === 'boolean') {
    appState.gameClosed = WZ.gameClosed;
  }

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); } catch(e) {}
  await dbSavePlayer();
}
