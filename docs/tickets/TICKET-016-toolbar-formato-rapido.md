# TICKET-016: Barra de Herramientas de Formato Rápido e Inserción

- **Milestone:** Sprint 4 — Edición Asistida y Experiencia de Usuario
- **Estado:** ⚪ Pendiente
- **Prioridad:** Alta (P1)
- **Tipo:** Core Feature / UI

---

## 1. Descripción
Implementar una barra de herramientas de formato e inserción rápida (`EditorToolbar.svelte`) en la parte superior del editor CodeMirror 6 (**HU-07 al HU-09**, **RF-05 al RF-09**). Permitirá a los usuarios aplicar estilos y estructuras LaTeX con un solo clic, envolviendo la selección de texto activa o insertando la sintaxis con el cursor posicionado dentro del bloque.

## 2. Tareas Específicas
1. Diseñar el componente `EditorToolbar.svelte` integrado en el encabezado del panel del editor.
2. Implementar botones de formato de texto:
   * **Negrita:** `\textbf{...}` (<kbd>Ctrl+B</kbd> o clic).
   * **Cursiva:** `\textit{...}` (<kbd>Ctrl+I</kbd> o clic).
   * **Monoespacio / Código:** `\texttt{...}`.
   * **Subrayado:** `\underline{...}`.
3. Implementar botones de estructuración del documento:
   * **Sección:** `\section{...}`.
   * **Subsección:** `\subsection{...}`.
   * **Párrafo:** Inserción de salto de párrafo doble.
4. Implementar inserción de listas y citas:
   * **Lista con viñetas:** Entorno `\begin{itemize} \item ... \end{itemize}`.
   * **Lista numerada:** Entorno `\begin{enumerate} \item ... \end{enumerate}`.
   * **Bloque de cita:** Entorno `\begin{quote} ... \end{quote}`.
5. Conectar las acciones con la API de dispatch y transacciones de CodeMirror 6 para conservar el historial de deshacer/rehacer (`Undo`/`Redo`).

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Al seleccionar texto en el editor y presionar un botón de formato (ej. Negrita), el texto seleccionado queda envuelto en `\textbf{texto}`.
* [ ] Si no hay selección, se inserta la plantilla del comando con el cursor ubicado dentro de las llaves `{}`.
* [ ] Las acciones son completamente compatibles con el historial de deshacer (<kbd>Ctrl+Z</kbd>).
