# TICKET-019: Generador Visual Asistido de Tablas y Matrices

- **Milestone:** Sprint 4 — Edición Asistida y Experiencia de Usuario
- **Estado:** ⚪ Pendiente
- **Prioridad:** Media-Alta (P2)
- **Tipo:** Core Feature / UI Component

---

## 1. Descripción
Uno de los puntos de mayor fricción y tedio al escribir LaTeX es la sintaxis manual de tablas (`tabular`, `&`, `\\`, `\hline`) y matrices (`pmatrix`, `bmatrix`). Se requiere un modal interactivo (`TableGeneratorModal.svelte`) que permita diseñar visualmente la tabla o matriz e inserte código LaTeX estándar y limpio (**HU-10**, **RF-21 al RF-23**).

## 2. Tareas Específicas
1. Diseñar el modal `TableGeneratorModal.svelte`:
   * Selector dinámico de filas y columnas (hasta $10 \times 10$).
   * Opción para incluir fila de encabezado (*header*).
   * Selector de alineación por columna: Izquierda (`l`), Centro (`c`), Derecha (`r`).
   * Casilla de verificación para bordes horizontales y verticales (`\hline`, `|`).
   * Cuadrícula editable para pre-rellenar datos de celdas antes de insertar.
2. Modo alternativo para matrices matemáticas:
   * Tipo de matriz: `matrix` (sin delimitador), `pmatrix` (paréntesis), `bmatrix` (corchetes), `vmatrix` (determinante).
3. Generar código LaTeX formateado con indentación limpia e insertarlo en el editor en la posición actual del cursor.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] El usuario puede abrir el generador desde la barra de herramientas, elegir filas y columnas y ver la vista previa en tiempo real.
* [ ] Al presionar "Insertar", se inserta en CodeMirror la estructura completa `\begin{table} ... \begin{tabular}{...} ... \end{tabular} \end{table}` lista para compilar.
