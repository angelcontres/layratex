# TICKET-029: Pipeline de Compilación Vectorial Nativa Prioritaria con MiKTeX / pdflatex

- **Milestone:** Sprint 5 — Fidelidad Tipográfica y Estética Overleaf / LaTeX
- **Estado:** 🟡 Pendiente
- **Prioridad:** Alta (P1)
- **Tipo:** Core Engine & Native Compilation

---

## 1. Descripción
Conectar y priorizar el motor local de compilación TeX (`pdflatex.exe`, `xelatex.exe` o `lualatex.exe` provistos por MiKTeX o TeX Live) para que, al pulsar **"Exportar PDF"** o presionar <kbd>Ctrl+Enter</kbd>, se invoque la compilación nativa directa (**HU-29**, **RF-47**). Esto generará un archivo PDF vectorial puro, idéntico al de Overleaf pixel por pixel, con fuentes Type 1 incrustadas, texto completamente copiable/seleccionable e hipervínculos activos, manteniendo el motor autónomo de Layratex como respaldo invisible si el documento presenta advertencias.

---

## 2. Tareas Específicas
1. **Detección Automática de Motores Locales en Windows/macOS/Linux:**
   - Asegurar que el backend en Rust reconozca instalaciones locales en rutas estándar como `%LOCALAPPDATA%\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe`, `C:\Program Files\MiKTeX\`, `/usr/bin/pdflatex` o `/Library/TeX/texbin/pdflatex`.
2. **Generación de Preámbulo Robusto Estándar:**
   - Estructurar el código `.tex` generado para compilación con los paquetes esenciales de Overleaf:
     ```latex
     \documentclass[11pt,a4paper]{article}
     \usepackage[utf8]{inputenc}
     \usepackage[T1]{fontenc}
     \usepackage{lmodern}
     \usepackage{amsmath,amsfonts,amssymb}
     \usepackage{geometry}
     \geometry{a4paper, margin=1in}
     \usepackage{booktabs}
     \usepackage{hyperref}
     ```
3. **Parámetros de Invocación Optimizados:**
   - Ejecutar el compilador con flags que aseguren compilación sin bloqueos interactivos:
     `-synctex=1 -interaction=nonstopmode -halt-on-error`.
4. **Visor de PDF Vectorial en Vivo:**
   - Mostrar el PDF generado en el panel de previsualización integrado (`previewMode === 'pdf'`) con refresco instantáneo tras cada compilación exitosa.
5. **Fallback Silencioso Sin Errores Bloqueantes:**
   - Si el compilador nativo detecta un error de sintaxis irrecuperable o falta de algún paquete exótico, activar de inmediato el motor autónomo de Layratex para que el usuario siempre reciba un documento PDF utilizable.

---

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Al exportar en una máquina con MiKTeX o TeX Live, el PDF generado es un documento vectorial idéntico al que produce Overleaf.
* [ ] El texto del PDF resultante es 100% seleccionable, con fórmulas matemáticas nítidas a cualquier nivel de zoom.
* [ ] La compilación se completa de forma transparente sin abrir ventanas de terminal externas.
* [ ] El documento compilado se puede visualizar de inmediato en el visor interno de Layratex o abrirse en el visor predeterminado del sistema operativo.
