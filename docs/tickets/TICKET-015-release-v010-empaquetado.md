# TICKET-015: Release Inicial v0.1.0 y Documentación de Instalación

- **Milestone:** Sprint 3 — Empaquetado y Distribución
- **Estado:** 🟢 Cerrado
- **Prioridad:** Alta (P1)
- **Tipo:** Release / Documentation

---

## 1. Descripción
Preparar el lanzamiento público `v0.1.0` de Layratex con metadatos actualizados, notas de la versión (*Release Notes*), capturas de pantalla de la aplicación y guía de instalación clara en el `README.md` para usuarios finales (**RF-31 al RF-40**).

## 2. Tareas Específicas
1. Sincronizar versiones en `package.json`, `src-tauri/Cargo.toml` y `src-tauri/tauri.conf.json`.
2. Redactar notas de la versión destacando las capacidades del MVP:
   * Rendimiento ultra-rápido en Svelte 5 + Rust.
   * Renderizado matemático KaTeX en tiempo real (< 10 ms).
   * Edición y persistencia local de archivos `.tex`.
   * Exportación a PDF nativo.
3. Actualizar `README.md` con enlaces de descarga directa hacia GitHub Releases para Linux, Windows y macOS.
4. Crear la etiqueta git `v0.1.0`.

## 3. Criterios de Aceptación (Definition of Done)
* [x] El repositorio cuenta con el tag oficial `v0.1.0`.
* [x] La documentación en `README.md` explica en menos de 3 pasos cómo instalar y ejecutar la aplicación en cualquier sistema operativo.
