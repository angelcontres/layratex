# TICKET-022: Autocompletado Inteligente y Snippets para LaTeX en CodeMirror 6

- **Milestone:** Sprint 5 — Navegación y Productividad Avanzada (v0.3.0)
- **Estado:** 🟢 Completado
- **Prioridad:** Alta (P1)
- **Tipo:** Core Feature / Editor DX

---

## 1. Descripción
Integrar la extensión oficial `@codemirror/autocomplete` configurada para sintaxis LaTeX en `LatexEditor.svelte` (**HU-04**, **RF-02**, **RF-03**). Brindará autocompletado en tiempo real al escribir comandos (`\`), cierre automático de entornos (`\begin{...}` $\rightarrow$ `\end{...}`) y snippets de expansión rápida con la tecla <kbd>Tab</kbd>.

## 2. Tareas Específicas
1. Instalar y configurar `@codemirror/autocomplete` en `LatexEditor.svelte`.
2. Crear un catálogo de comandos LaTeX comunes categorizados con documentación breve:
   * Comandos de estructura: `\documentclass`, `\usepackage`, `\section`, `\subsection`, `\paragraph`, `\tableofcontents`.
   * Comandos de formato: `\textbf`, `\textit`, `\texttt`, `\underline`, `\emph`.
   * Entornos matemáticos: `equation`, `align`, `gather`, `matrix`, `pmatrix`, `bmatrix`.
   * Comandos matemáticos: `\frac`, `\sqrt`, `\sum`, `\int`, `\lim`, `\alpha`, `\beta`, etc.
3. Implementar auto-cierre de entornos:
   * Al seleccionar o terminar de escribir `\begin{nombre}`, insertar automáticamente `\end{nombre}` con el cursor indentado en la línea intermedia.
4. Implementar snippets para inserción rápida de figuras y tablas.

## 3. Criterios de Aceptación (Definition of Done)
* [x] Al teclear `\` en el editor de código, se despliega una lista contextual con comandos LaTeX sugeridos y filtrado difuso (*fuzzy search*).
* [x] Al seleccionar un entorno con `\begin{...}`, se genera el correspondiente `\end{...}` de forma automática.
* [x] La tecla <kbd>Tab</kbd> o <kbd>Enter</kbd> completa la sugerencia seleccionada sin interrumpir el flujo de escritura.
