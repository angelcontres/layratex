# TICKET-019: Generador y Constructor Asistido de Tablas Interactivas

- **Milestone:** Sprint 4 — Rediseño Visual WYSIWYG ("PaperCraft") y Asistencia Interactiva (v0.2.0)
- **Estado:** 🟢 Cerrado
- **Prioridad:** Media-Alta (P2)
- **Tipo:** Core Feature / UI Component

---

## 1. Descripción
Uno de los puntos de mayor fricción al componer documentos técnicos es la creación de tablas. Se requiere un constructor visual interactivo (`TableBuilderModal.svelte`) que permita seleccionar dimensiones de cuadrícula, configurar alineación por columnas y generar estructuras tabulares limpias y compatibles tanto con el formato visual como con el compilador LaTeX (`tabular`) (**HU-10**, **HU-15**, **RF-21 al RF-23**).

## 2. Tareas Específicas
1. Diseñar el modal `TableBuilderModal.svelte`:
   * Selector interactivo de filas y columnas (hasta $8 \times 8$).
   * Opción para incluir fila de cabecera (*header*).
   * Selector de alineación de texto por columna: Izquierda (`:---`), Centro (`:---:`), Derecha (`---:`).
   * Cuadrícula de celdas interactivas para escribir los textos iniciales antes de la inserción.
2. Generar el formato Markdown para la vista del editor visual.
3. Generar el bloque correspondiente `\begin{table} \begin{tabular}{...} ... \end{tabular} \end{table}` en el conversor de LaTeX.
4. Integrar la invocación del constructor desde el botón "+ Tabla" de la barra superior y desde el comando `/table` del menú Slash.

## 3. Criterios de Aceptación (Definition of Done)
* [x] El modal permite elegir filas y columnas con vista previa visual de la cuadrícula.
* [x] Al insertar, se agrega la tabla en la posición del cursor de la hoja de redacción.
* [x] Al cambiar a modo código o compilar el PDF, la tabla se convierte fielmente al entorno `tabular` de LaTeX.
