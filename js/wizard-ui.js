// ================================================================
// WIZARD UI RENDERING
// ================================================================

function render() {
  const app = document.getElementById('app');
  const hp = document.getElementById('header-player');
  const fs = document.getElementById('firestore-status');
  hp.innerHTML = WZ.name ? `Jugador: <strong>${escHtml(WZ.name)}</strong>` : '';
  if (fs) fs.textContent = firestoreStatus;

  if (WZ.gameClosed) { renderClosed(app); return; }
  if (stepIdx === -1) { renderWelcome(app); return; }
  if (stepIdx <= 11)  { renderGroup(app, stepIdx); return; }
  if (stepIdx <= 17)  { renderKO(app, stepIdx-12); return; }
  if (stepIdx === 18) { renderChamp(app); return; }
  renderDone(app);
}

function renderClosed(app) {
  app.innerHTML = `
  <div class="welcome-card">
    <div class="welcome-hero">
      <div class="trophy">🚫</div>
      <h2>Juego cerrado</h2>
      <p>El juego ya se cerró y no se puede ingresar.</p>
    </div>
    <div class="welcome-body">
      <button class="btn btn-danger" onclick="window.location.reload()">Actualizar estado</button>
    </div>
  </div>`;
}

function renderWelcome(app) {
  app.innerHTML = `
  <div class="welcome-card">
    <div class="welcome-hero">
      <div class="trophy">🏆</div>
      <h2>Bienvenida</h2>
      <p>Realiza tus predicciones para el <strong>Mundial 2026</strong></p>
    </div>
    <div class="welcome-body">
      <label>Ingresa tu nombre</label>
      <input type="text" id="player-name-inp" class="welcome-input" placeholder="Tu nombre">
      <div class="welcome-rules">
        <div class="rule-item"><span class="rule-pts">3</span>Marcador Exacto<br><small>Aciertas el resultado exacto</small></div>
        <div class="rule-item"><span class="rule-pts">2</span>Vencedor / Ganador<br><small>Aciertas quién gana</small></div>
        <div class="rule-item"><span class="rule-pts">1</span>Empate Acertado<br><small>Predijiste el empate</small></div>
        <div class="rule-item"><span class="rule-pts">5</span>Clasificados en Orden<br><small>Los 2 del grupo en el orden correcto</small></div>
        <div class="rule-item"><span class="rule-pts">3</span>Clasificados sin Orden<br><small>Los 2 del grupo en cualquier orden</small></div>
        <div class="rule-item"><span class="rule-pts">1</span>Tercer Puesto<br><small>Acertar cada tercero que pasa a octavos</small></div>
        <div class="rule-item"><span class="rule-pts">3</span>Marcador Eliminatoria<br><small>Resultado exacto en llaves</small></div>
        <div class="rule-item"><span class="rule-pts">2</span>Vencedor Eliminatoria<br><small>Quién avanza en las llaves</small></div>
        <div class="rule-item"><span class="rule-pts">10</span>Campeón<br><small>Aciertas el campeón del mundo</small></div>
      </div>
      <button class="btn" onclick="startWizard()">Comenzar</button>
    </div>
  </div>`;
  const inp = document.getElementById('player-name-inp');
  if (inp) inp.focus();
}

async function startWizard() {
  const inp = document.getElementById('player-name-inp');
  const name = inp ? inp.value.trim() : WZ.name;
  if (!name) { alert('Por favor ingresa tu nombre'); return; }
  WZ.name = name;
  WZ.pid = playerDocId(name);
  const closed = await loadGameClosedState();
  if (closed) { alert('El juego ya se cerró'); return; }
  const appState = loadAppState();
  const localState = appState?.data?.[WZ.pid] || {};
  initFirebase();

  let loadedState = localState;
  if (firestoreEnabled) {
    const fbData = await dbLoadPlayer(name);
    if (fbData) loadedState = { ...loadedState, ...fbData };
  }
  if (loadedState) {
    WZ.groups = loadedState.groups || {};
    WZ.ko = loadedState.ko || {};
    WZ.champion = loadedState.champion || '';
    WZ.locked = loadedState.locked || false;
  }

  stepIdx = WZ.locked ? 19 : 0;
  render();
}

