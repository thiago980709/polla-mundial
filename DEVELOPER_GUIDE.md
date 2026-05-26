# 🚀 Quick Start Guide - Developer Edition

## Para Desarrolladores: Cómo Navegar el Código

### 5 Minutos para Entender la Estructura

```
USUARIO ABRE index.html
    ↓
Se cargan scripts en orden:
  1. config.js      (datos del torneo)
  2. utils.js       (funciones auxiliares)
  3. standings.js   (cálculos)
  4. ko-logic.js    (eliminatorias)
  5. firebase.js    (base de datos)
  6. wizard-state.js (estado)
  7. pdf.js         (generación PDF)
  8. wizard-ui.js   (interfaz)
    ↓
Se ejecuta: initFirebase() → startWizard() → render()
    ↓
Wizard aparece en pantalla
```

## Por Dónde Empezar

### Si quiero... → Editar este archivo

| Objetivo | Archivo | Ubicación |
|----------|---------|-----------|
| **Agregar nuevo grupo** | `config.js` | GROUPS_DEF array |
| **Cambiar lógica de KO** | `ko-logic.js` | `getKoMatchWinner()` |
| **Calcular terceros diferente** | `standings.js` | `calcBest8Thirds()` |
| **Conectar a otra BD** | `firebase.js` | `dbSavePlayer()` |
| **Cambiar colores** | `css/styles.css` | `:root { --color }` |
| **Modificar pantalla grupos** | `wizard-ui.js` | `renderGroup()` |
| **Personalizar PDF** | `pdf.js` | Buscar 🎨 EDITA AQUÍ |

## Ejemplo: Agregar Customización al PDF

**Objetivo:** Cambiar título de portada

1. Abrir `/js/pdf.js`
2. Buscar "🎨 EDITA AQUÍ - Portada"
3. Cambiar:
   ```javascript
   // ANTES
   doc.text('🏆 MI POLLA MUNDIAL 2026', 105, 40)
   
   // DESPUÉS
   doc.text('🏆 MUNDIAL 2026 - APUESTAS', 105, 40)
   ```
4. Guardar y recargar `index.html`

## Ejemplo: Cambiar Cálculo de Terceros

**Objetivo:** Los terceros deben elegirse por puntos (no por grupo)

1. Abrir `/js/standings.js`
2. Encontrar función `calcBest8Thirds()`
3. Cambiar algoritmo de clasificación (actualmente: orden de grupo)
4. La UI se actualiza automáticamente

## Estado Global (WZ Object)

Toda la data se guarda en `WZ`:

```javascript
WZ = {
  name: "Juan",              // Nombre del jugador
  pid: "player_juan",        // ID en Firestore
  step: 5,                   // Paso actual (0-20)
  groups: {
    A: { scores: [...], ... },  // Predicciones de grupos
    B: { scores: [...], ... },
    ...
  },
  ko: {
    r32_0_ht: "Argentina",   // Home team 16avos match 0
    r32_0_pt: "México",      // Away team
    r16_0_ht: null,          // Se llena automáticamente desde ganador
    ...
  },
  champion: "Argentina"      // Campeón
}
```

### Guardar Cambios

Siempre que cambies `WZ`, llama:
```javascript
saveToApp();  // Sincroniza con localStorage + Firestore
```

## Flujo de Auto-Llenado de Equipos (KO)

```
Usuario selecciona predicción en grupo A
    ↓
Se guarda en WZ.groups.A.scores
    ↓
Se ejecuta render() para actualizar UI
    ↓
renderKO() llama getKoTeamConfig()
    ↓
getKoTeamConfig() resuelve:
  ¿Es ganador de match previo?
  → Obtiene ganador de ko-logic.js
  → Retorna {value: "Argentina", disabled: true}
  ↓
Si no se resolvió automáticamente:
  → Retorna {value: null, options: [...], disabled: false}
  → Usuario puede seleccionar manualmente
```

## Agregar Nueva Función Reutilizable

**Pasos:**

1. Crear función en `js/utils.js`:
```javascript
function miNuevaFuncion(param) {
  // Lógica
  return resultado;
}
```

2. Usarla en otro módulo (ej. en `wizard-ui.js`):
```javascript
const resultado = miNuevaFuncion(valor);
```

## Debugging Rápido

En DevTools Console (`F12`):

```javascript
// Ver estado actual
console.log(WZ);

// Ver standings del grupo A
console.log(calcGroupStandings('A'));

// Ver equipos disponibles para KO match
console.log(getKoTeamConfig('r16', 0, 'home', null));

// Forzar render
render();

// Generar PDF (será lento)
downloadMyPDF();
```

## Prueba Rápida de Cambios

1. Editar archivo JS
2. Guardar (`Ctrl+S`)
3. Recargar página (`F5`)
4. Ver resultado

**Si hay error:**
- Abre DevTools (`F12`) → Console
- Busca mensaje de error
- Revisa sintaxis

## Estructura de Commits (Si usas Git)

```bash
git init
git add .
git commit -m "Initial: Modular refactoring complete"

# Luego, para cada cambio:
git commit -m "feat: Add new KO logic"
git commit -m "fix: PDF color palette"
git commit -m "style: Update CSS variables"
```

## Performance Tips

- **Evitar:** Loops infinitos en `renderXXX()`
- **No:** Multiplicar `JSON.parse()` / `JSON.stringify()`
- **Usar:** Cachear resultados si se repiten cálculos

## Testing Manual Checklist

Después de cambios, verifica:

- [ ] Página carga sin errores
- [ ] Wizard muestra bienvenida
- [ ] Puedo ingresar nombre
- [ ] Grupos se cargan (12 pasos)
- [ ] KO se auto-llenan después de grupos
- [ ] Empates habilitan campo de penales
- [ ] Terceros se asignan automáticamente
- [ ] PDF se descarga
- [ ] Datos se guardan (recarga página, siguen ahí)

## Estructura de Respuestas de Funciones

```javascript
// getKoTeamConfig() retorna:
{
  value: "Argentina",        // Equipo actual (null si vacío)
  options: ["Argentina", "Brasil"],  // Equipos disponibles
  disabled: true,            // true si es auto-llenado (locked)
  resolved: {
    source: "r32_0",         // De dónde viene
    value: "Argentina"       // Valor resuelto
  }
}

// calcGroupStandings() retorna:
{
  standings: [
    {pos: 1, team: "Argentina", pj: 3, g: 3, e: 0, p: 0, gf: 9, gc: 1, gd: 8, pts: 9},
    ...
  ],
  classified: ["Argentina", "Uruguay"],
  thirds: ["Para terceros"]
}
```

## URLs Importantes

- Firebase Console: https://console.firebase.google.com
- jsPDF Docs: https://github.com/parallax/jsPDF
- Google Fonts: https://fonts.google.com

---

## Ayuda Rápida

**¿Dónde está...?**

| Pregunta | Respuesta |
|----------|----------|
| Datos del torneo | `js/config.js` |
| IDs de Firestore | `js/firebase.js` + `js/utils.js` |
| Cálculos | `js/standings.js` + `js/ko-logic.js` |
| Interfaz | `js/wizard-ui.js` |
| PDF | `js/pdf.js` + búsca 🎨 EDITA AQUÍ |
| Estado | `js/wizard-state.js` (WZ object) |
| Estilos | `css/styles.css` |

---

**¡Listo para empezar!** 🚀  
Abre `index.html`, abre DevTools (`F12`), y comienza a explorar.
