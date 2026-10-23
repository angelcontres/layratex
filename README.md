# Layratex — Local-First P2P Hybrid LaTeX Editor

<p align="center">
  <img src="src/assets/hero.png" alt="Layratex Logo" width="160" />
</p>

<p align="center">
  <strong>Editor de documentos técnicos LaTeX híbrido, de ultra-alto rendimiento, reactivo y local-first.</strong>
</p>

<p align="center">
  <a href="https://github.com/angelcontres/layratex/releases/tag/v0.1.0"><img src="https://img.shields.io/badge/release-v0.1.0-blue.svg" alt="Release v0.1.0" /></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-2.0-orange.svg" alt="Tauri 2.0" /></a>
  <a href="https://svelte.dev/"><img src="https://img.shields.io/badge/Svelte-5-red.svg" alt="Svelte 5" /></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-1.90+-brown.svg" alt="Rust" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" /></a>
</p>

---

## ⚡ Novedades de la Versión v0.1.0 (MVP)

* **Rendimiento Nativo Extremo:** Desarrollado sobre **Tauri 2.0 (Rust)** y **Svelte 5 + Vite**, garantizando tiempos de inicio inmediatos y bajo consumo de memoria RAM (< 80 MB).
* **Renderizado Matemático en Tiempo Real (< 10 ms):** Motor reactivo basado en **KaTeX** que sincroniza fórmulas matemáticas instantáneamente mientras redactas.
* **Editor CodeMirror 6:** Resaltado de sintaxis LaTeX completo, numeración de líneas, atajos de teclado y panel de estado sucio (*dirty state*).
* **Persistencia Local Segura:** Apertura y guardado de archivos locales `.tex`, gestión de historial de documentos recientes y diálogo nativo de confirmación ante cambios no guardados.
* **Compilación a PDF Nativo:** Detección automática en Rust de motores instalados (`tectonic`, `pdflatex`, `latexmk`, `xelatex`) con exportación directa y atajo `Ctrl+B`.
* **Panel de Diagnóstico y Errores:** Parseo inteligente del log del compilador con salto directo a la línea afectada al hacer clic en el error.

---

## 📦 Descargas (GitHub Releases)

