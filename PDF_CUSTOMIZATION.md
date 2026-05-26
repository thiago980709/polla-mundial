# Guía de Customización de PDF

## Ubicación Principal

**Archivo:** `/js/pdf.js`

## Zonas de Edición (🎨 EDITA AQUÍ)

Todos los puntos de customización están marcados en el código. Busca por `🎨 EDITA AQUÍ` para encontrarlos.

### 1. Paleta de Colores (líneas ~20-35)

```javascript
const COLORS = {
  GOLD: '#F5A623',
  PANEL: '#111B30',
  TEXT: '#E8EEF7',
  GREEN: '#06A77D',
  RED: '#D62828',
  MUTED: '#7A8BAA',
  BG_DARK: '#0A0E1A'
};
```

**Puedes cambiar:**
- Colores principales (GOLD, PANEL, TEXT)
- Colores de resultados (GREEN para victoria, RED para derrota)
- Colores de fondo y texto

### 2. Fuentes y Tamaños (líneas ~40-50)

```javascript
const FONTS = {
  TITLE_SIZE: 24,
  SUBTITLE_SIZE: 16,
  TEXT_SIZE: 12,
  SMALL_SIZE: 10
};
```

### 3. Portada Personalizada (línea ~80)

```javascript
doc.setFontSize(40);
doc.text('🏆 MI POLLA MUNDIAL 2026', 105, 40, { align: 'center' });
doc.setFontSize(16);
doc.text(`Predicciones de ${WZ.name}`, 105, 60, { align: 'center' });
```

**Puedes cambiar:**
- Título principal
- Subtítulo
- Decoraciones (emojis)
- Posición y alineación

### 4. Función drawGroupCard() (línea ~120)

```javascript
function drawGroupCard(doc, group, y, cardWidth) {
  // Modificar:
  // - Colores de fondo
  // - Altura de tarjeta
  // - Tamaño de texto
  // - Espaciado entre elementos
}
```

**Elementos personalizables:**
- Color de fondo de tarjeta
- Color de encabezado
- Tamaño de equipo
- Formato de tabla

### 5. Secciones Personalizables (líneas ~150-200)

#### Sección de Campeón
```javascript
doc.setTextColor(COLORS.GOLD[0], COLORS.GOLD[1], COLORS.GOLD[2]);
doc.setFontSize(20);
doc.text('CAMPEÓN 2026', 15, y);
```

#### Sección de Terceros
```javascript
doc.text('MEJORES TERCEROS', 15, y);
```

#### Sección de Fases KO
```javascript
doc.text('CAMINO A LA GLORIA', 15, y);
```

### 6. Pie de Página (línea ~250)

```javascript
doc.setFontSize(10);
doc.setTextColor(150);
doc.text(`Generado: ${new Date().toLocaleDateString()}`, 15, doc.internal.pageSize.height - 10);
```

## Ejemplos Prácticos

### Cambiar tema a oscuro más intenso
```javascript
const COLORS = {
  GOLD: '#FFD700',
  PANEL: '#1a1a2e',
  TEXT: '#ffffff',
  GREEN: '#00d084',
  RED: '#ff6b6b',
  MUTED: '#a0a0a0',
  BG_DARK: '#0f0f0f'
};
```

### Agregar logo personalizado
En la portada, después del título:
```javascript
doc.addImage('url-de-tu-logo.png', 'PNG', 80, 80, 50, 50);
```

### Cambiar estructura de grupos
En `drawGroupCard()`, modificar el orden de elementos:
```javascript
// Mostrar equipo en grande primero
doc.setFontSize(14);
doc.text(team, x, y);
// Luego puntos pequeño
doc.setFontSize(10);
doc.text(`${pts}pts`, x, y+5);
```

### Agregar comentarios personales
En la portada:
```javascript
doc.setFontSize(12);
doc.text('Mi predicción: Brasil vs Argentina en la Final', 105, 100, { align: 'center' });
```

## Estructura de Página

Cada página tiene:
1. **Margen superior:** 15px
2. **Margen lateral:** 15px
3. **Alto máximo:** `doc.internal.pageSize.height`
4. **Ancho máximo:** `doc.internal.pageSize.width` (210mm para A4)

## Funciones Útiles de jsPDF

```javascript
// Establecer color (RGB)
doc.setTextColor(245, 166, 35);

// Establecer fuente
doc.setFont("Helvetica", "bold");
doc.setFont("Helvetica", "normal");

// Escribir texto
doc.text('Texto', x, y);
doc.text('Texto', x, y, { align: 'center' });
doc.text('Texto', x, y, { align: 'right' });

// Dibujar rectángulo
doc.rect(x, y, width, height);
doc.setFillColor(r, g, b);
doc.rect(x, y, width, height, 'F'); // F = relleno

// Salto de página
doc.addPage();

// Guardar
doc.save('mi-polla-mundial.pdf');
```

## Depuración

Para probar cambios sin descargar PDF:
1. Abre DevTools (F12)
2. En la consola, ejecuta: `generatePlayerPDF()` (será bastante lento la primera vez)
3. Si hay errores, aparecerán en la consola

## Notas Importantes

- **Coordenadas:** Siempre en **mm** (A4 estándar es 210x297mm)
- **Colores:** Formato RGB (0-255) o hexadecimal
- **Páginas múltiples:** El PDF crece automáticamente con `doc.addPage()`
- **Performance:** No agregar demasiadas imágenes (ralentiza generación)

---

**Próxima customización:** Busca 🎨 EDITA AQUÍ en `/js/pdf.js` para ver todas las opciones
