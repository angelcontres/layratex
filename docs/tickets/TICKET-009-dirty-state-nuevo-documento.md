# TICKET-009: Detección de Estado Sucio (Dirty State) y Nuevo Documento

- **Milestone:** Sprint 1 — Persistencia y Sistema de Archivos
- **Estado:** 🟢 Cerrado
- **Prioridad:** Media-Alta (P2)
- **Tipo:** UX / Safety & Integrity

---

## 1. Descripción
Evitar la pérdida accidental de datos alertando al usuario cuando intenta crear un nuevo documento, abrir otro o cerrar la ventana si existen modificaciones no guardadas (**HU-01**, **RF-34**, **RF-35**). Proveer la acción "Nuevo Documento" con una plantilla inicial LaTeX lista para compilar.

## 2. Tareas Específicas
1. Implementar la bandera reactiva `isDirty` (`currentContent !== savedContent`).
2. Indicar visualmente el estado sucio en el encabezado (ej. `● main.tex` o `main.tex*`).
3. Conectar la acción "Nuevo Documento" (`Ctrl+N` / botón `+` en Sidebar):
   * Si `isDirty` es verdadero, mostrar un diálogo de confirmación: "¿Deseas descartar los cambios no guardados?".
   * Al confirmar o si no está sucio, restablecer el contenido a la plantilla estándar LaTeX y poner `filePath` en `null`.
4. Registrar un handler en el evento de cierre de ventana de Tauri (`onCloseRequested`) para advertir si hay cambios sin guardar.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Modificar una letra en el editor activa el indicador visual de modificaciones pendientes.
* [ ] Al guardar (`Ctrl+S`), el indicador de modificaciones pendientes desaparece automáticamente.
* [ ] Crear un nuevo documento cuando hay cambios sin guardar solicita confirmación explícita para evitar pérdida de datos.
