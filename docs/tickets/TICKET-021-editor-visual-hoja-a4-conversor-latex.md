# TICKET-021: Hoja A4 Física ("PaperCraft") y Conversor Bidireccional HTML ↔ LaTeX

- **Milestone:** Sprint 4 — Rediseño Visual WYSIWYG ("PaperCraft") y Asistencia Interactiva (v0.2.0)
- **Estado:** 🟢 Cerrado
- **Prioridad:** Bloqueante (P1)
- **Tipo:** Core Architecture / Editor

---

## 1. Descripción
Desarrollar el editor central de hoja física A4 (`PaperEditor.svelte`) con sombra multicapa, estética editorial limpia y conmutador entre modo de edición y vista de impresión (**HU-07**, **HU-11**, **HU-12**, **HU-13**, **RF-05 al RF-12**). Implementar el motor de conversión bidireccional `latexConverter.ts` que transforma texto enriquecido en código LaTeX estándar y viceversa con cero pérdida de información.

## 2. Tareas Específicas
1. Diseñar el lienzo de hoja de papel A4 en `PaperEditor.svelte`:
   * Relación de aspecto proporcional a A4 (ancho máximo 850px con padding proporcional).
   * Sombras multicapa refinadas (`paper-shadow`) para simular profundidad física de papel.
   * Conmutador reactivo entre modo 'Edición' (área editable) y 'Impresión' (renderizado final con KaTeX).
   * Contador en vivo de palabras y páginas estimadas.
2. Desarrollar el conversor `latexConverter.ts`:
   * Función `visualToLatex(markdown, metadata)`:
     * Generación de preámbulo LaTeX (`\documentclass{article}`, `geometry`, `amsmath`, `xcolor`, etc.).
     * Conversión de títulos (`#`, `##`, `###`) a `\section`, `\subsection`, `\subsubsection`.
     * Conversión de bloques matemáticos `$$` a `\[ ... \]` o entornos `equation`.
     * Conversión de tablas Markdown a entornos `table` y `tabular`.
     * Conversión de bloques de cita (`>`) a entornos `tcolorbox` o `quote`.
   * Función `latexToVisual(latexSource)`:
     * Extracción limpia del cuerpo entre `\begin{document}` y `\end{document}`.
     * Conversión inversa de secciones, fórmulas, tablas y listas a formato editable.
3. Sincronización automática de estado al cambiar entre pestañas de visualización.

## 3. Criterios de Aceptación (Definition of Done)
* [x] La hoja de papel presenta proporción A4 con tonalidades agradables para la vista y tipografía legible.
* [x] Todo cambio en la hoja visual se traduce a LaTeX estándar compilable por el motor backend (Tectonic/pdflatex).
* [x] Al cambiar a modo código en CodeMirror 6, se observa el código fuente LaTeX generado fielmente.
