// ================================================================
// STANDINGS AND THIRDS CALCULATION
// ================================================================

function buildMatches(teams) {
  const m = [];
  for (let i=0; i<teams.length; i++) {
    for (let j=i+1; j<teams.length; j++) {
      m.push({ home: teams[i], away: teams[j] });
    }
  }
  return m;
}

function calcGroupStandings(gid) {
  const teams = GROUPS_DEF.find(g => g.id === gid).teams;
  const matches = buildMatches(teams);
  const table = {};
  teams.forEach(t => { table[t] = { pts:0, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, gd:0 }; });

  matches.forEach((m, mi) => {
    const rkey = `${gid}_${mi}`;
    const h = WZ.groups[rkey+'_h'];
    const a = WZ.groups[rkey+'_a'];
    if (h === '' || h == null || a === '' || a == null) return;
    const hi = parseInt(h, 10), ai = parseInt(a, 10);
    if (isNaN(hi) || isNaN(ai)) return;
    table[m.home].pj++; table[m.home].gf += hi; table[m.home].gc += ai;
    table[m.away].pj++; table[m.away].gf += ai; table[m.away].gc += hi;
    table[m.home].gd = table[m.home].gf - table[m.home].gc;
    table[m.away].gd = table[m.away].gf - table[m.away].gc;
    if (hi > ai) { table[m.home].pts += 3; table[m.home].pg++; table[m.away].pp++; }
    else if (ai > hi) { table[m.away].pts += 3; table[m.away].pg++; table[m.home].pp++; }
    else { table[m.home].pts++; table[m.home].pe++; table[m.away].pts++; table[m.away].pe++; }
  });

  return Object.entries(table).sort((a,b) =>
    b[1].pts !== a[1].pts ? b[1].pts - a[1].pts :
    b[1].gd !== a[1].gd ? b[1].gd - a[1].gd :
    b[1].gf !== a[1].gf ? b[1].gf - a[1].gf : a[0].localeCompare(b[0])
  ).map(([name, s]) => ({ name, ...s }));
}

function calcBest8Thirds() {
  const thirds = GROUPS_DEF.map(g => {
    const s = calcGroupStandings(g.id);
    return { team: s[2].name, pts: s[2].pts, gd: s[2].gd, gf: s[2].gf, group: g.id };
  }).filter(Boolean);
  thirds.sort((a,b) => b.pts!==a.pts?b.pts-a.pts : b.gd!==a.gd?b.gd-a.gd : b.gf-a.gf);
  return thirds.slice(0,8);
}

function getGroupPlaceName(gid, pos) {
  const standings = calcGroupStandings(gid);
  return standings[pos-1] && standings[pos-1].pj > 0 ? standings[pos-1].name : '';
}

function getBestThirdCandidates(groups) {
  const thirds = calcBest8Thirds();
  const qualified = new Map(thirds.map(t => [t.group, t.team]));
  const candidates = groups
    .filter(g => qualified.has(g))
    .map(g => qualified.get(g))
    .filter(Boolean);
  if (candidates.length > 0) return Array.from(new Set(candidates));
  return groups
    .map(g => {
      const standings = calcGroupStandings(g);
      return standings[2] && standings[2].pj > 0 ? standings[2].name : '';
    })
    .filter(Boolean);
}
