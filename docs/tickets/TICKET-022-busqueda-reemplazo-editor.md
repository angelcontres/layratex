# TICKET-022: Panel de Búsqueda y Reemplazo Integrado en el Editor

- **Milestone:** Sprint 5 — Plantillas, Navegación y Productividad
- **Estado:** ⚪ Pendiente
- **Prioridad:** Media (P2)
- **Tipo:** Editor Feature / Productivity

---

## 1. Descripción
Dotar al editor de un panel flotante de búsqueda y reemplazo moderno integrado con CodeMirror 6 mediante los atajos universales <kbd>Ctrl+F</kbd> y <kbd>Ctrl+H</kbd> (**HU-04**, **RF-02**).

## 2. Tareas Específicas
1. Integrar el paquete oficial `@codemirror/search`.
2. Personalizar visualmente la barra de búsqueda para que adopte la estética oscura minimalista de Layratex.
3. Habilitar atajos de teclado estándar:
   * <kbd>Ctrl+F</kbd>: Abrir búsqueda.
   * <kbd>Ctrl+H</kbd>: Abrir búsqueda y reemplazo.
   * <kbd>Esc</kbd>: Cerrar panel y devolver foco al editor.
   * <kbd>Enter</kbd> / <kbd>Shift+Enter</kbd>: Ir a la siguiente / anterior coincidencia.
4. Mostrar indicador interactivo de coincidencias (ej: `3 de 14 resultados`).
5. Botones para "Reemplazar" y "Reemplazar Todo" con confirmación.
6. Opciones de búsqueda: Sensible a mayúsculas/minúsculas (*Match Case*) y Expresiones Regulares (*Regex*).

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Al presionar <kbd>Ctrl+F</kbd>, aparece la barra de búsqueda y resalta todas las coincidencias en el documento.
* [ ] Al presionar <kbd>Ctrl+H</kbd>, se despliega el campo de reemplazo con opciones de reemplazo individual y total.
