# Layratex — Local-First P2P Hybrid LaTeX Editor

<p align="center">
  <img src="src/assets/hero.png" alt="Layratex Logo" width="160" />
</p>

<p align="center">
  <strong>Editor de documentos científicos y técnicos LaTeX híbrido, de ultra-alto rendimiento, reactivo y local-first.</strong>
</p>

<p align="center">
  <a href="https://github.com/angelcontres/layratex/releases"><img src="https://img.shields.io/badge/version-v0.3.0-indigo.svg" alt="Version v0.3.0" /></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-2.0-orange.svg" alt="Tauri 2.0" /></a>
  <a href="https://svelte.dev/"><img src="https://img.shields.io/badge/Svelte-5-red.svg" alt="Svelte 5" /></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-1.90+-brown.svg" alt="Rust" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" /></a>
</p>

---

## ✨ Características Principales (v0.3.0)

* **Estética Canónica LaTeX (`\documentclass[12pt,a4paper]{article}`):** Hoja A4 física con tipografía oficial **Computer Modern Roman (`CMU Serif`)**, sangría francesa de primera línea (`1.5em`), justificación con guionado automático, secciones numeradas (`1`, `1.1`, `1.1.1`), ecuaciones numeradas a la derecha `(1)` y entornos académicos **AMS (`Teorema`, `Definición`, `Lema`, `Demostración` con símbolo Q.E.D. `∎`)**.
* **Exportación Nativa a Microsoft Word (`.docx` con Office Math OMML):** Generador OpenXML puro que exporta tus documentos LaTeX a `.docx` con **ecuaciones matemáticas 100 % editables en Word (`<m:oMath>`)**, tablas académicas estilo `booktabs` (`\toprule`, `\midrule`, `\bottomrule`) y bloques de teoremas numerados.
* **Compilación Dual a PDF (Nativa + Motor Tipográfico Autónomo):** Compila con motores locales (`tectonic`, `pdflatex`, `latexmk`, `xelatex`) o genera el PDF A4 directamente desde el motor autónomo de Layratex sin requerir instalación previa de TeX Live o MiKTeX.
* **Apertura y Guardado Robusto de Archivos `.tex`:** Lectura/escritura nativa en Rust (`fs_ops.rs`) con preservación de preámbulos personalizados (`\usepackage{...}`), soporte de llaves anidadas en `\title{...}` y `\author{...}`, volcado automático del bloque activo antes de guardar (`flushActiveBlock`) y auto-guardado reactivo.
* **Edición Híbrida Sincronizada (`Hoja LaTeX` ⇄ `Código .tex`):** Alterna instantáneamente entre el lienzo visual A4 y el editor **CodeMirror 6** con autocompletado inteligente, búsqueda y reemplazo (`Ctrl+F` / `Ctrl+H`), vista previa **KaTeX (< 10 ms)** y *Scroll Sync* proporcional.

* **PaperCraft:** rediseño del espacio de trabajo y edición visual con exportación a PDF.
* **Edición más ágil:** búsqueda y reemplazo, autocompletado, cierre automático de entornos y snippets.
* **Vista previa sincronizada:** desplazamiento proporcional entre código y documento renderizado.
* **Tipografía:** familia Computer Modern / CMU Serif.

---

## 🗂️ Arquitectura Organizacional del Proyecto

Layratex sigue una arquitectura modular por dominios con barriles de exportación (`index.ts`) en el frontend y módulos nativos separados en Rust. Consulta el detalle completo en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

```text
layratex/
├── docs/                       # Documentación de arquitectura (ARCHITECTURE.md, SDD, ADR, tickets)
├── src/                        # Frontend Reactivo (Svelte 5 + TypeScript + TailwindCSS)
│   ├── App.svelte              # Orquestador principal del espacio de trabajo
│   └── lib/
│       ├── editor/             # Editor CodeMirror 6 + autocompletado y snippets LaTeX
│       ├── preview/            # Previsualizador KaTeX en tiempo real (< 10 ms) + visor PDF
│       ├── visual/             # Lienzo A4 "PaperCraft", transpilador LaTeX ⇄ Visual y constructores
│       ├── services/           # Servicios (.tex I/O, exportador Word .docx OMML, PDF, ScrollSync, logs)
│       └── ui/                 # Shell de interfaz (Sidebar, WorkspaceDrawer, StatusBar, ExportModals)
└── src-tauri/                  # Backend Nativo (Rust + Tauri 2.0)
    └── src/
        ├── lib.rs              # Registro de comandos IPC de Tauri
        ├── compiler.rs         # Pipeline de compilación LaTeX (tectonic, pdflatex, xelatex, latexmk)
        └── fs_ops.rs           # Persistencia nativa de archivos .tex, .pdf y .docx
```

