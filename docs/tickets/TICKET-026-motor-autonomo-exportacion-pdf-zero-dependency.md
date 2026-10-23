# TICKET-026: Motor Autónomo de Generación y Exportación PDF (Zero LaTeX Dependency)

- **Milestone:** Sprint 4 — Rediseño Visual WYSIWYG ("PaperCraft") y Asistencia Interactiva (v0.2.0)
- **Estado:** 🟢 Cerrado
- **Prioridad:** Bloqueante (P1)
- **Tipo:** Core Engine / Export & Usability

---

## 1. Descripción
Eliminar la dependencia obligatoria de una instalación previa de LaTeX (`pdflatex`, `tectonic`, `texlive`, `miktex`) en el sistema del usuario al momento de compilar y exportar a PDF (**HU-25**, **RF-36 al RF-39**). Implementar un motor autónomo interno (`pdfExportService.ts`) que tome el documento maquetado con KaTeX, tablas, encabezados y estilos, y genere directamente el archivo binario `.pdf` en disco a alta resolución editorial (300 DPI), ofreciendo además la opción de impresión vectorial directa (`window.print()`).

## 2. Tareas Específicas
1. Diseñar el servicio `pdfExportService.ts` utilizando `jsPDF` y `html2canvas`:
   * Renderizado multi-página A4 con dimensiones exactas ($210 \times 297\text{ mm}$).
   * Escala de alta resolución ($2\times$) para nitidez tipográfica en ecuaciones y textos.
   * Procesamiento de ecuaciones KaTeX, marcas de agua, encabezados y tablas.
2. Añadir comandos nativos en Rust (`src-tauri`):
   * `save_pdf_bytes`: decodifica Base64 y escribe el archivo PDF directamente en la ruta seleccionada por el usuario.
   * `create_temp_pdf_from_bytes`: genera un archivo temporal `.pdf` para visualización inmediata en el visor integrado o apertura en el visor predeterminado del sistema operativo (`open_path`).
   * Función `decode_base64` en `compiler.rs` con pruebas unitarias.
3. Modificar el flujo de compilación y exportación en `App.svelte`:
   * Si el usuario está en modo visual PaperCraft, exportar directamente con el motor autónomo sin dependencias.
   * Si está en modo código y no hay un compilador TeX en el sistema, realizar fallback automático e instantáneo al motor autónomo sin mostrar advertencias ni bloquear al usuario con el error de "compilador no encontrado".
   * Añadir opción "Imprimir con Diálogo del Sistema (Vectorial)" en el modal de éxito.
4. Definir reglas CSS de impresión `@media print` en `app.css` para exportación vectorial limpia.

## 3. Criterios de Aceptación (Definition of Done)
* [x] Al presionar "Exportar PDF" o <kbd>Ctrl+Enter</kbd>, el sistema genera y guarda el PDF sin requerir tener instalado `pdflatex`, `tectonic` o ninguna herramienta externa.
* [x] El usuario nunca es bloqueado con el mensaje de "No se encontró ningún compilador de LaTeX instalado en el sistema".
* [x] El PDF generado conserva todas las fórmulas matemáticas KaTeX, tablas y tipografía A4.
* [x] El usuario puede abrir el PDF generado tanto en el visor de Layratex como en el visor externo predeterminado del sistema operativo.
