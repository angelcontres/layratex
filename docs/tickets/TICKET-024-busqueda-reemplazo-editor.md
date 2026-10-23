# TICKET-024: Panel de Búsqueda y Reemplazo Integrado en el Editor

- **Milestone:** Sprint 5 — Navegación y Productividad Avanzada (v0.3.0)
- **Estado:** ⚪ Pendiente
- **Prioridad:** Media (P2)
- **Tipo:** Core Feature / Editor DX

---

## 1. Descripción
Integrar la extensión oficial `@codemirror/search` en `LatexEditor.svelte` y proveer un panel de búsqueda rápido flotante con atajos estándar de teclado <kbd>Ctrl+F</kbd> y <kbd>Ctrl+H</kbd> (**HU-04**, **RF-27**). Permitirá buscar texto, coincidencia exacta o expresiones regulares, y reemplazar ocurrencias de forma individual o masiva.

## 2. Tareas Específicas
1. Instalar y habilitar `@codemirror/search` con `searchKeymap`.
2. Estilizar el panel flotante de búsqueda con la paleta de colores oscura del tema de Layratex.
3. Permitir búsqueda por distinción de mayúsculas/minúsculas (*case-sensitive*) y regex.
4. Mostrar contador reactivo de ocurrencias encontradas (ej. `3 de 15`).

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Presionar <kbd>Ctrl+F</kbd> abre el diálogo de búsqueda en el editor.
* [ ] Presionar <kbd>Ctrl+H</kbd> despliega los campos de buscar y reemplazar.
* [ ] Reemplazar todo sustituye todas las coincidencias sin romper el historial de deshacer (<kbd>Ctrl+Z</kbd>).
