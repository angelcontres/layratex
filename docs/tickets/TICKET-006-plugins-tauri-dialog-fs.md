# TICKET-006: Instalación y Configuración de Plugins Nativos Tauri (dialog y fs)

- **Milestone:** Sprint 1 — Persistencia y Sistema de Archivos
- **Estado:** 🟢 Cerrado
- **Prioridad:** Bloqueante (P1)
- **Tipo:** Infraestructura / Tauri Native

---

## 1. Descripción
Configurar las dependencias y permisos de Tauri 2.0 para interactuar con el sistema de archivos del sistema operativo anfitrión (Linux, Windows, macOS). Se requiere habilitar diálogos nativos para abrir/guardar archivos y capacidades seguras de lectura/escritura en el disco local (**RNF-01**, **RF-31**, **RF-32**).

## 2. Tareas Específicas
1. Instalar las dependencias de Tauri 2.0:
   * Backend (Cargo.toml): `tauri-plugin-dialog = "2"`, `tauri-plugin-fs = "2"`
   * Frontend (package.json): `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`
2. Inicializar los plugins en `src-tauri/src/lib.rs` dentro de `tauri::Builder`.
3. Configurar la lista de permisos de seguridad en `src-tauri/capabilities/default.json` (`dialog:default`, `fs:default`, `fs:allow-read-text-file`, `fs:allow-write-text-file`).
4. Crear un servicio TypeScript encapsulado (`src/lib/services/fileService.ts`) con funciones asíncronas seguras y fallback para entornos web en desarrollo.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Ambos plugins compilan sin warnings ni errores de dependencias tanto en Rust como en Vite/TypeScript.
* [ ] Se puede invocar un diálogo de prueba nativo en el sistema operativo sin fallos de permisos CSP o de capability.
