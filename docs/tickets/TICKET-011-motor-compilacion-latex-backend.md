# TICKET-011: Comando Tauri Backend para Compilación LaTeX (Rust)

- **Milestone:** Sprint 2 — Compilación a PDF y Exportación
- **Estado:** 🟢 Cerrado
- **Prioridad:** Bloqueante (P1)
- **Tipo:** Core Backend / Rust

---

## 1. Descripción
Implementar el comando backend en Rust (`compile_latex`) que recibe el código fuente `.tex`, detecta los motores de compilación disponibles en la máquina del usuario (`tectonic`, `pdflatex`, `latexmk`, `xelatex`), compila en un directorio temporal aislado y genera el archivo `.pdf` (**HU-00**, **HU-23**, **RF-36**, **RF-37**).

## 2. Tareas Específicas
1. Implementar la detección de compiladores LaTeX en el PATH del sistema o empaquetado (`tectonic` / `pdflatex`).
2. Crear un comando Tauri `#[tauri::command] async fn compile_latex(content: String, project_path: Option<String>) -> Result<CompilationOutput, String>`.
3. Manejar ejecución en subprocesos con timeout de seguridad (ej. 15 segundos para evitar bucles infinitos en macros TeX).
4. Capturar `stdout`, `stderr` y el archivo de log `.log`.
5. Retornar los bytes del PDF en memoria o ruta temporal, junto al status de salida y mensajes de advertencia.

## 3. Criterios de Aceptación (Definition of Done)
* [x] Invocar el comando con un documento válido produce un PDF compilado en disco temporal sin congelar la interfaz.
* [x] Si la máquina no tiene ningún compilador instalado, retorna un mensaje amigable con instrucciones de instalación de TeX Live / MiKTeX / Tectonic.
* [x] No se producen fugas de procesos en segundo plano.
