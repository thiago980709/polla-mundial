# Mundial 2026 Polla — Estructura Modular

## Descripción

Aplicación web para pronosticar resultados del Mundial FIFA 2026 con almacenamiento en Firebase Firestore.

## Estructura de Archivos

### Archivos Principales

- **`index.html`** - Página principal del wizard de predicciones (limpia, solo HTML + importación de módulos)
- **`admin.html`** - Panel de administrador para ver/editar todas las predicciones

### Directorio `/js` - Módulos JavaScript (Orden de Carga)

1. **`config.js`** - Configuración central (GROUPS_DEF, KO_PHASES, datos del torneo, FIREBASE_CONFIG)
2. **`utils.js`** - Funciones auxiliares (slugify, playerDocId, escHtml, loadAppState)
3. **`standings.js`** - Cálculos de standings y terceros
   - `buildMatches()` - genera partido round-robin
   - `calcGroupStandings()` - calcula clasificaciones por grupo
   - `calcBest8Thirds()` - ordena los 8 mejores terceros
   - `getBestThirdCandidates()` - prioriza terceros por secuencia de grupo

4. **`ko-logic.js`** - Lógica de fases eliminatorias
   - `getKoMatchNumber()` - mapea phase+index a número (73-104)
   - `getKoMatchWinner()` - resuelve ganador con penales
   - `getKoTeamConfig()` - **AUTO-FILL: retorna {value, options, disabled}** priorizando resolved.value

5. **`firebase.js`** - Integración con Firestore
   - `initFirebase()` - inicializa app
   - `dbLoadPlayer()` - carga predicciones del jugador
   - `dbSavePlayer()` - guarda predicciones en Firestore

6. **`wizard-state.js`** - Gestión del estado del wizard
   - `WZ` object - estado global (name, pid, step, groups{}, ko{}, champion)
   - `saveToApp()` - sincroniza con localStorage + Firestore

7. **`pdf.js`** - Generación de PDF
   - `downloadMyPDF()` - carga jsPDF y dispara generación
   - `generatePlayerPDF()` - **🎨 EDITA AQUÍ** marcas de customización para colores, fuentes, secciones

8. **`wizard-ui.js`** - Renderizado de UI
   - `render()` - router de pasos
   - `renderWelcome()` - entrada con nombre
   - `renderGroup()` - pantalla de grupo con standings
   - `renderKO()` - pantalla KO con auto-fill y penales
   - `renderChamp()` - selección de campeón
   - `renderDone()` - pantalla de resumen con descarga PDF

### Directorio `/css`

- **`styles.css`** - Hoja de estilos principal (separada del HTML)

### Directorio `/admin`

- Estructura lista para refactorización del admin.html (en progreso)
  - `/admin/js/` - módulos específicos del admin
  - `/admin/css/` - estilos del admin

## Características Principales

### Auto-Llenado de Equipos en Fases KO
- Las selecciones de equipos en eliminatorias se llenan automáticamente desde:
  - Ganadores de partidos previos
  - Clasificados de grupos
  - Mejores terceros (con orden de prioridad)
- El usuario puede sobreescribir selecciones manuales si lo requiere

### Manejo de Empates en KO
- Al marcar un empate en fase eliminatoria, se activan campos de **penales**
- El ganador se determina automáticamente por resultado de penales

### Terceros Automáticos
- Los 8 mejores terceros se calculan y ordenan automáticamente
- Se asignan automáticamente en los cruces de 16avos
- Prioridad: orden de grupos (A→B→C→D→E→F→G→H→I→J→K→L)

### Generación de PDF
- Descarga PDF personalizado con predicciones completas
- **Zona de Customización:** Ver 🎨 EDITA AQUÍ en `js/pdf.js` para:
  - Paleta de colores (GOLD, PANEL, TEXT, etc.)
  - Función `drawGroupCard()` - personaliza diseño de tarjeta de grupo
  - Portada personalizada (portada)
  - Secciones estándar: Campeón, Grupos, Terceros, Fases KO, Pie de página

## Flujo de Datos

```
UI (wizard-ui.js)
  ↓ Captura entrada usuario
  ↓
Estado (wizard-state.js, WZ object)
  ↓ saveToApp()
  ↓
Persistencia (firebase.js, localStorage)
  ↓
Lectura para Auto-fill (ko-logic.js, standings.js)
  ↓
Renderizado dinámico
```

## Instalación y Uso

1. Abrir `index.html` en navegador
2. Ingresa tu nombre en bienvenida
3. Completa predicciones de grupos (12 pasos)
4. Completa predicciones KO (6 fases, auto-llenadas)
5. Selecciona campeón
6. Descarga PDF de resumen

## Firebase Firestore

### Estructura de Datos

**Colección: `polla_mundial_2026`**
- Doc ID: `player_<nombre-slugificado>`
- Campos: `name`, `pid`, `step`, `groups`, `ko`, `champion`, `createdAt`, `updatedAt`

### Credenciales

Configurar en `js/config.js` - FIREBASE_CONFIG:
```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};
```

## Notas Técnicas

- **localStorage Fallback:** Si Firestore falla, los datos se guardan localmente
- **Slugify:** Los nombres se convierten a formato seguro para IDs de documento
- **jsPDF:** Se carga dinámicamente desde CDN
- **Vanilla JS:** Sin frameworks (HTML/CSS/JS puro + Firebase SDK)

## Próximas Mejoras

- [ ] Refactorización completa de admin.html al mismo patrón modular
- [ ] Más personalizaciones de PDF vía UI
- [ ] Sistema de rankings y comparación entre jugadores
- [ ] Validación de entrada más robusta

---

**Última actualización:** 2026  
**Estructura creada:** Patrón de desarrollo senior con separación de concerns
