// ================================================================
// PDF GENERATION - VERSIÓN MEJORADA
// ================================================================
// Usa solo fuentes estándar de jsPDF para evitar símbolos raros.
// Diseño fiel al PDF de ejemplo: fondo oscuro, tarjetas por grupo,
// tablas de posiciones, fases KO con marcadores.

function downloadMyPDF() {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⏳ Generando PDF...';

  function loadScript(src, cb) {
    const s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', () => {
    try {
      generatePlayerPDF();
    } catch(e) {
      console.error('Error generando PDF:', e);
      alert('Hubo un error generando el PDF. Ver consola para detalles.');
    }
    btn.disabled = false;
    btn.textContent = '⬇️ Descargar mi PDF de predicciones';
  });
}

function generatePlayerPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ─── Dimensiones ───────────────────────────────────────────────
  const W = 210, H = 297;
  const mg = 10;          // margen lateral
  const cW = W - mg * 2;  // ancho de contenido

  // ─── Paleta de colores ─────────────────────────────────────────
  const C = {
    bg:     [10,  14,  26],   // fondo página (azul muy oscuro)
    panel:  [17,  27,  48],   // fondo tarjetas
    border: [35,  52,  80],   // bordes
    gold:   [245, 166, 35],   // dorado (títulos principales)
    text:   [232, 238, 247],  // texto normal (blanco azulado)
    muted:  [122, 139, 170],  // texto secundario
    green:  [6,   167, 125],  // verde acento
    white:  [255, 255, 255],
    dark:   [10,  14,  26],
    red:    [220, 60,  60],
  };

  // ─── Helpers de color ──────────────────────────────────────────
  const sf = (c) => doc.setFillColor(...c);
  const sd = (c) => doc.setDrawColor(...c);
  const st = (c) => doc.setTextColor(...c);
  const lw = (w) => doc.setLineWidth(w);

  // ─── Helpers de tipografía (solo fuentes estándar jsPDF) ───────
  // Fuentes seguras: 'helvetica', 'courier', 'times'
  // Estilos: 'normal', 'bold', 'italic', 'bolditalic'
  const font = (name, style, size) => {
    doc.setFont(name, style);
    doc.setFontSize(size);
  };

  // ─── Estado de paginación ──────────────────────────────────────
  let y = 0;
  let pageNum = 0;

  function fillPageBg() {
    sf(C.bg);
    doc.rect(0, 0, W, H, 'F');
  }

  function newPage() {
    pageNum++;
    if (pageNum > 1) doc.addPage();
    fillPageBg();
    y = mg;
  }

  function checkY(needed) {
    if (y + needed > H - mg) newPage();
  }

  // ─── Componentes de diseño ─────────────────────────────────────

  /** Barra de sección (fondo dorado, texto oscuro) */
  function sectionBar(title) {
    checkY(11);
    sf(C.gold);
    sd(C.gold);
    lw(0);
    doc.rect(mg, y, cW, 9, 'F');
    st(C.dark);
    font('helvetica', 'bold', 9);
    doc.text(title.toUpperCase(), mg + 3, y + 6.3);
    y += 11;
  }

  /** Dibuja una línea horizontal separadora */
  function hline(color, thickness) {
    sd(color || C.border);
    lw(thickness || 0.3);
    doc.line(mg, y, mg + cW, y);
  }

  /**
   * Tarjeta de grupo completa: encabezado, partidos y tabla de posiciones.
   * La altura se calcula dinámicamente para que nada se tape.
   */
  function drawGroupCard(g) {
    const matches = buildMatches(g.teams);
    const standings = calcGroupStandings(g.id);

    // Recoge las filas de resultados con marcadores
    const matchRows = [];
    matches.forEach((m, mi) => {
      const rkey = `${g.id}_${mi}`;
      const h = WZ.groups[rkey + '_h'];
      const a = WZ.groups[rkey + '_a'];
      matchRows.push({
        home: m.home,
        away: m.away,
        gh: (h !== '' && h !== undefined) ? h : '-',
        ga: (a !== '' && a !== undefined) ? a : '-',
      });
    });

    // Alturas de cada sección (mm)
    const ROW_H   = 5.2;   // altura de fila partido / standing
    const HEAD_H  = 8;     // encabezado del grupo (nombre + equipos)
    const COL_H   = 6;     // cabecera de columna de tabla
    const PAD     = 2;     // padding interno top/bottom
    const MATCH_LABEL_H = 5;

    const totalH = PAD + HEAD_H + MATCH_LABEL_H + matchRows.length * ROW_H
                 + 2 + COL_H + standings.length * ROW_H + PAD + 2;

    checkY(totalH);

    const x0 = mg;
    const y0 = y;
    const cardW = cW;

    // Fondo de tarjeta
    sf(C.panel); sd(C.border); lw(0.4);
    doc.roundedRect(x0, y0, cardW, totalH, 2, 2, 'FD');

    let cy = y0 + PAD;

    // ── Encabezado del grupo ──────────────────────────────────────
    st(C.gold);
    font('helvetica', 'bold', 9.5);
    doc.text(`GRUPO ${g.id}`, x0 + 3, cy + 5.5);

    // Equipos del grupo (en gris, a la derecha)
    st(C.muted);
    font('helvetica', 'normal', 6.5);
    const teamsStr = g.teams.join('  ·  ');
    doc.text(teamsStr, x0 + 3, cy + HEAD_H - 1, { maxWidth: cardW - 6 });
    cy += HEAD_H;

    // ── Cabecera de partidos ──────────────────────────────────────
    hline(C.border, 0.3);
    cy += 1;
    st(C.muted);
    font('helvetica', 'bold', 6);
    doc.text('PARTIDOS', x0 + 3, cy + 4);
    doc.text('LOCAL', x0 + 45, cy + 4, { align: 'right' });
    doc.text('  -  ', x0 + 52, cy + 4, { align: 'center' });
    doc.text('VISITANTE', x0 + 60, cy + 4);
    cy += MATCH_LABEL_H;

    // ── Filas de partidos ─────────────────────────────────────────
    matchRows.forEach((m, i) => {
      const rowY = cy + i * ROW_H;

      // fondo alternado sutil
      if (i % 2 === 0) {
        sf([22, 34, 58]);
        doc.rect(x0 + 1, rowY - 0.5, cardW - 2, ROW_H, 'F');
      }

      st(C.text);
      font('helvetica', 'normal', 6.5);

      // Número de partido
      st(C.muted);
      doc.text(`${i + 1}.`, x0 + 3, rowY + 3.8);

      // Equipo local (derecha del campo 1)
      st(C.text);
      const homeText = truncate(m.home, 18);
      doc.text(homeText, x0 + 45, rowY + 3.8, { align: 'right' });

      // Marcador
      st(C.gold);
      font('helvetica', 'bold', 6.5);
      const scoreStr = `${m.gh} - ${m.ga}`;
      doc.text(scoreStr, x0 + 52, rowY + 3.8, { align: 'center' });

      // Equipo visitante
      st(C.text);
      font('helvetica', 'normal', 6.5);
      const awayText = truncate(m.away, 18);
      doc.text(awayText, x0 + 59, rowY + 3.8);
    });

    cy += matchRows.length * ROW_H + 2;

    // ── Tabla de posiciones ───────────────────────────────────────
    hline(C.border, 0.3);
    cy += 1;

    // Cabecera tabla
    sf(C.border);
    doc.rect(x0 + 1, cy - 0.5, cardW - 2, COL_H, 'F');

    st(C.gold);
    font('helvetica', 'bold', 6);
    const cols = { pos: x0+3, team: x0+10, pj: x0+68, pg: x0+76, pe: x0+84, pp: x0+92, gf: x0+100, gc: x0+108, dg: x0+116, pts: x0+124 };
    doc.text('#',   cols.pos,  cy + 4);
    doc.text('EQUIPO', cols.team, cy + 4);
    doc.text('PJ',  cols.pj,   cy + 4, { align: 'center' });
    doc.text('PG',  cols.pg,   cy + 4, { align: 'center' });
    doc.text('PE',  cols.pe,   cy + 4, { align: 'center' });
    doc.text('PP',  cols.pp,   cy + 4, { align: 'center' });
    doc.text('GF',  cols.gf,   cy + 4, { align: 'center' });
    doc.text('GC',  cols.gc,   cy + 4, { align: 'center' });
    doc.text('DG',  cols.dg,   cy + 4, { align: 'center' });
    doc.text('PTS', cols.pts,  cy + 4, { align: 'center' });
    cy += COL_H;

    // Filas de standings
    standings.forEach((s, i) => {
      const rowY = cy + i * ROW_H;

      if (i % 2 === 0) {
        sf([22, 34, 58]);
        doc.rect(x0 + 1, rowY - 0.5, cardW - 2, ROW_H, 'F');
      }

      // Resaltar clasificados (1° y 2°)
      if (i < 2) {
        sf([6, 80, 60]);
        doc.rect(x0 + 1, rowY - 0.5, 3, ROW_H, 'F');
      }

      st(C.text);
      font('helvetica', i < 2 ? 'bold' : 'normal', 6.5);

      doc.text(String(i + 1), cols.pos, rowY + 3.8);
      doc.text(truncate(s.team, 16), cols.team, rowY + 3.8);
      font('helvetica', 'normal', 6.5);
      doc.text(String(s.pj  ?? ''), cols.pj,  rowY + 3.8, { align: 'center' });
      doc.text(String(s.pg  ?? ''), cols.pg,  rowY + 3.8, { align: 'center' });
      doc.text(String(s.pe  ?? ''), cols.pe,  rowY + 3.8, { align: 'center' });
      doc.text(String(s.pp  ?? ''), cols.pp,  rowY + 3.8, { align: 'center' });
      doc.text(String(s.gf  ?? ''), cols.gf,  rowY + 3.8, { align: 'center' });
      doc.text(String(s.gc  ?? ''), cols.gc,  rowY + 3.8, { align: 'center' });

      // Diferencia de goles con color
      const dg = s.dg ?? 0;
      st(dg > 0 ? C.green : dg < 0 ? C.red : C.muted);
      doc.text((dg > 0 ? '+' : '') + dg, cols.dg, rowY + 3.8, { align: 'center' });

      st(C.gold);
      font('helvetica', 'bold', 6.5);
      doc.text(String(s.pts ?? ''), cols.pts, rowY + 3.8, { align: 'center' });
    });

    cy += standings.length * ROW_H + PAD;
    y = y0 + totalH + 4; // espacio entre tarjetas
  }

  /**
   * Sección de los mejores terceros clasificados.
   */
  function drawThirdsSection() {
    const thirds = calcBest8Thirds();
    if (!thirds || thirds.length === 0) return;

    sectionBar('Mejores 8 Terceros Clasificados');

    const cardH = 14;
    const colW  = cW / 4;

    // 2 filas de 4
    [0, 4].forEach(start => {
      checkY(cardH + 2);
      const rowY = y;

      thirds.slice(start, start + 4).forEach((t, i) => {
        const cx = mg + i * colW;
        sf(C.panel); sd(C.border); lw(0.3);
        doc.rect(cx, rowY, colW - 1, cardH, 'FD');

        st(C.gold);
        font('helvetica', 'bold', 7);
        const ordinal = start + i + 1;
        doc.text(`${ordinal}° CLASIFICADO`, cx + (colW - 1) / 2, rowY + 4.5, { align: 'center' });

        st(C.text);
        font('helvetica', 'bold', 7.5);
        doc.text(truncate(t.team, 14), cx + (colW - 1) / 2, rowY + 9, { align: 'center' });

        st(C.muted);
        font('helvetica', 'normal', 5.5);
        doc.text(`Gpo ${t.group} · ${t.pts ?? 0}pts · DG${t.dg >= 0 ? '+' : ''}${t.dg ?? 0}`, cx + (colW - 1) / 2, rowY + 12.5, { align: 'center' });
      });

      y = rowY + cardH + 3;
    });
  }

  /**
   * Renderiza una fase KO con partidos en 2 columnas.
   * Cada partido muestra los dos equipos y el marcador estilo el PDF de ejemplo.
   */
  function drawKoPhase(phase, phaseIdx) {
    const mc = phase.count / 2; // número de partidos
    const LABELS = ['16AVOS DE FINAL','OCTAVOS DE FINAL','CUARTOS DE FINAL','SEMIFINALES','TERCER Y CUARTO PUESTO','FINAL'];
    sectionBar(LABELS[phaseIdx] || phase.label);

    const MATCH_H = 22;   // altura de cada tarjeta de partido
    const COLS    = 2;    // columnas por fila
    const colW    = (cW - (COLS - 1) * 2) / COLS;

    for (let mi = 0; mi < mc; mi++) {
      const col = mi % COLS;
      const isFirst = col === 0;

      if (isFirst) checkY(MATCH_H + 2);

      const cx = mg + col * (colW + 2);
      const cy = y;

      const rk = `${phase.id}_${mi}`;

      // Los goles se guardan en _h / _a
      const goalH = WZ.ko[rk + '_h'];
      const goalA = WZ.ko[rk + '_a'];
      const hasScore = goalH !== '' && goalH !== undefined && goalH !== null
                    && goalA !== '' && goalA !== undefined && goalA !== null;

      // Los nombres de equipo se obtienen de la función que usa el juego para
      // resolver qué equipo va en cada slot KO. La intentamos con varias claves
      // comunes que el proyecto puede usar, con fallback seguro.
      let homeName = WZ.ko[rk + '_ht']
                  || WZ.ko[rk + '_home']
                  || WZ.ko[rk + '_team_h']
                  || WZ.ko[rk + '_nameH']
                  || (typeof getKoTeamName === 'function' ? getKoTeamName(phase.id, mi, 'h') : '')
                  || (typeof resolveKoTeam === 'function' ? resolveKoTeam(phase.id, mi, 0) : '')
                  || '???';

      let awayName = WZ.ko[rk + '_at']
                  || WZ.ko[rk + '_away']
                  || WZ.ko[rk + '_team_a']
                  || WZ.ko[rk + '_nameA']
                  || (typeof getKoTeamName === 'function' ? getKoTeamName(phase.id, mi, 'a') : '')
                  || (typeof resolveKoTeam === 'function' ? resolveKoTeam(phase.id, mi, 1) : '')
                  || '???';

      // Si homeName/awayName son números (goles guardados por error en esa clave),
      // los descartamos para no duplicar el marcador
      if (!isNaN(Number(homeName)) && homeName !== '???') homeName = '???';
      if (!isNaN(Number(awayName)) && awayName !== '???') awayName = '???';

      const matchNum = getKoMatchNumber(phase.id, mi);

      // Fondo de la tarjeta
      sf(C.panel); sd(C.border); lw(0.4);
      doc.roundedRect(cx, cy, colW, MATCH_H, 1.5, 1.5, 'FD');

      // Número de partido (centrado arriba)
      st(C.muted);
      font('helvetica', 'bold', 5.5);
      doc.text(`PARTIDO ${matchNum}`, cx + colW / 2, cy + 4.5, { align: 'center' });

      // Línea separadora entre los dos equipos
      sd(C.border); lw(0.2);
      doc.line(cx + 2, cy + 12.5, cx + colW - 2, cy + 12.5);

      // Equipo local: nombre izquierda, gol derecha
      st(C.text);
      font('helvetica', 'bold', 6.5);
      doc.text(truncate(homeName, 17), cx + 3, cy + 10);
      if (hasScore) {
        st(C.gold);
        font('helvetica', 'bold', 7.5);
        doc.text(String(goalH), cx + colW - 3, cy + 10, { align: 'right' });
      }

      // Equipo visitante: nombre izquierda, gol derecha
      st(C.text);
      font('helvetica', 'bold', 6.5);
      doc.text(truncate(awayName, 17), cx + 3, cy + 18.5);
      if (hasScore) {
        st(C.gold);
        font('helvetica', 'bold', 7.5);
        doc.text(String(goalA), cx + colW - 3, cy + 18.5, { align: 'right' });
      }

      // Avanzar fila cuando la columna derecha se llena
      if (col === COLS - 1 || mi === mc - 1) {
        y += MATCH_H + 3;
      }
    }
  }

  // ─── Utilidades ───────────────────────────────────────────────

  /** Trunca un string con puntos suspensivos si es muy largo */
  function truncate(str, maxLen) {
    if (!str) return '';
    str = String(str);
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '.' : str;
  }

  // ─── GENERACIÓN DEL PDF ───────────────────────────────────────

  // ── PÁGINA 1: PORTADA ──────────────────────────────────────────
  newPage();

  // Fondo degradado simulado con rectángulos
  sf(C.bg);
  doc.rect(0, 0, W, H, 'F');

  // Franja decorativa dorada superior
  sf(C.gold);
  doc.rect(0, 0, W, 3, 'F');

  // Título principal
  st(C.gold);
  font('helvetica', 'bold', 30);
  doc.text('POLLA MUNDIAL 2026', W / 2, 45, { align: 'center' });

  // Subtítulo
  st(C.muted);
  font('helvetica', 'normal', 11);
  doc.text('PREDICCIONES PERSONALES', W / 2, 56, { align: 'center' });

  // Nombre del jugador
  st(C.text);
  font('helvetica', 'bold', 16);
  doc.text((WZ.name || 'Jugador').toUpperCase(), W / 2, 70, { align: 'center' });

  // Separador
  sf(C.gold); lw(0);
  doc.rect(mg + 30, 76, cW - 60, 1, 'F');

  // Campeón predicho
  if (WZ.champion) {
    // Caja del campeón
    sf(C.panel); sd(C.gold); lw(0.8);
    doc.roundedRect(mg + 20, 85, cW - 40, 38, 3, 3, 'FD');

    st(C.gold);
    font('helvetica', 'bold', 8);
    doc.text('CAMPEON PREDICHO', W / 2, 97, { align: 'center' });

    st(C.muted);
    font('helvetica', 'normal', 7);
    doc.text('Vale 10 puntos si acierta', W / 2, 103, { align: 'center' });

    st(C.text);
    font('helvetica', 'bold', 16);
    doc.text(WZ.champion.toUpperCase(), W / 2, 120, { align: 'center' });
  }

  // Instrucciones / leyenda en la portada
  // Este bloque muestra las reglas de puntaje en el PDF.
  // Mantén estas reglas sincronizadas con la pestaña Reglas del admin y la función de puntaje.
  sf(C.panel); sd(C.border); lw(0.4);
  doc.roundedRect(mg, 145, cW, 60, 2, 2, 'FD');
  st(C.gold);
  font('helvetica', 'bold', 8);
  doc.text('SISTEMA DE PUNTUACION', mg + 4, 153);
  st(C.text);
  font('helvetica', 'normal', 6.5);
  const puntos = [
    'Fase de grupos (resultado exacto): 3 pts',
    'Fase de grupos (vencedor/ganador): 2 pts',
    'Fase de grupos (empate acertado): 1 pt',
    'Clasificados en orden: 5 pts',
    'Clasificados sin orden: 3 pts',
    'Tercer puesto correcto: 1 pt',
    'Marcador en eliminatoria: 3 pts',
    'Vencedor en eliminatoria: 2 pts',
    'Campeón correcto: 10 pts',
  ];
  puntos.forEach((p, i) => {
    doc.text('- ' + p, mg + 4, 161 + i * 6);
  });

  // Footer de portada
  st(C.muted);
  font('helvetica', 'normal', 6);
  doc.text(`Polla Mundial 2026  ·  Predicciones de ${WZ.name || 'jugador'}  ·  Generado automaticamente`, W / 2, H - 6, { align: 'center' });

  // ── PÁGINAS DE GRUPOS ──────────────────────────────────────────
  newPage();
  sectionBar('FASE DE GRUPOS');

  GROUPS_DEF.forEach(g => drawGroupCard(g));

  // ── MEJORES TERCEROS ───────────────────────────────────────────
  checkY(80);
  drawThirdsSection();

  // ── FASES ELIMINATORIAS ────────────────────────────────────────
  KO_PHASES.forEach((phase, phaseIdx) => {
    checkY(30);
    drawKoPhase(phase, phaseIdx);
  });

  // Footer en todas las páginas
  for (let p = 1; p <= doc.getNumberOfPages(); p++) {
    doc.setPage(p);
    st(C.muted);
    font('helvetica', 'normal', 5.5);
    doc.text(
      `Polla Mundial 2026  ·  Predicciones de ${WZ.name || 'jugador'}  ·  Pagina ${p} de ${doc.getNumberOfPages()}`,
      W / 2, H - 4, { align: 'center' }
    );
  }

  // ── GUARDAR ────────────────────────────────────────────────────
  const safeName = (WZ.name || 'jugador').replace(/[^a-z0-9]/gi, '_').slice(0, 25);
  doc.save(`predicciones_mundial_2026_${safeName}.pdf`);
}