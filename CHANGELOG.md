# Changelog

Todas las novedades y cambios notables de **Layratex** serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [v0.1.0] - 2026-10-23

### 🚀 Release Inicial — MVP (Minimum Viable Product)

Primera versión pública de **Layratex**, el editor de documentos técnicos y matemáticos LaTeX híbrido, de ultra-alto rendimiento y con arquitectura *Local-First*.

#### ✨ Características Principales

* **Rendimiento Nativo de Alta Eficiencia (Tauri 2.0 + Svelte 5 + Rust):**
  * Consumo mínimo de memoria RAM (< 80 MB en reposo) y arranque instantáneo.
  * Arquitectura moderna desacoplada entre backend nativo en Rust e interfaz reactiva en Svelte 5.
* **Renderizado Matemático Reactivo en Tiempo Real (< 10 ms):**
  * Vista previa dual sincronizada con **KaTeX** para fórmulas y entornos matemáticos (`$..$`, `$$..$$`, `align`, `equation`, etc.).
  * Renderizado diferencial no bloqueante mientras escribes en el editor.
* **Editor de Código Avanzado (CodeMirror 6):**
  * Resaltado de sintaxis LaTeX completo con numeración de líneas y plegado de código.
  * Soporte nativo para atajos de teclado estándar (`Ctrl+N`, `Ctrl+O`, `Ctrl+S`, `Ctrl+Shift+S`, `Ctrl+B`).
* **Sistema de Archivos y Persistencia Local:**
  * Apertura y guardado de archivos `.tex` locales a través de diálogos nativos del sistema operativo (`@tauri-apps/plugin-dialog` y `@tauri-apps/plugin-fs`).
  * Detección de estado sucio (*dirty state*) con indicador visual para prevenir pérdida accidental de cambios no guardados.
  * Historial de documentos recientes en la barra lateral con persistencia entre sesiones.
* **Motor de Compilación a PDF Nativo en Rust:**
  * Detección automática inteligente de motores instalados en el sistema anfitrión (`tectonic`, `pdflatex`, `latexmk`, `xelatex`).
  * Compilación asíncrona en directorios temporales aislados con barra de estado interactiva.
  * Visor de PDF integrado y exportación directa del archivo compilado con diálogo "Guardar como...".
* **Panel Interactivo de Diagnóstico y Errores:**
  * Parseo inteligente del log del compilador LaTeX (`latexLogParser`).
  * Clasificación automática de eventos: Errores críticos, Advertencias y Bad Boxes.
  * Navegación instantánea a la línea del error en el editor con un solo clic.
* **Distribución y Empaquetado Multiplataforma Automatizado:**
  * Pipeline de CI/CD en GitHub Actions para compilar y generar instaladores nativos para:
    * **Linux:** `.AppImage`, `.deb`, `.rpm`.
    * **Windows:** `.exe` (NSIS) y `.msi`.
    * **macOS:** `.dmg` binario universal (Apple Silicon ARM64 + Intel x86_64).

[v0.1.0]: https://github.com/angelcontres/layratex/releases/tag/v0.1.0
