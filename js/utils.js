// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'jugador';
}

function playerDocId(name) {
  return 'player_' + slugify(name);
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function loadAppState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch(e) { return null; }
}
