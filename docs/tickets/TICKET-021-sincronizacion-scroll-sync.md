# TICKET-021: Sincronización Proporcional de Scroll (Scroll Sync) entre Editor y Preview

- **Milestone:** Sprint 5 — Plantillas, Navegación y Productividad
- **Estado:** ⚪ Pendiente
- **Prioridad:** Media-Alta (P2)
- **Tipo:** UX / Navigation

---

## 1. Descripción
Cuando se redactan documentos extensos, perder la posición relativa entre el código fuente y el visor resulta frustrante. Se requiere sincronización de desplazamiento (*scroll sync*) suave y bidireccional entre el editor CodeMirror 6 y el panel de previsualización KaTeX / PDF (**HU-11**, **RF-13**, **RF-14**).

## 2. Tareas Específicas
1. Escuchar los eventos de scroll en CodeMirror (`EditorView.scrollDOM`).
2. Calcular la posición relativa proporcional (`scrollTop / (scrollHeight - clientHeight)`).
3. Aplicar el desplazamiento correspondiente en el contenedor del panel de preview (`previewScrollContainer`).
4. Implementar mecanismo de *lock* (candado temporal) para evitar bucles infinitos de rebote entre ambos scrolls.
5. Sincronización inversa (al scrollear el preview, ajustar el editor suavemente).
6. Agregar un botón de alternancia (*toggle switch*) en la barra de estado para activar o pausar la sincronización a gusto del usuario.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Al desplazarse verticalmente en el editor de código, la vista previa avanza de forma proporcional sin saltos bruscos.
* [ ] Al desplazarse en la vista previa, el editor se ajusta proporcionalmente sin entrar en ciclo recursivo.
* [ ] La sincronización se puede activar o desactivar con un botón en la barra de estado.
