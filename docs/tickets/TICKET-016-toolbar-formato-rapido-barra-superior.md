# TICKET-016: Barra Superior Unificada y Barra Flotante de Formato Rápido

- **Milestone:** Sprint 4 — Rediseño Visual WYSIWYG ("PaperCraft") y Asistencia Interactiva (v0.2.0)
- **Estado:** 🟢 Cerrado
- **Prioridad:** Alta (P1)
- **Tipo:** Core Feature / UI

---

## 1. Descripción
Diseñar una barra superior sobria y unificada sin sobreposiciones visuales ni elementos flotantes que obstaculicen la lectura, integrando controles de modo de visualización (Visual vs. Código), selector de tipografía (Serif / Sans), selector de tono de papel (Modo Noche Grafito, Crema, Sepia Cálido, Blanco), conmutador entre Vista Edición y Vista Impresa, y una barra flotante de formato (`FloatingToolbar.svelte`) para dar estilo al texto seleccionado (**HU-07**, **RF-05 al RF-09**).

## 2. Tareas Específicas
1. Unificar la barra de cabecera en una sola franja oscura y sobria en la parte superior de la ventana.
2. Añadir conmutadores de modo de trabajo:
   * **Vista:** 'Visual' (PaperCraft) vs 'Código' (CodeMirror 6).
   * **Hoja:** 'Edición' (edición ágil de texto) vs 'Impresión' (renderizado fiel con KaTeX y tipografía final).
   * **Tono de Papel:** Grafito oscuro (#1e2029), Crema suave (#fcfbf7), Sepia cálido (#f7f3e8), Blanco (#ffffff).
   * **Tipografía:** Serif (Computer Modern / Georgia) y Sans (Inter).
3. Desarrollar el componente `FloatingToolbar.svelte`:
   * Aparece automáticamente al seleccionar texto con el cursor.
   * Botones rápidos: **Negrita** (`**`), *Cursiva* (`*`), `Código` (```), $Fórmula$ (`$`), Encabezado (`#`).
4. Conectar los estilos a las variables reactivas de Svelte 5 con `$state` y `$derived`.

## 3. Criterios de Aceptación (Definition of Done)
* [x] La barra superior no se superpone sobre la hoja de trabajo ni invade los márgenes de escritura.
* [x] El usuario puede cambiar instantáneamente entre modo visual y código sin perder contenido ni estado del documento.
* [x] Al seleccionar texto en la hoja de trabajo, la barra flotante ofrece opciones de formato rápido de manera intuitiva.
