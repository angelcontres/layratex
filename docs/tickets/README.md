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

## Milestone 1: Sprint 0 — Scaffolding y Entorno Base

| Ticket | Título | Estado | Asignado |
| :---: | :--- | :---: | :---: |
| [TICKET-001](./TICKET-001-setup-entorno-rust-tauri.md) | Configuración del entorno de desarrollo (Rust + dependencias de sistema Fedora) | 🟡 En progreso | Ángel & Antigravity |
| [TICKET-002](./TICKET-002-scaffolding-tauri-svelte-ts.md) | Inicialización del proyecto Tauri 2.0 con Svelte 5, Vite y TypeScript | ⚪ Pendiente | — |
| [TICKET-003](./TICKET-003-layout-base-shell-ui.md) | Maquetación del Shell de la aplicación (Sidebar, Panel Editor, Panel Preview, Barra de Estado) | ⚪ Pendiente | — |
| [TICKET-004](./TICKET-004-integracion-codemirror6-latex.md) | Montaje del editor CodeMirror 6 con resaltado de sintaxis LaTeX y atajos | ⚪ Pendiente | — |
| [TICKET-005](./TICKET-005-preview-reactivo-katex.md) | Pipeline de vista previa reactiva instantánea con KaTeX (< 50 ms) | ⚪ Pendiente | — |
