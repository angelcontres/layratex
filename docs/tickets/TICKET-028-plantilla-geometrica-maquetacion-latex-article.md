# TICKET-028: Plantilla Geométrica y Reglas de Maquetación Clásica LaTeX (`\documentclass{article}`)

- **Milestone:** Sprint 5 — Fidelidad Tipográfica y Estética Overleaf / LaTeX
- **Estado:** 🟡 Pendiente
- **Prioridad:** Alta (P1)
- **Tipo:** Editorial Layout & CSS Engine

---

## 1. Descripción
Implementar las normas canónicas de diagramación editorial de la clase estándar `\documentclass{article}` de LaTeX en el editor de hoja A4 (**HU-28**, **RF-46**). En lugar del estilo de espaciado web contemporáneo (estilo Notion/Word con párrafos separados por espacios vacíos), el documento debe emular con precisión milimétrica la cuadrícula de composición, sangría de párrafos, encabezados jerárquicos y proporciones de un paper de Overleaf.

---

## 2. Tareas Específicas
1. **Geometría de Página y Márgenes Canónicos:**
   - Configurar márgenes de página según la norma estándar de LaTeX (márgenes laterales y verticales equilibrados de $25.4\text{ mm}$ a $31.8\text{ mm}$ en proporción áurea).
2. **Modelo de Párrafos con Sangría TeX (`\parindent`):**
   - Eliminar el margen inferior entre párrafos sucesivos (`margin-bottom: 0`).
   - Aplicar sangría de primera línea clásica (`text-indent: 1.5em` / `15pt`) a todos los párrafos excepto al primero después de un encabezado o sección (`h1 + p`, `h2 + p`), tal como estipula la tipografía TeX.
3. **Justificación y Separación de Sílabas (*Hyphenation*):**
   - Activar justificación completa de texto (`text-align: justify`) junto con separación silábica automática en español e inglés (`hyphens: auto; -webkit-hyphens: auto;`) para evitar ríos de espacios en blanco.
4. **Encabezado y Metadatos de Artículo Académico:**
   - Implementar el bloque canónico de `\maketitle`: Título centrado en negrita (tamaño `\LARGE` o `\huge`), lista de autores centrada (`\large`), afiliación institucional, fecha de publicación centrada, y bloque de resumen (`\begin{abstract}`) con márgenes laterales estrechos y texto en tamaño reducido.
5. **Numeración Jerárquica Automática de Secciones:**
   - Soporte para numeración automática de títulos: `1. Sección`, `1.1 Subsección`, `1.1.1 Subsubsección`.
   - Soporte para secciones no numeradas (`\section*`).
6. **Notas al Pie de Página (`\footnote`):**
   - Maquetar las notas al pie al fondo de la hoja, separadas por una línea horizontal delgada (`0.4pt` y ancho de `2in`), con numeración en superíndice.

---

## 3. Criterios de Aceptación (Definition of Done)
* [ ] La hoja A4 replica visualmente la estructura, sangrías y densidad de texto de un PDF compilado en Overleaf con la clase `article`.
* [ ] Los párrafos consecutivos usan sangría en su primera línea sin espacio vertical entre ellos.
* [ ] El bloque de título y encabezado incluye formato académico completo (Título, Autor, Fecha y Abstract).
* [ ] Las secciones principales y secundarias se numeran de manera jerárquica y coherente.
