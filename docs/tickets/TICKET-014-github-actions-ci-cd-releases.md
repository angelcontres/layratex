# TICKET-014: Pipeline de CI/CD con GitHub Actions para Builds Multiplataforma

- **Milestone:** Sprint 3 — Empaquetado y Distribución
- **Estado:** 🟢 Cerrado
- **Prioridad:** Alta (P1)
- **Tipo:** DevOps / Automation

---

## 1. Descripción
Automatizar la compilación y empaquetado de ejecutables de Layratex para las tres plataformas principales (Linux, Windows y macOS) mediante GitHub Actions, permitiendo que cualquier persona descargue los instaladores directamente sin compilar código fuente.

## 2. Tareas Específicas
1. Crear el workflow `.github/workflows/release.yml`.
2. Configurar la matriz de compilación:
   * `ubuntu-22.04` (genera `.deb`, `.rpm`, `.AppImage`).
   * `windows-latest` (genera `.msi`, `.exe`).
   * `macos-latest` (genera `.dmg`).
3. Integrar la acción oficial `tauri-apps/tauri-action`.
4. Configurar el trigger para que se ejecute ante cualquier tag `v*` (ej. `v0.1.0`).
5. Publicar los binarios firmados como assets en la Release correspondiente de GitHub.

## 3. Criterios de Aceptación (Definition of Done)
* [x] Al crear un tag de versión y hacer push a GitHub, la acción compila exitosamente los binarios de los tres sistemas operativos.
* [x] Los instaladores quedan listos para descarga pública en GitHub Releases.
