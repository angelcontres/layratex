# TICKET-008: Guardado de Archivos y Atajos (Guardar y Guardar Como)

- **Milestone:** Sprint 1 — Persistencia y Sistema de Archivos
- **Estado:** 🟢 Cerrado
- **Prioridad:** Alta (P1)
- **Tipo:** Core Feature / File Management

---

## 1. Descripción
Implementar el guardado de documentos en disco local con soporte para atajos de teclado estándar (**HU-03**, **RF-32**, **RF-33**). Si el archivo ya existe en disco, debe sobrescribirse directamente en silencio. Si es un archivo nuevo ("Sin título"), debe invocar el diálogo nativo "Guardar como...".

## 2. Tareas Específicas
1. Implementar la función `saveFile`:
   * Si `filePath` existe: invocar `writeTextFile(filePath, content)` de forma atómica.
   * Si `filePath` es nulo: delegar a `saveFileAs`.
2. Implementar la función `saveFileAs`:
   * Desplegar diálogo nativo `save` con filtro `.tex` y nombre sugerido `documento.tex`.
   * Escribir el contenido en la ruta elegida y actualizar `filePath` del documento activo.
3. Configurar interceptores de eventos de teclado en la ventana:
   * `Ctrl+S` / `Cmd+S`: Guardar.
   * `Ctrl+Shift+S` / `Cmd+Shift+S`: Guardar como.
4. Conectar los botones de la barra superior ("Guardar .tex") con esta lógica nativa.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Al pulsar `Ctrl+S` en un documento ya guardado, los cambios se persisten en disco de inmediato sin abrir diálogos.
* [ ] Al pulsar `Ctrl+S` en un documento nuevo, se abre el diálogo nativo de guardado.
* [ ] Al guardar exitosamente, la barra de estado o una notificación flotante notifica el guardado.
* [ ] El archivo resultante en disco es texto plano UTF-8 100% estándar y reproducible.