function renderGroup(app, gi) {
  const g = GROUPS_DEF[gi];
  const matches = buildMatches(g.teams);
  const standings = calcGroupStandings(g.id);
  const hasScores = standings.some(r => r.pj > 0);
  const locked = WZ.locked;
  const disabledAttr = locked ? ' disabled' : '';
  const matchRows = matches.map((m, mi) => {
    const rkey = `${g.id}_${mi}`;
    const h = WZ.groups[rkey+'_h'] || '';
    const a = WZ.groups[rkey+'_a'] || '';
    return `<div class="match-row">
      <span class="team-name">${m.home}</span>
      <div class="score-group">
        <input type="number" min="0" max="99" class="score-inp" value="${h}"${disabledAttr} oninput="setG('${rkey}_h',this.value);refreshStd('std-${g.id}','${g.id}')">
        <span class="score-sep">–</span>
        <input type="number" min="0" max="99" class="score-inp" value="${a}"${disabledAttr} oninput="setG('${rkey}_a',this.value);refreshStd('std-${g.id}','${g.id}')">
      </div>
      <span class="team-name right">${m.away}</span>
    </div>`;
  }).join('');
  
  const stdHtml = buildStdTable(g.id);
  const isLast = gi === 11;
  
  app.innerHTML = `
  ${renderProgress()}
  <div class="step-card">
    <div class="step-card-header">
      <div class="step-icon">⚽</div>
      <div>
        <div class="step-title">Grupo ${g.id}</div>
        <div class="step-sub">6 partidos</div>
      </div>
    </div>
    <div class="step-body">
      ${matchRows}
      <div class="standings-mini" id="std-${g.id}">${stdHtml}</div>
    </div>
  </div>
  <div class="nav-btns">
    <button class="btn btn-ghost" onclick="saveWizardProgressLocal(); stepIdx--; render()">← Anterior</button>
    <button class="btn" onclick="saveWizardProgressLocal(); stepIdx++; render()">Siguiente →</button>
  </div>`;
}

