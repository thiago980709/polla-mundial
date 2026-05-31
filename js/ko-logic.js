// ================================================================
// KNOCKOUT PHASE LOGIC
// ================================================================

function getPhaseIdByMatchNumber(matchNumber) {
  if (matchNumber >= 73 && matchNumber <= 88) return 'r32';
  if (matchNumber >= 89 && matchNumber <= 96) return 'r16';
  if (matchNumber >= 97 && matchNumber <= 100) return 'qf';
  if (matchNumber >= 101 && matchNumber <= 102) return 'sf';
  if (matchNumber === 103) return 'tp';
  if (matchNumber === 104) return 'final';
  return null;
}

function getPhaseMatchIndex(matchNumber) {
  const phase = getPhaseIdByMatchNumber(matchNumber);
  if (!phase) return -1;
  const start = { r32:73, r16:89, qf:97, sf:101, tp:103, final:104 }[phase];
  return phase === 'tp' || phase === 'final' ? 0 : matchNumber - start;
}

function getKoMatchNumber(phaseId, mi) {
  if (phaseId === 'r32') return 73 + mi;
  if (phaseId === 'r16') return 89 + mi;
  if (phaseId === 'qf') return 97 + mi;
  if (phaseId === 'sf') return 101 + mi;
  if (phaseId === 'tp') return 103;
  if (phaseId === 'final') return 104;
  return mi + 1;
}

function getKoMatchSourceLabel(phaseId, mi) {
  return (KO_MATCH_SOURCES[phaseId] || [])[mi] || '';
}

function getKoMatchWinner(rkey, data) {
  const h = data[rkey+'_h'];
  const a = data[rkey+'_a'];
  const ht = data[rkey+'_ht'] || '';
  const at = data[rkey+'_at'] || '';
  if (h === '' || a === '' || h == null || a == null) return '';
  const hi = parseInt(h, 10);
  const ai = parseInt(a, 10);
  if (isNaN(hi) || isNaN(ai)) return '';
  if (hi > ai) return ht;
  if (ai > hi) return at;
  // En todas las fases KO, si el partido termina empatado se define el ganador por penales.
  const ph = data[rkey+'_ph'];
  const pa = data[rkey+'_pa'];
  if (ph === '' || pa === '' || ph == null || pa == null) return '';
  const phi = parseInt(ph, 10);
  const pai = parseInt(pa, 10);
  if (isNaN(phi) || isNaN(pai)) return '';
  if (phi > pai) return ht;
  if (pai > phi) return at;
  return '';
}

function getKoMatchLoser(rkey, data) {
  const winner = getKoMatchWinner(rkey, data);
  const ht = data[rkey+'_ht'] || '';
  const at = data[rkey+'_at'] || '';
  if (!winner || !ht || !at) return '';
  return winner === ht ? at : ht;
}

function getKoMatchWinnerByNumber(matchNumber, data) {
  const phase = getPhaseIdByMatchNumber(matchNumber);
  if (!phase) return '';
  const idx = getPhaseMatchIndex(matchNumber);
  const rkey = `${phase}_${idx}`;
  return getKoMatchWinner(rkey, data);
}

function getKoMatchLoserByNumber(matchNumber, data) {
  const phase = getPhaseIdByMatchNumber(matchNumber);
  if (!phase) return '';
  const idx = getPhaseMatchIndex(matchNumber);
  const rkey = `${phase}_${idx}`;
  return getKoMatchLoser(rkey, data);
}

function getKoThirdSlots() {
  const slots = [];
  Object.entries(KO_TEAM_SOURCES).forEach(([phaseId, matches]) => {
    matches.forEach((match, mi) => {
      ['home', 'away'].forEach(side => {
        const token = match[side];
        if (token && token.type === 'third') {
          slots.push({ phaseId, mi, side, groups: token.groups });
        }
      });
    });
  });
  return slots;
}

function selectThirdTeam(groups, usedTeams) {
  const thirds = calcBest8Thirds();
  const qualified = new Map(thirds.map(t => [t.group, t.team]));
  for (const group of groups) {
    const team = qualified.get(group);
    if (team && !usedTeams.has(team)) return team;
  }
  for (const group of groups) {
    const standings = calcGroupStandings(group);
    const team = standings[2] && standings[2].pj > 0 ? standings[2].name : '';
    if (team && !usedTeams.has(team)) return team;
  }
  return '';
}

function getUsedThirdTeams(phaseId, mi, side, data) {
  const slots = getKoThirdSlots();
  const used = new Set();
  for (const slot of slots) {
    if (slot.phaseId === phaseId && slot.mi === mi && slot.side === side) break;
    const key = `${slot.phaseId}_${slot.mi}_${slot.side === 'home' ? 'ht' : 'at'}`;
    const currentValue = data && data[key] ? String(data[key]).trim() : '';
    if (currentValue) {
      used.add(currentValue);
      continue;
    }
    const selected = selectThirdTeam(slot.groups, used);
    if (selected) used.add(selected);
  }
  return used;
}

function getBestThirdCandidates(groups, usedTeams = new Set()) {
  const thirds = calcBest8Thirds();
  const qualified = new Map(thirds.map(t => [t.group, t.team]));
  const candidates = groups
    .map(g => qualified.get(g))
    .filter(Boolean)
    .filter(team => !usedTeams.has(team));
  if (candidates.length > 0) return Array.from(new Set(candidates));
  return groups
    .map(g => {
      const standings = calcGroupStandings(g);
      return standings[2] && standings[2].pj > 0 ? standings[2].name : '';
    })
    .filter(Boolean)
    .filter(team => !usedTeams.has(team));
}

function resolveKoToken(phaseId, mi, side) {
  const token = KO_TEAM_SOURCES[phaseId] && KO_TEAM_SOURCES[phaseId][mi] && KO_TEAM_SOURCES[phaseId][mi][side];
  if (!token) return { value:'', options: [], fixed:false };
  if (token.type === 'group') {
    const team = getGroupPlaceName(token.group, token.pos);
    const options = team ? [team] : GROUPS_DEF.find(g => g.id === token.group).teams.slice();
    return { value: team || '', options, fixed: !!team };
  }
  if (token.type === 'third') {
    const used = getUsedThirdTeams(phaseId, mi, side, WZ.ko);
    const options = getBestThirdCandidates(token.groups, used);
    if (options.length > 0) {
      return { value: options[0], options, fixed: true };
    }
    return { value: '', options: options, fixed: false };
  }
  if (token.type === 'match') {
    const team = getKoMatchWinnerByNumber(token.match, WZ.ko);
    return { value: team || '', options: team ? [team] : [], fixed: !!team };
  }
  if (token.type === 'loser') {
    const team = getKoMatchLoserByNumber(token.match, WZ.ko);
    return { value: team || '', options: team ? [team] : [], fixed: !!team };
  }
  return { value:'', options: [], fixed:false };
}

function getKoTeamConfig(phaseId, mi, side, currentValue) {
  const resolved = resolveKoToken(phaseId, mi, side);
  const value = resolved.value || currentValue || '';
  const options = resolved.options.length ? resolved.options : (currentValue ? [currentValue] : []);
  return { value, options, disabled: resolved.fixed && !!resolved.value };
}
