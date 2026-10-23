# TICKET-018: Menú Contextual Rápido Slash (/) y Atajos de Teclado

- **Milestone:** Sprint 4 — Rediseño Visual WYSIWYG ("PaperCraft") y Asistencia Interactiva (v0.2.0)
- **Estado:** 🟢 Cerrado
- **Prioridad:** Alta (P1)
- **Tipo:** Core Feature / UX

---

## 1. Descripción
Implementar un menú contextual desplegable al estilo de Notion (`SlashMenu.svelte`) activable al presionar la tecla `/` en una línea nueva o durante la redacción (**HU-08**, **HU-09**). Proveer un modal de referencia de atajos de teclado (`KeyboardHelpModal.svelte`) accesible mediante <kbd>Ctrl+?</kbd> o desde la barra superior.

## 2. Tareas Específicas
1. Diseñar el componente `SlashMenu.svelte`:
   * Despliegue contextual con filtro de búsqueda según lo que escriba el usuario (ej. `/h1`, `/math`, `/table`, `/callout`).
   * Elementos soportados:
     * Título 1 (`# `), Título 2 (`## `), Título 3 (`### `).
     * Fórmula Matemática en Bloque (`/math` o `/fx`).
     * Tabla Interactiva (`/table`).
     * Bloque Destacado / Callout (`> **Nota:**`).
     * Lista con viñetas (`- `) y lista numerada (`1. `).
     * Bloque de código con sintaxis resaltada.
   * Navegación por teclado (Flechas arriba/abajo, <kbd>Enter</kbd> para seleccionar, <kbd>Escape</kbd> para cancelar).
2. Desarrollar `KeyboardHelpModal.svelte`:
   * Listado de atajos globales: <kbd>Ctrl+S</kbd> (Guardar), <kbd>Ctrl+N</kbd> (Nuevo), <kbd>Ctrl+O</kbd> (Abrir), <kbd>Ctrl+Enter</kbd> o <kbd>Ctrl+B</kbd> (Compilar PDF), <kbd>Ctrl+?</kbd> (Ayuda).
3. Integrar la tecla `/` en el evento `onkeydown` / `oninput` de `PaperEditor.svelte`.

## 3. Criterios de Aceptación (Definition of Done)
* [x] Teclear `/` en el editor abre el menú contextual sin descolocar el cursor.
* [x] Seleccionar una opción reemplaza el comando de barra oblicua por la estructura seleccionada.
* [x] Presionar <kbd>Ctrl+?</kbd> abre el modal interactivo con la lista de atajos y teclas rápidas.