function buildStdTable(gid) {
  const s = calcGroupStandings(gid);
  const hasAny = s.some(r => r.pj > 0);
  if (!hasAny) return `<h4>Clasificación del Grupo ${gid}</h4><div style="font-size:0.75rem;color:var(--muted);padding:4px 0;">Introduce marcadores para ver la tabla</div>`;
  const posClass = ['pos-1','pos-2','pos-3',''];
  const rows = s.map((r,i) => `<tr>
    <td class="${posClass[i]}">${i+1}</td>
    <td class="std-team">${r.name}</td>
    <td><span class="std-pts-val">${r.pts}</span></td>
    <td>${r.pj}</td>
    <td>${r.pg}</td>
    <td>${r.pe}</td>
    <td>${r.pp}</td>
    <td>${r.gf}</td>
    <td>${r.gc}</td>
    <td><span class="std-gd ${r.gd>=0?'pos':'neg'}">${r.gd>0?'+':''}${r.gd}</span></td>
  </tr>`).join('');
  return `<h4>Clasificación del Grupo ${gid}</h4>
  <table class="std-table">
    <thead><tr><th>Pos</th><th>Equipo</th><th>Pts</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>GD</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function refreshStd(containerId, gid) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = buildStdTable(gid);
}

function renderKO(app, phaseIdx) {
  const phase = KO_PHASES[phaseIdx];
  const mc = phase.count / 2;
  const icons = ['🥊','⚡','🔥','🎖️','🏆','🏁'];
  
  const renderTeamOptions = (opts, value) => {
    const unique = Array.from(new Set(opts.filter(Boolean)));
    const list = unique.length ? unique : [''];
    return `<option value="">— Equipo —</option>` + list.map(t => `<option value="${t}"${t===value?' selected':''}>${t || '— Pendiente —'}</option>`).join('');
  };
  
  const locked = WZ.locked;
  const disabledAttr = locked ? ' disabled' : '';
  const matchCards = Array.from({length:mc}, (_,mi) => {
    const rk = `${phase.id}_${mi}`;
    const ph = WZ.ko[rk+'_h'] ?? '';
    const pa = WZ.ko[rk+'_a'] ?? '';
    const pht = WZ.ko[rk+'_ht'] || '';
    const pat = WZ.ko[rk+'_at'] || '';
    const homeConfig = getKoTeamConfig(phase.id, mi, 'home', pht);
    const awayConfig = getKoTeamConfig(phase.id, mi, 'away', pat);
    const matchNum = getKoMatchNumber(phase.id, mi);
    const sourceLabel = getKoMatchSourceLabel(phase.id, mi);
    const drawPred = ph !== '' && pa !== '' && ph === pa;
    const penaltyPredH = WZ.ko[rk+'_ph'] ?? '';
    const penaltyPredA = WZ.ko[rk+'_pa'] ?? '';

    const resolvedHome = homeConfig.value || pht;
    const resolvedAway = awayConfig.value || pat;
    if (resolvedHome && WZ.ko[rk+'_ht'] !== resolvedHome) WZ.ko[rk+'_ht'] = resolvedHome;
    if (resolvedAway && WZ.ko[rk+'_at'] !== resolvedAway) WZ.ko[rk+'_at'] = resolvedAway;

    const penaltyHtml = `
      <div id="pen-${rk}" style="display:${drawPred ? 'flex' : 'none'};align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap;">
        <div style="font-size:0.75rem;color:#3B82F6;letter-spacing:1px;min-width:90px;">Penales</div>
        <input type="number" min="0" max="99" class="score-inp" style="width:46px;" value="${penaltyPredH}"${disabledAttr} onchange="setKO('${rk}_ph',this.value)" placeholder="0">
        <span class="score-sep">–</span>
        <input type="number" min="0" max="99" class="score-inp" style="width:46px;" value="${penaltyPredA}"${disabledAttr} onchange="setKO('${rk}_pa',this.value)" placeholder="0">
      </div>`;

    return `<div class="ko-match">
      <div class="ko-match-num">Partido ${matchNum}</div>
      ${sourceLabel ? `<div style="font-size:0.75rem;color:var(--muted);margin-bottom:8px;">${sourceLabel}</div>` : ''}
      <div class="ko-row">
        <select class="ko-select" ${homeConfig.disabled || locked ? 'disabled' : ''} onchange="setKO('${rk}_ht',this.value)">${renderTeamOptions(homeConfig.options, homeConfig.value)}</select>
        <input type="number" min="0" max="99" class="score-inp" value="${ph}"${disabledAttr} oninput="setKO('${rk}_h',this.value)" placeholder="0">
        <span class="score-sep">–</span>
        <input type="number" min="0" max="99" class="score-inp" value="${pa}"${disabledAttr} oninput="setKO('${rk}_a',this.value)" placeholder="0">
        <select class="ko-select" ${awayConfig.disabled || locked ? 'disabled' : ''} onchange="setKO('${rk}_at',this.value)">${renderTeamOptions(awayConfig.options, awayConfig.value)}</select>
      </div>
      ${penaltyHtml}
    </div>`;
  }).join('');
  
  const nextLabels = ['Octavos de Final →','Cuartos de Final →','Semifinales →','3° y 4° Puesto →','Final →','Campeón del Mundo →'];
  
  app.innerHTML = `
  ${renderProgress()}
  <div class="step-card">
    <div class="step-card-header">
      <div class="step-icon">${icons[phaseIdx]}</div>
      <div>
        <div class="step-title">${phase.label}</div>
        <div class="step-sub">${mc} partido${mc!==1?'s':''} · 3 pts exacto · 2 pts vencedor</div>
      </div>
    </div>
    <div class="step-body">
      <div class="info-box">Selecciona los <strong>equipos</strong> que crees que jugarán y escribe el <strong>marcador predicho</strong>. Si el partido termina empatado, indica también el resultado de penales.</div>
      ${matchCards}
    </div>
  </div>
  <div class="nav-btns">
    <button class="btn btn-ghost" onclick="saveWizardProgressLocal(); stepIdx--; render()">← Anterior</button>
    <button class="btn" onclick="saveWizardProgressLocal(); stepIdx++; render()">${nextLabels[phaseIdx]}</button>
  </div>`;
}

function renderChamp(app) {
  const champ = WZ.champion || '';
  const opts = `<option value="">— Elige el Campeón del Mundo —</option>` +
    GROUPS_DEF.flatMap(g => g.teams).map(t => `<option value="${t}"${t===champ?' selected':''}>${t}</option>`).join('');
  
  const locked = WZ.locked ? ' disabled' : '';
  app.innerHTML = `
  ${renderProgress()}
  <div class="step-card">
    <div class="step-card-header">
      <div class="step-icon">🏆</div>
      <div>
        <div class="step-title">Campeón del Mundo</div>
        <div class="step-sub">10 puntos si aciertas</div>
      </div>
    </div>
    <div class="step-body">
      <select class="champ-select" id="champ-display"${locked} onchange="WZ.champion=this.value;renderChampDisplay()">${opts}</select>
    </div>
  </div>
  <div class="nav-btns">
    <button class="btn btn-ghost" onclick="saveWizardProgressLocal(); stepIdx--; render()">← Anterior</button>
    <button class="btn" onclick="finishAndDone()">Terminar →</button>
  </div>`;
  renderChampDisplay();
}

function renderChampDisplay() {
  const el = document.getElementById('champ-display');
  if (el && WZ.champion) {
    el.value = WZ.champion;
  }
}

async function finishAndDone() {
  WZ.locked = true;
  await saveToApp();
  stepIdx = 19;
  render();
}

function renderDone(app) {
  const thirds = calcBest8Thirds();
  const groupMatches = GROUPS_DEF.reduce((s,g) => s + buildMatches(g.teams).length, 0);
  const filledGroup = Object.keys(WZ.groups).filter(k => k.endsWith('_h') && WZ.groups[k] !== '').length;
  const filledKO = Object.keys(WZ.ko).filter(k => k.endsWith('_h') && WZ.ko[k] !== '').length;
  
  const groupSummaryRows = GROUPS_DEF.map(g => {
    const s = calcGroupStandings(g.id);
    return `<tr><td>${g.id}</td><td>${s[0]?.name || '–'}</td><td>${s[1]?.name || '–'}</td></tr>`;
  }).join('');
  
  const thirdsHtml = thirds.length > 0
    ? thirds.map((t,i) => `<div class="third-row"><div class="third-num">${i+1}</div><div class="third-info"><div class="third-team">${t.team}</div><div class="third-meta">Grupo ${t.group}</div></div></div>`).join('')
    : '<p style="color:var(--muted);font-size:0.85rem;">Sin terceros clasificados</p>';
  
  app.innerHTML = `
  <div style="text-align:center;margin-bottom:24px;">
    <div class="trophy" style="font-size:4rem;margin-bottom:12px;">🎉</div>
    <h2 style="font-family:'Bebas Neue';font-size:1.8rem;color:var(--gold);letter-spacing:2px;">¡Predicciones Completadas!</h2>
  </div>
  
  <div class="summary-grid">
    <div class="summary-item"><div class="summary-val">${filledGroup}/${groupMatches}</div><div class="summary-lbl">Partidos</div></div>
    <div class="summary-item"><div class="summary-val">${filledKO}/32</div><div class="summary-lbl">KO</div></div>
    <div class="summary-item"><div class="summary-val">${thirds.length}/8</div><div class="summary-lbl">Terceros</div></div>
    <div class="summary-item"><div class="summary-val">${WZ.champion ? '✓' : '–'}</div><div class="summary-lbl">Campeón</div></div>
  </div>
  
  ${WZ.champion ? `<div style="background:rgba(245,166,35,0.08);border:2px solid rgba(245,166,35,0.3);border-radius:10px;padding:14px;text-align:center;margin-bottom:18px;">
    <div style="font-family:'Bebas Neue';font-size:1.2rem;color:var(--gold);letter-spacing:2px;margin-bottom:6px;">🏆 TU CAMPEÓN</div>
    <div style="font-size:1.1rem;color:var(--text);">${WZ.champion}</div>
  </div>` : ''}
  
  <div style="background:var(--blue-panel);border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:16px;">
    <h4 style="font-size:0.75rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:10px;">Clasificados de Grupos</h4>
    <table class="std-table">${groupSummaryRows}</table>
  </div>
  
  <div style="background:var(--blue-panel);border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:20px;">
    <h4 style="font-size:0.75rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:10px;">Mejores Terceros</h4>
    <div class="thirds-list">${thirdsHtml}</div>
  </div>
  
  <div style="display:flex;flex-direction:column;gap:10px;">
    <button class="btn" onclick="downloadMyPDF()">⬇️ Descargar mi PDF de predicciones</button>
    <button class="btn btn-ghost" onclick="location.reload()">↻ Volver al inicio</button>
  </div>`;
}
