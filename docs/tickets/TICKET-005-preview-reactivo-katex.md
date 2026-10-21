# TICKET-005: Pipeline de Vista Previa Reactiva Instantánea con KaTeX

- **Milestone:** Sprint 0 — Scaffolding y Entorno Base
- **Estado:** 🟢 Cerrado
- **Prioridad:** Alta
- **Tipo:** Core Feature / Preview

---

## 1. Descripción
Implementar el nivel 1 de renderizado rápido (**RNF-04**): un visor que transforma en tiempo real el código LaTeX básico (títulos, párrafos, listas y fórmulas matemáticas) a HTML/DOM enriquecido con **KaTeX**, respondiendo en menos de 50 ms a cada pulsación de tecla.

## 2. Tareas Específicas
1. Instalar e integrar `katex` y sus fuentes matemáticas vectoriales.
2. Crear un parser ligero o transpilador incremental que:
   * Detecte entornos matemáticos en línea `$ ... $` y en bloque `\[ ... \]` / `\begin{equation} ... \end{equation}`.
   * Procese secciones (`\section{}`, `\subsection{}`).
   * Renderice texto formateado (`\textbf{}`, `\textit{}`).
3. Implementar debounce adaptativo (renderizado instantáneo para documentos pequeños, debounce de 80 ms para documentos grandes).

## 3. Criterios de Aceptación (Definition of Done)
* [x] Las fórmulas matemáticas complejas (matrices, integrales, fracciones) se dibujan en pantalla con calidad tipográfica y sin parpadeos.
* [x] La actualización del visor ocurre en un intervalo inferior a 50 ms tras dejar de teclear.
* [x] Si la fórmula contiene un error sintáctico LaTeX, el visor muestra un mensaje amigable o resalta el fragmento en rojo sin crashear la aplicación.
