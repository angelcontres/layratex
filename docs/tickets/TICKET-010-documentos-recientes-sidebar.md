# TICKET-010: Historial de Documentos Recientes en Sidebar

- **Milestone:** Sprint 1 — Persistencia y Sistema de Archivos
- **Estado:** 🟢 Cerrado
- **Prioridad:** Media (P2)
- **Tipo:** UX / Navigation

---

## 1. Descripción
Permitir al usuario acceder con rapidez a los últimos archivos `.tex` abiertos o guardados directamente desde la barra lateral izquierda (**HU-02**, **RF-31**). El historial debe persistir entre reinicios de la aplicación.

## 2. Tareas Específicas
1. Diseñar el almacén de archivos recientes (`recentFiles`) en almacenamiento local persistente (máximo 10 elementos ordenados por último acceso).
2. Cada entrada debe contener: `name`, `path` y `lastOpened`.
3. Renderizar la lista interactiva de archivos recientes en la pestaña "Explorador" del Sidebar.
4. Al hacer clic en un archivo reciente:
   * Verificar existencia del archivo; si no existe, notificar y permitir removerlo de la lista.
   * Si existe y hay cambios sin guardar en el documento activo, pedir confirmación; luego cargarlo.
5. Permitir limpiar el historial de recientes.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Al abrir o guardar un archivo, se añade automáticamente a la cabecera de la lista de recientes.
* [ ] La lista persiste tras cerrar y volver a abrir la aplicación.
* [ ] Hacer clic en cualquier elemento de la lista abre ese documento inmediatamente en el editor.
