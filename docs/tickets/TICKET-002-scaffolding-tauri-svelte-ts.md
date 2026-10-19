# TICKET-002: Inicialización del Proyecto Tauri 2.0 con Svelte 5, Vite y TypeScript

- **Milestone:** Sprint 0 — Scaffolding y Entorno Base
- **Estado:** ⚪ Pendiente
- **Prioridad:** Alta (Bloqueante)
- **Tipo:** Scaffolding

---

## 1. Descripción
Inicializar el proyecto base de escritorio de Layratex utilizando Tauri 2.0, Vite como empaquetador frontend ultra-rápido, Svelte 5 para reactividad nativa sin Virtual DOM, y TypeScript para garantizar seguridad estricta de tipos.

## 2. Tareas Específicas
1. Generar la estructura del proyecto con `npm create tauri-app@latest` o configuración equivalente.
2. Configurar `tauri.conf.json` con:
   * Identificador: `com.layratex.app`
   * Título de ventana: `Layratex — Editor Local-First P2P`
   * Dimensiones iniciales y comportamiento de ventana nativa.
3. Configurar TypeScript (`tsconfig.json`) con modo estricto.
4. Configurar TailwindCSS v4 o v3 con PostCSS para estilos atómicos de alto rendimiento y cero CSS residual.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] El proyecto compila y arranca en modo desarrollo con `npm run tauri dev`.
* [ ] La ventana nativa de escritorio se abre sin errores en la consola ni advertencias críticas.
* [ ] Los cambios en componentes Svelte se reflejan con Hot Module Replacement (HMR) instantáneo (< 50 ms).
