# TICKET-007: Diálogos y Apertura de Archivos Locales (.tex)

- **Milestone:** Sprint 1 — Persistencia y Sistema de Archivos
- **Estado:** 🟢 Cerrado
- **Prioridad:** Alta (P1)
- **Tipo:** Core Feature / File Management

---

## 1. Descripción
Permitir al usuario seleccionar y abrir archivos `.tex` locales existentes mediante el explorador del sistema operativo (**HU-02**, **RF-31**). El contenido del archivo seleccionado debe cargarse en el editor CodeMirror 6, activando la previsualización y reflejando el nombre y ruta del archivo en la interfaz.

## 2. Tareas Específicas
1. Conectar la acción "Abrir Archivo" al botón correspondiente en el menú lateral/superior y al atajo de teclado global `Ctrl+O` / `Cmd+O`.
2. Lanzar el diálogo nativo de Tauri (`open`) filtrando por extensiones `.tex`, `.latex`, `.txt`.
3. Leer el contenido del archivo en codificación UTF-8 usando `readTextFile`.
4. Actualizar el estado global del documento con:
   * Contenido del archivo.
   * Ruta completa del archivo (`filePath`).
   * Nombre de archivo visible en el header.
5. Gestionar errores: si el usuario cancela la selección, no alterar nada; si ocurre un error de lectura o permisos, mostrar notificación clara.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Al presionar `Ctrl+O` o hacer clic en "Abrir", se despliega el selector de archivos nativo de Linux/Windows/Mac filtrado por archivos `.tex`.
* [ ] El documento seleccionado se carga inmediatamente en CodeMirror y se renderiza en KaTeX sin demoras.
* [ ] El nombre del archivo se actualiza en la barra de título superior.
* [ ] Si el usuario cancela el diálogo, el documento actual no se pierde ni se reinicia.