---

## ⌨️ Atajos de Teclado Principales

| Atajo | Acción |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> (o <kbd>Cmd</kbd>+<kbd>N</kbd>) | Crear un nuevo documento LaTeX |
| <kbd>Ctrl</kbd> + <kbd>O</kbd> (o <kbd>Cmd</kbd>+<kbd>O</kbd>) | Abrir un archivo local `.tex` |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> (o <kbd>Cmd</kbd>+<kbd>S</kbd>) | Guardar documento `.tex` actual |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Guardar documento `.tex` como... |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> / <kbd>Ctrl</kbd> + <kbd>B</kbd> / <kbd>F5</kbd> | Compilar y exportar a **PDF** |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>W</kbd> | Exportar a **Microsoft Word (`.docx`)** con ecuaciones OMML |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> / <kbd>Ctrl</kbd> + <kbd>H</kbd> | Buscar / Buscar y reemplazar en hoja visual o código `.tex` |
| `/` (al inicio de una línea en Hoja LaTeX) | Abrir menú rápido de bloques LaTeX (Secciones, Ecuaciones, Tablas, Teoremas) |

---

## 📦 Descargas (GitHub Releases)

Descarga el instalador listo para usar correspondiente a tu sistema operativo desde la [Página de Releases de Layratex](https://github.com/angelcontres/layratex/releases):

| Plataforma | Paquete / Formato | Enlace de Descarga Directa |
| :--- | :--- | :--- |
| **Linux (Universal)** | `.AppImage` | [Descargar `.AppImage`](https://github.com/angelcontres/layratex/releases/download/v0.2.0/layratex_0.2.0_amd64.AppImage) |
| **Linux (Debian / Ubuntu)** | `.deb` | [Descargar `.deb`](https://github.com/angelcontres/layratex/releases/download/v0.2.0/layratex_0.2.0_amd64.deb) |
| **Linux (Fedora / RHEL)** | `.rpm` | [Descargar `.rpm`](https://github.com/angelcontres/layratex/releases/download/v0.2.0/layratex-0.2.0-1.x86_64.rpm) |
| **Windows (Instalador)** | `.exe` (NSIS) | [Descargar `.exe`](https://github.com/angelcontres/layratex/releases/download/v0.2.0/layratex_0.2.0_x64-setup.exe) |
| **Windows (MSI)** | `.msi` | [Descargar `.msi`](https://github.com/angelcontres/layratex/releases/download/v0.2.0/layratex_0.2.0_x64_en-US.msi) |
| **macOS (Universal)** | `.dmg` (Apple Silicon & Intel) | [Descargar `.dmg`](https://github.com/angelcontres/layratex/releases/download/v0.2.0/layratex_0.2.0_universal.dmg) |

---

## 🛠️ Compilación, Pruebas y Desarrollo Local

### Requisitos Previos
* **Node.js** (v18 o superior) y **npm**
* **Rust Toolchain** (Rust 1.80+ y Cargo): `rustup default stable`
* **Dependencias de sistema en Linux (Fedora/Ubuntu):**
  * Ubuntu/Debian: `sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`
  * Fedora: `sudo dnf install webkit2gtk4.1-devel libayatana-appindicator-devel librsvg2-devel`

### Comandos Principales
```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar suite completa de pruebas unitarias (TypeScript + Conversor + Exportador Word + Logs)
npm test

# 3. Verificar tipado estricto (Svelte 5 + TypeScript)
npm run check

# 4. Ejecutar en modo desarrollo con Tauri
npm run tauri dev

# 5. Generar instaladores nativos de producción
npm run tauri build
```

---

## 📚 Documentación de Arquitectura y Diseño

* **Arquitectura Organizacional del Código:**
  * [Guía de Arquitectura Organizacional y Módulos (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md)
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
  * [06 — Motor LaTeX, Exportación PDF/Word y Pipeline](docs/SDD/06-motor-latex-y-pipeline.md)
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

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [`LICENSE`](LICENSE) para más información.