Descarga el instalador listo para usar correspondiente a tu sistema operativo desde la [Página de Releases de Layratex v0.1.0](https://github.com/angelcontres/layratex/releases/tag/v0.1.0):

| Plataforma | Paquete / Formato | Enlace de Descarga Directa |
| :--- | :--- | :--- |
| **Linux (Universal)** | `.AppImage` | [Descargar `.AppImage`](https://github.com/angelcontres/layratex/releases/download/v0.1.0/layratex_0.1.0_amd64.AppImage) |
| **Linux (Debian / Ubuntu)** | `.deb` | [Descargar `.deb`](https://github.com/angelcontres/layratex/releases/download/v0.1.0/layratex_0.1.0_amd64.deb) |
| **Linux (Fedora / RHEL)** | `.rpm` | [Descargar `.rpm`](https://github.com/angelcontres/layratex/releases/download/v0.1.0/layratex-0.1.0-1.x86_64.rpm) |
| **Windows (Instalador)** | `.exe` (NSIS) | [Descargar `.exe`](https://github.com/angelcontres/layratex/releases/download/v0.1.0/layratex_0.1.0_x64-setup.exe) |
| **Windows (MSI)** | `.msi` | [Descargar `.msi`](https://github.com/angelcontres/layratex/releases/download/v0.1.0/layratex_0.1.0_x64_en-US.msi) |
| **macOS (Universal)** | `.dmg` (Apple Silicon & Intel) | [Descargar `.dmg`](https://github.com/angelcontres/layratex/releases/download/v0.1.0/layratex_0.1.0_universal.dmg) |

---

## 🚀 Guía de Instalación Rápida

Instala y ejecuta Layratex en tu máquina en **3 sencillos pasos**:

### 🐧 Linux (AppImage)
1. **Descarga** el archivo `layratex_0.1.0_amd64.AppImage`.
2. **Otorga permisos de ejecución** desde terminal:
   ```bash
   chmod +x layratex_0.1.0_amd64.AppImage
   ```
3. **Ejecuta** el archivo:
   ```bash
   ./layratex_0.1.0_amd64.AppImage
   ```
   *(O haz doble clic sobre el archivo en tu explorador de archivos).*

> **Para `.deb` (Ubuntu/Debian):** `sudo dpkg -i layratex_0.1.0_amd64.deb`  
> **Para `.rpm` (Fedora/RHEL):** `sudo rpm -i layratex-0.1.0-1.x86_64.rpm`

---

### 🪟 Windows
1. **Descarga** el instalador `layratex_0.1.0_x64-setup.exe` (o el paquete `.msi`).
2. **Ejecuta el archivo** descargado y sigue el asistente de instalación.
3. **Abre Layratex** desde el menú Inicio o el acceso directo en el Escritorio.

---

### 🍏 macOS
1. **Descarga** la imagen de disco `layratex_0.1.0_universal.dmg`.
2. **Abre el `.dmg`** y arrastra el ícono de **Layratex** hacia la carpeta **Aplicaciones**.
3. **Abre Layratex** desde tu carpeta de Aplicaciones o Spotlight.

---

## ⌨️ Atajos de Teclado Principales

| Atajo | Acción |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> (o <kbd>Cmd</kbd>+<kbd>N</kbd>) | Crear un nuevo documento LaTeX |
| <kbd>Ctrl</kbd> + <kbd>O</kbd> (o <kbd>Cmd</kbd>+<kbd>O</kbd>) | Abrir un archivo local `.tex` |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> (o <kbd>Cmd</kbd>+<kbd>S</kbd>) | Guardar documento actual |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Guardar documento como... |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> (o <kbd>Cmd</kbd>+<kbd>B</kbd>) | Compilar código a PDF nativo |

---

## 🛠️ Compilación y Desarrollo Local

Si deseas compilar Layratex directamente desde el código fuente:

### Requisitos Previos
* **Node.js** (v18 o superior) y **npm**
* **Rust Toolchain** (Rust 1.80+ y Cargo): `rustup default stable`
* **Dependencias de sistema en Linux (Fedora/Ubuntu):**
  * Ubuntu/Debian: `sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`
  * Fedora: `sudo dnf install webkit2gtk4.1-devel libayatana-appindicator-devel librsvg2-devel`

### Instrucciones
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/angelcontres/layratex.git
   cd layratex
   ```
2. Instalar dependencias del frontend:
   ```bash
   npm install
   ```
3. Ejecutar en modo desarrollo:
   ```bash
   npm run tauri dev
   ```
4. Generar instaladores de producción:
   ```bash
   npm run tauri build
   ```

---

## 📚 Documentación de Arquitectura y Diseño

* **Especificaciones y Requisitos:**
  * [Contexto y Necesidad del Usuario](docs/Context-necesidad.md)
  * [Requerimientos Funcionales (RF-01 al RF-62)](docs/requerimiento-funcional.md)
  * [Requerimientos No Funcionales (RNF-01 al RNF-10)](docs/requerimiento-no-funcional.md)
  * [Backlog de Tareas](docs/backlog.md)
* **Documento de Diseño de Software (SDD):**
  * Directorio central: [`docs/SDD/`](docs/SDD/README.md)
  * [01 — Introducción y Alcance](docs/SDD/01-introduccion-y-alcance.md)
  * [02 — Arquitectura C4](docs/SDD/02-arquitectura-c4.md)
  * [03 — Modelo de Dominio DDD](docs/SDD/03-modelo-de-dominio-ddd.md)
  * [04 — Protocolo P2P y Red](docs/SDD/04-protocolo-p2p-y-red.md)
  * [05 — Modelo de Datos y CRDT](docs/SDD/05-modelo-de-datos-y-crdt.md)
  * [06 — Motor LaTeX y Pipeline](docs/SDD/06-motor-latex-y-pipeline.md)
  * [07 — Seguridad y Criptografía](docs/SDD/07-seguridad-y-criptografia.md)
  * [08 — Plataforma y Despliegue](docs/SDD/08-plataforma-y-despliegue.md)
* **Decisiones de Arquitectura (ADR):**
  * [ADR-001: Arquitectura Local-First y CRDT](docs/ADR/ADR-001-arquitectura-local-first-y-crdt.md)
  * [ADR-002: Transporte P2P y Hole Punching](docs/ADR/ADR-002-transporte-p2p-y-hole-punching.md)
  * [ADR-003: Emparejamiento Criptográfico de Dispositivos](docs/ADR/ADR-003-emparejamiento-criptografico-de-dispositivos.md)
  * [ADR-004: Selección del Stack Tecnológico](docs/ADR/ADR-004-seleccion-stack-tecnologico.md)
* **Seguimiento de Implementación:**
  * [Tablero de Tickets](docs/tickets/README.md)

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más información.
