# TICKET-020: Motor de Auto-Guardado Inteligente y Documento de Bienvenida

- **Milestone:** Sprint 4 — Rediseño Visual WYSIWYG ("PaperCraft") y Asistencia Interactiva (v0.2.0)
- **Estado:** 🟢 Cerrado
- **Prioridad:** Alta (P1)
- **Tipo:** Core Feature / Data Resilience & UX

---

## 1. Descripción
Implementar un sistema de auto-guardado seguro con interruptor configurable ON/OFF en la barra superior (Opción B) y guardado silencioso en memoria local y en disco (**HU-01**, **HU-03**, **RF-33**). Incorporar un documento de bienvenida interactivo (`welcomeDocument.ts`) que enseñe de forma práctica cómo utilizar las funciones de la aplicación desde el primer inicio.

## 2. Tareas Específicas
1. Diseñar el interruptor de auto-guardado en la barra superior:
   * Estado visual claro (verde cuando está activo, gris cuando está inactivo).
   * Almacenar la preferencia del usuario en `localStorage` (`layratex_autosave_enabled`).
2. Implementar lógica de debounce con `$effect` en Svelte 5:
   * Al detectar cambios en el contenido o título del documento, programar guardado automático tras 1.5 segundos de inactividad.
   * Persistir copia de seguridad del borrador en `localStorage` (`layratex_draft_content`, `layratex_draft_title`).
   * Si el documento ya tiene un archivo en disco (`currentFilePath`), guardar silenciosamente en segundo plano mediante `fileService.saveTexFile`.
   * Indicar hora del último guardado o estado "Guardando..." en la interfaz.
3. Crear el módulo `welcomeDocument.ts`:
   * Documento de bienvenida completo con ejemplos de redacción, fórmulas matemáticas KaTeX, tabla demostrativa y guía de exportación.
   * Carga inicial por defecto cuando no se ha abierto un archivo previo.

## 3. Criterios de Aceptación (Definition of Done)
* [x] El switch de auto-guardado permite activar o desactivar la funcionalidad conservando la preferencia en el navegador/app.
* [x] Si el auto-guardado está activo, los cambios se guardan tras 1.5s sin bloquear la interfaz ni mostrar diálogos invasivos.
* [x] Al abrir la app por primera vez, se carga el documento de bienvenida con ejemplos listos para experimentar.
