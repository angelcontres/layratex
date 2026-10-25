# TICKET-027: Integración de la Familia Tipográfica Oficial TeX (Computer Modern / CMU Serif)

- **Milestone:** Sprint 5 — Fidelidad Tipográfica y Estética Overleaf / LaTeX
- **Estado:** 🟡 Pendiente
- **Prioridad:** Alta (P1)
- **Tipo:** UI/UX & Typography

---

## 1. Descripción
Reemplazar las tipografías genéricas del sistema (*Georgia, Times New Roman, Inter*) por la familia tipográfica oficial y emblemática del ecosistema TeX: **Computer Modern (Latin Modern Roman / CMU Serif)** (**HU-27**, **RF-45**). Esta familia tipográfica, creada originalmente por Donald Knuth, constituye la firma visual inconfundible de los documentos académicos compilados en LaTeX y Overleaf. 

El objetivo es lograr que tanto la hoja A4 interactiva como el texto redactado y las fórmulas KaTeX compartan exactamente los mismos glifos, proporciones y estilo tipográfico de un paper científico real.

---

## 2. Tareas Específicas
1. **Inclusión de Fuentes Web TeX Offline:**
   - Incorporar los archivos web font en formato WOFF2 de `CMU Serif` (Roman, Bold, Italic, BoldItalic) en `src/assets/fonts/cmu/`.
   - Añadir variantes complementarias: `CMU Sans Serif` (para diagramas o títulos modernos) y `CMU Typewriter Text` (para código fuente y bloques monoespaciados).
2. **Definición de Reglas `@font-face` en `src/app.css`:**
   - Declarar la familia `'Computer Modern', 'CMU Serif', 'Latin Modern Roman', serif` con carga local y sin dependencia de CDNs externos para garantizar funcionamiento 100% offline.
3. **Unificación con KaTeX:**
   - Sincronizar la escala métrica entre el texto normal y los símbolos matemáticos (`KaTeX_Main`, `KaTeX_Math`) eliminando cualquier salto de altura en línea (*x-height*).
4. **Ligaduras y Kerning Editorial:**
   - Habilitar en CSS las ligaduras tipográficas clásicas de TeX (`font-feature-settings: "liga" 1, "dlig" 1;` para combinaciones como *fi, fl, ff, ffi, ffl* y guiones largos *--*, *---*).
5. **Selector de Preferencias:**
   - Establecer `Computer Modern (LaTeX Original)` como la tipografía por defecto en el selector de lectura de la aplicación y en el modal de preferencias.

---

## 3. Criterios de Aceptación (Definition of Done)
* [ ] La hoja de redacción A4 muestra todo el texto y encabezados con la fuente clásica Computer Modern / Latin Modern Roman.
* [ ] Las ecuaciones matemáticas KaTeX se integran de manera fluida y uniforme con el texto circundante sin desfases visuales de fuente.
* [ ] La fuente se renderiza de forma nítida y fiel tanto en pantallas de alta densidad (Retina / 4K) como en exportación a PDF.
* [ ] Funciona de forma 100% offline sin realizar peticiones de red a servidores externos.
