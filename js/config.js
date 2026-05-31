// ================================================================
// CONFIGURATION - Mundial 2026
// ================================================================

const GROUPS_DEF = [
  { id:'A', teams:['México','Sudáfrica','Corea del Sur','República Checa'] },
  { id:'B', teams:['Canadá','Bosnia y Herzegovina','Qatar','Suiza'] },
  { id:'C', teams:['Brasil','Marruecos','Haití','Escocia'] },
  { id:'D', teams:['Estados Unidos','Paraguay','Australia','Turquía'] },
  { id:'E', teams:['Alemania','Curazao','Costa de Marfil','Ecuador'] },
  { id:'F', teams:['Países Bajos','Japón','Suecia','Túnez'] },
  { id:'G', teams:['Bélgica','Egipto','Irán','Nueva Zelanda'] },
  { id:'H', teams:['España','Cabo Verde','Arabia Saudita','Uruguay'] },
  { id:'I', teams:['Francia','Senegal','Irak','Noruega'] },
  { id:'J', teams:['Argentina','Argelia','Austria','Jordania'] },
  { id:'K', teams:['Portugal','RD Congo','Uzbekistán','Colombia'] },
  { id:'L', teams:['Inglaterra','Croacia','Ghana','Panamá'] },
];

const KO_PHASES = [
  { id:'r32', label:'16avos de Final', count:32 },
  { id:'r16', label:'Octavos de Final', count:16 },
  { id:'qf',  label:'Cuartos de Final', count:8 },
  { id:'sf',  label:'Semifinales', count:4 },
  { id:'tp',  label:'Tercer y Cuarto Puesto', count:2 },
  { id:'final',label:'Final', count:2 },
];

const KO_MATCH_SOURCES = {
  r32: [
    '2º Grupo A vs 2º Grupo B',
    '1º Grupo E vs 3º Grupo A/B/C/D/F',
    '1º Grupo F vs 2º Grupo C',
    '1º Grupo C vs 2º Grupo F',
    '1º Grupo I vs 3º Grupo C/D/F/G/H',
    '2º Grupo E vs 2º Grupo I',
    '1º Grupo A vs 3º Grupo C/E/F/H/I',
    '1º Grupo L vs 3º Grupo E/H/I/J/K',
    '1º Grupo D vs 3º Grupo B/E/F/I/J',
    '1º Grupo G vs 3º Grupo A/E/H/I/J',
    '2º Grupo K vs 2º Grupo L',
    '1º Grupo H vs 2º Grupo J',
    '1º Grupo B vs 3º Grupo E/F/G/I/J',
    '1º Grupo J vs 2º Grupo H',
    '1º Grupo K vs 3º Grupo D/E/I/J/L',
    '2º Grupo D vs 2º Grupo G',
  ],
  // Nota: aquí se definen los cruces de Octavos de Final con correspondencia a los partidos 74-88.
  // Si hay equipos repetidos en los partidos 74 y 76 revisa los objetos `match:74` y `match:76`
  // en `KO_TEAM_SOURCES.r16` y ajusta `KO_MATCH_SOURCES.r16` si es necesario.
  r16: [
    'Ganador 74 vs Ganador 77',
    'Ganador 73 vs Ganador 75',
    'Ganador 76 vs Ganador 78',
    'Ganador 79 vs Ganador 80',
    'Ganador 83 vs Ganador 84',
    'Ganador 81 vs Ganador 82',
    'Ganador 86 vs Ganador 88',
    'Ganador 85 vs Ganador 87',
  ],
  qf: [
    'Ganador 89 vs Ganador 90',
    'Ganador 93 vs Ganador 94',
    'Ganador 91 vs Ganador 92',
    'Ganador 95 vs Ganador 96',
  ],
  sf: [
    'Ganador 97 vs Ganador 98',
    'Ganador 99 vs Ganador 100',
  ],
  tp: ['Perdedor 101 vs Perdedor 102'],
  final: ['Ganador 101 vs Ganador 102'],
};

const KO_TEAM_SOURCES = {
  r32: [
    { home:{type:'group',group:'A',pos:2}, away:{type:'group',group:'B',pos:2} },
    { home:{type:'group',group:'E',pos:1}, away:{type:'third',groups:['A','B','C','D','F']} },
    { home:{type:'group',group:'F',pos:1}, away:{type:'group',group:'C',pos:2} },
    { home:{type:'group',group:'C',pos:1}, away:{type:'group',group:'F',pos:2} },
    { home:{type:'group',group:'I',pos:1}, away:{type:'third',groups:['C','D','F','G','H']} },
    { home:{type:'group',group:'E',pos:2}, away:{type:'group',group:'I',pos:2} },
    { home:{type:'group',group:'A',pos:1}, away:{type:'third',groups:['C','E','F','H','I']} },
    { home:{type:'group',group:'L',pos:1}, away:{type:'third',groups:['E','H','I','J','K']} },
    { home:{type:'group',group:'D',pos:1}, away:{type:'third',groups:['B','E','F','I','J']} },
    { home:{type:'group',group:'G',pos:1}, away:{type:'third',groups:['A','E','H','I','J']} },
    { home:{type:'group',group:'K',pos:2}, away:{type:'group',group:'L',pos:2} },
    { home:{type:'group',group:'H',pos:1}, away:{type:'group',group:'J',pos:2} },
    { home:{type:'group',group:'B',pos:1}, away:{type:'third',groups:['E','F','G','I','J']} },
    { home:{type:'group',group:'J',pos:1}, away:{type:'group',group:'H',pos:2} },
    { home:{type:'group',group:'K',pos:1}, away:{type:'third',groups:['D','E','I','J','L']} },
    { home:{type:'group',group:'D',pos:2}, away:{type:'group',group:'G',pos:2} },
  ],
  r16: [
    { home:{type:'match',match:74}, away:{type:'match',match:77} },
    { home:{type:'match',match:73}, away:{type:'match',match:75} },
    { home:{type:'match',match:76}, away:{type:'match',match:78} },
    { home:{type:'match',match:79}, away:{type:'match',match:80} },
    { home:{type:'match',match:83}, away:{type:'match',match:84} },
    { home:{type:'match',match:81}, away:{type:'match',match:82} },
    { home:{type:'match',match:86}, away:{type:'match',match:88} },
    { home:{type:'match',match:85}, away:{type:'match',match:87} },
  ],
  qf: [
    { home:{type:'match',match:89}, away:{type:'match',match:90} },
    { home:{type:'match',match:93}, away:{type:'match',match:94} },
    { home:{type:'match',match:91}, away:{type:'match',match:92} },
    { home:{type:'match',match:95}, away:{type:'match',match:96} },
  ],
  sf: [
    { home:{type:'match',match:97}, away:{type:'match',match:98} },
    { home:{type:'match',match:99}, away:{type:'match',match:100} },
  ],
  tp: [
    { home:{type:'loser',match:101}, away:{type:'loser',match:102} },
  ],
  final: [
    { home:{type:'match',match:101}, away:{type:'match',match:102} },
  ],
};

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBmh8v5bGOU-C2Q9pOEjPZ5BbkVr1wHSsQ",
  authDomain: "polla-mundial-938d9.firebaseapp.com",
  projectId: "polla-mundial-938d9",
  storageBucket: "polla-mundial-938d9.firebasestorage.app",
  messagingSenderId: "1055596239418",
  appId: "1:1055596239418:web:9805e02f0d326e7a30b303"
};

const FIREBASE_COLLECTION = 'predicciones';
const STORAGE_KEY = 'polla_mundial_2026';
