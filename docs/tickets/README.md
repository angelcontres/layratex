# Tablero de Tickets de Implementación — Layratex

Este directorio gestiona la descomposición atómica de tareas para la fase de implementación de **Layratex**, priorizando rendimiento extremo, bajo consumo de recursos y modularidad.

---

## Stack Tecnológico Oficial (Alto Rendimiento)

* **Desktop Shell & Backend Core:** **Tauri 2.0 (Rust)**
* **Frontend UI:** **Svelte 5 + Vite + TypeScript + TailwindCSS**
* **Editor de Código:** **CodeMirror 6** (con extensiones de virtualización y sintaxis LaTeX)
* **Motor Matemático Reactivo:** **KaTeX** (renderizado síncrono < 5 ms)
* **Motor CRDT:** **Yjs** (vía bindings nativos de Rust / WASM para Y-CRDT)
* **Red P2P:** **WebRTC DataChannels / libp2p** con cifrado **Noise Protocol / ChaCha20-Poly1305**

---

## Milestone 1: Sprint 0 — Scaffolding y Entorno Base (Completado)

| Ticket | Título | Estado | Prioridad |
| :---: | :--- | :---: | :---: |
| [TICKET-001](./TICKET-001-setup-entorno-rust-tauri.md) | Configuración del entorno de desarrollo (Rust + dependencias de sistema Fedora) | 🟢 Cerrado | Alta |
| [TICKET-002](./TICKET-002-scaffolding-tauri-svelte-ts.md) | Inicialización del proyecto Tauri 2.0 con Svelte 5, Vite y TypeScript | 🟢 Cerrado | Alta |
| [TICKET-003](./TICKET-003-layout-base-shell-ui.md) | Maquetación del Shell de la aplicación (Sidebar, Panel Editor, Panel Preview, Barra de Estado) | 🟢 Cerrado | Alta |
| [TICKET-004](./TICKET-004-integracion-codemirror6-latex.md) | Montaje del editor CodeMirror 6 con resaltado de sintaxis LaTeX y atajos | 🟢 Cerrado | Alta |
| [TICKET-005](./TICKET-005-preview-reactivo-katex.md) | Pipeline de vista previa reactiva instantánea con KaTeX (< 50 ms) | 🟢 Cerrado | Alta |

---

## Milestone 2: Sprint 1 — Persistencia y Sistema de Archivos (Completado)

> **Meta del Sprint:** Transformar Layratex en un editor funcional con acceso al sistema de archivos local del sistema operativo anfitrión.

| Ticket | Título | Estado | Prioridad | Estimación |
| :---: | :--- | :---: | :---: | :---: |
| [TICKET-006](./TICKET-006-plugins-tauri-dialog-fs.md) | Instalación y configuración de plugins nativos Tauri (`dialog` y `fs`) | 🟢 Cerrado | Bloqueante (P1) | 2 SP |
| [TICKET-007](./TICKET-007-apertura-archivos-tex.md) | Diálogos y apertura de archivos locales (`.tex`) con atajo `Ctrl+O` | 🟢 Cerrado | Alta (P1) | 3 SP |
| [TICKET-008](./TICKET-008-guardado-archivos-shortcuts.md) | Guardado de archivos y atajos (`Ctrl+S`, `Ctrl+Shift+S`) | 🟢 Cerrado | Alta (P1) | 3 SP |
| [TICKET-009](./TICKET-009-dirty-state-nuevo-documento.md) | Detección de estado sucio (*dirty state*) y diálogo para nuevo documento (`Ctrl+N`) | 🟢 Cerrado | Media-Alta (P2) | 2 SP |
| [TICKET-010](./TICKET-010-documentos-recientes-sidebar.md) | Historial de documentos recientes en la barra lateral con persistencia | 🟢 Cerrado | Media (P2) | 2 SP |

---

## Milestone 3: Sprint 2 — Compilación a PDF y Exportación (Cierre del MVP)

> **Meta del Sprint:** Ejecutar el motor LaTeX real en segundo plano y generar el documento `.pdf` definitivo.

| Ticket | Título | Estado | Prioridad | Estimación |
| :---: | :--- | :---: | :---: | :---: |
| [TICKET-011](./TICKET-011-motor-compilacion-latex-backend.md) | Comando Tauri backend para compilación LaTeX en Rust (`tectonic` / `pdflatex`) | 🟢 Cerrado | Bloqueante (P1) | 8 SP |
| [TICKET-012](./TICKET-012-exportacion-pdf-pipeline.md) | Pipeline de compilación, visor y exportación de PDF con `Ctrl+B` | ⚪ Pendiente | Alta (P1) | 5 SP |
| [TICKET-013](./TICKET-013-panel-errores-compilacion.md) | Captura y parseo de errores del compilador con salto a la línea afectada | ⚪ Pendiente | Media-Alta (P2) | 5 SP |

---

## Milestone 4: Sprint 3 — Empaquetado, CI/CD y Distribución Pública (v0.1.0)

> **Meta del Sprint:** Generar los instaladores nativos para Windows, Linux y Mac descargables desde GitHub Releases.

| Ticket | Título | Estado | Prioridad | Estimación |
| :---: | :--- | :---: | :---: | :---: |
| [TICKET-014](./TICKET-014-github-actions-ci-cd-releases.md) | Pipeline de CI/CD con GitHub Actions para compilación multiplataforma automática | ⚪ Pendiente | Alta (P1) | 5 SP |
| [TICKET-015](./TICKET-015-release-v010-empaquetado.md) | Preparación de release inicial v0.1.0, metadatos y guía de instalación | ⚪ Pendiente | Alta (P1) | 3 SP |
