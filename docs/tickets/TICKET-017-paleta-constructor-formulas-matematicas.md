# TICKET-017: Paleta Visual y Constructor Interactivo de Ecuaciones Matemáticas KaTeX

- **Milestone:** Sprint 4 — Rediseño Visual WYSIWYG ("PaperCraft") y Asistencia Interactiva (v0.2.0)
- **Estado:** 🟢 Cerrado
- **Prioridad:** Alta (P1)
- **Tipo:** Core Feature / UI Component

---

## 1. Descripción
Crear un modal visual interactivo (`MathBuilderModal.svelte`) que permita redactar y construir ecuaciones matemáticas complejas sin tener que memorizar comandos LaTeX (**HU-10**, **HU-16**, **RF-24 al RF-26**). El usuario puede seleccionar símbolos organizados por categorías, previsualizar la fórmula en tiempo real con KaTeX y abrir el constructor haciendo doble clic sobre cualquier fórmula existente en la vista impresa.

## 2. Tareas Específicas
1. Diseñar el modal `MathBuilderModal.svelte`:
   * Editor de entrada de código LaTeX con renderizado reactivo inmediato en KaTeX (< 5 ms).
   * Pestañas de categorías con símbolos y estructuras listas para usar:
     * **Básicos:** Fracciones (`\frac{a}{b}`), raíces (`\sqrt{x}`), potencias (`x^n`), subíndices (`x_n`).
     * **Letras Griegas:** $\alpha, \beta, \gamma, \theta, \lambda, \mu, \pi, \sigma, \omega, \Delta, \Omega$.
     * **Cálculo:** Integrales definidas/indefinidas (`\int`), sumatorias (`\sum`), límites (`\lim`), derivadas parciales (`\partial`).
     * **Álgebra Lineal & Matrices:** Matrices $2\times2$ y $3\times3$ (`pmatrix`, `bmatrix`, `vmatrix`).
     * **Lógica & Conjuntos:** $\in, \notin, \subset, \cup, \cap, \forall, \exists, \le, \ge, \neq$.
2. Permitir pasar una fórmula LaTeX existente al modal para edición directa.
3. Detectar doble clic sobre cualquier bloque matemático en `PaperEditor.svelte` (vista de impresión) para abrir el constructor con la fórmula seleccionada.
4. Insertar la fórmula formateada con delimitadores `$$` o `$` en la posición del cursor.

## 3. Criterios de Aceptación (Definition of Done)
* [x] El constructor matemático muestra la vista previa con KaTeX en tiempo real a medida que se teclea o se pulsan botones de símbolos.
* [x] Al hacer doble clic en una fórmula matemática en la vista de impresión, se abre el modal cargando la fórmula para modificarla.
* [x] Al hacer clic en "Insertar Fórmula", se inyecta en el documento visual y se sincroniza con el backend LaTeX.
