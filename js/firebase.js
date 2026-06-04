// ================================================================
// FIREBASE INTEGRATION
// ================================================================

let db = null;
let firestoreEnabled = false;
let firestoreStatus = '';

function initFirebase() {
  if (db) return true;
  if (!FIREBASE_CONFIG.projectId || FIREBASE_CONFIG.projectId.includes('<YOUR_FIREBASE_PROJECT_ID>')) {
    firestoreStatus = 'Firestore no configurado';
    return false;
  }
  if (!window.firebase || !window.firebase.firestore) {
    firestoreStatus = 'SDK de Firebase no cargado';
    return false;
  }
  try {
    if (window.firebase.apps && window.firebase.apps.length > 0) {
      db = firebase.firestore();
    } else {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
    }
    firestoreEnabled = true;
    firestoreStatus = 'Firestore disponible';
    return true;
  } catch (e) {
    firestoreStatus = 'Error en Firestore: ' + e.message;
    return false;
  }
}

async function dbLoadPlayer(name) {
  if (!initFirebase()) return null;
  try {
    const doc = await db.collection(FIREBASE_COLLECTION).doc(playerDocId(name)).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.error('Error cargando jugador:', e);
    return null;
  }
}

async function dbLoadGameState() {
  if (!initFirebase()) return null;
  try {
    const doc = await db.collection(REALS_COLLECTION).doc(REALS_DOC_ID).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.error('Error cargando estado global del juego:', e);
    return null;
  }
}

async function dbSavePlayer() {
  if (!initFirebase()) {
    firestoreStatus = 'No se puede guardar sin Firestore';
    return;
  }
  try {
    const pid = WZ.pid;
    await db.collection(FIREBASE_COLLECTION).doc(pid).set({
      name: WZ.name,
      groups: WZ.groups,
      classif: {},
      thirds: {},
      ko: WZ.ko,
      champion: WZ.champion,
      locked: WZ.locked || false,
      timestamp: new Date(),
    }, { merge: true });
    firestoreStatus = 'Guardado en Firestore';
  } catch (e) {
    console.error('Error guardando en Firestore:', e);
    firestoreStatus = 'Error al guardar: ' + e.message;
  }
}
