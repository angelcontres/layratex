# TICKET-001: Configuración del Entorno de Desarrollo (Rust + Tauri en Fedora Linux)

- **Milestone:** Sprint 0 — Scaffolding y Entorno Base
- **Estado:** 🟡 En progreso
- **Prioridad:** Alta (Bloqueante)
- **Tipo:** Tarea de Infraestructura / Spike

---

## 1. Descripción
Para compilar y ejecutar aplicaciones nativas de escritorio ultra-optimizadas con Tauri 2.0 en Fedora Linux, se requiere instalar el toolchain de Rust (`rustup`, `cargo`, `rustc`) y las librerías del sistema operativo necesarias para compilar el WebView nativo (WebKitGTK) y sockets de red.

## 2. Requisitos Previos y Dependencias a Instalar
1. **Rust Toolchain:**
   * `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`
2. **Dependencias del Sistema (Fedora Linux):**
   * Paquetes de desarrollo para WebKit y compilación C:
     `sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget libappindicator-gtk3-devel librsvg2-devel gcc gcc-c++ make`

## 3. Criterios de Aceptación (Definition of Done)
* [ ] `rustc --version` devuelve una versión estable moderna (>= 1.75).
* [ ] `cargo --version` está disponible en el `PATH`.
* [ ] Las librerías de `webkit2gtk4.1` y `openssl` están resueltas sin errores en el sistema.
* [ ] `cargo create-tauri-app --version` o `npx @tauri-apps/cli --version` se ejecuta correctamente.
