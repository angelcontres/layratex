# TICKET-004: Montaje del Editor CodeMirror 6 con Soporte LaTeX

- **Milestone:** Sprint 0 — Scaffolding y Entorno Base
- **Estado:** ⚪ Pendiente
- **Prioridad:** Alta
- **Tipo:** Core Feature / Editor

---

## 1. Descripción
Integrar **CodeMirror 6** dentro de la vista de edición de Svelte. CodeMirror 6 es un editor de texto modular de última generación que proporciona virtualización nativa del DOM (solo renderiza las líneas visibles en pantalla, lo que permite editar documentos de miles de líneas consumiendo menos de 10 MB de memoria).

## 2. Tareas Específicas
1. Instalar paquetes modulares de CodeMirror (`@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/legacy-modes` o soporte de gramática LaTeX).
2. Implementar extensiones esenciales:
   * Numeración de líneas (`lineNumbers`).
   * Resaltado de sintaxis para comandos LaTeX (`\section`, `\begin{}`, `\end{}`, `$...$`, `\[...\]`).
   * Cierre automático de llaves y entornos (`autoCloseBrackets`).
   * Historial de deshacer/rehacer (`history`).
3. Exponer eventos reactivos de cambio de texto para sincronizar con el pipeline de previsualización sin bloquear la entrada de teclado.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] El editor carga instantáneamente al iniciar la aplicación.
* [ ] El usuario puede teclear sin ningún retraso perceptible (latencia de tipeo < 16 ms / 60 FPS).
* [ ] La sintaxis de LaTeX se colorea adecuadamente (comandos, argumentos, matemáticas en línea).
* [ ] El atajo `Ctrl+Z` / `Ctrl+Y` funciona para deshacer y rehacer cambios locales.
