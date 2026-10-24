# TICKET-023: Sincronización Proporcional de Scroll Bidireccional (Scroll Sync)

- **Milestone:** Sprint 5 — Navegación y Productividad Avanzada (v0.3.0)
- **Estado:** 🟢 Completado
- **Prioridad:** Media-Alta (P2)
- **Tipo:** Core Feature / UX

---

## 1. Descripción
Implementar sincronización proporcional de desplazamiento (*scroll sync*) bidireccional entre el editor de código CodeMirror 6 y el panel de vista previa KaTeX / visor de PDF (**HU-21**, **RF-29**). Al desplazarse por el código fuente, la vista previa debe acompañar suavemente la posición del lector y viceversa, evitando bucles infinitos de eventos de scroll.

## 2. Tareas Específicas
1. Calcular la posición porcentual de scroll en el contenedor activo (`scrollTop / (scrollHeight - clientHeight)`).
2. Sincronizar proporcionalmente la posición en el panel secundario.
3. Añadir bandera de control (`isScrollingViaSync`) con debounce de 100 ms para evitar bucles de retroalimentación mutua.
4. Botón en la barra de herramientas para activar o desactivar la sincronización de scroll a preferencia del usuario.

## 3. Criterios de Aceptación (Definition of Done)
* [x] Al desplazarse en el editor de código, el panel de preview acompaña proporcionalmente la sección correspondiente.
* [x] No existen tirones (*jittering*) ni bucles recursivos entre ambos paneles.
* [x] Se puede deshabilitar la sincronización mediante un conmutador rápido.
