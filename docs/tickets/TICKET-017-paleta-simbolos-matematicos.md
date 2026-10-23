# TICKET-017: Paleta Visual de Símbolos Matemáticos y Operadores

- **Milestone:** Sprint 4 — Edición Asistida y Experiencia de Usuario
- **Estado:** ⚪ Pendiente
- **Prioridad:** Alta (P1)
- **Tipo:** Core Feature / UI

---

## 1. Descripción
Crear una paleta flotante o desplegable de símbolos matemáticos (`MathPalette.svelte`) accesible desde la barra de herramientas (**HU-10**, **RF-24 al RF-26**). Permitirá a estudiantes, científicos e ingenieros insertar símbolos y estructuras matemáticas complejas sin memorizar nombres de comandos LaTeX.

## 2. Tareas Específicas
1. Diseñar el componente `MathPalette.svelte` con menú desplegable flotante categorizado:
   * **Letras Griegas:** $\alpha, \beta, \gamma, \delta, \epsilon, \theta, \lambda, \mu, \pi, \sigma, \phi, \omega, \Delta, \Omega$, etc.
   * **Operadores & Cálculo:** $\sum, \prod, \int, \iint, \oint, \lim, \partial, \nabla, \infty, \pm, \times, \div$.
   * **Relaciones & Lógica:** $\le, \ge, \neq, \approx, \equiv, \in, \notin, \subset, \subseteq, \cup, \cap, \forall, \exists$.
   * **Flechas y Modificadores:** $\to, \leftarrow, \Rightarrow, \Leftrightarrow, \vec{v}, \hat{x}, \bar{x}, \dot{x}$.
   * **Plantillas de Estructura:** Fracción `\frac{a}{b}`, Raíz `\sqrt{x}`, Potencia `x^{n}`, Subíndice `x_{n}`, Ecuación en bloque `\[ ... \]`.
2. Incluir barra de búsqueda rápida dentro de la paleta (por ejemplo al escribir "alpha" o "int" filtra instantáneamente).
3. Insertar el símbolo en la posición del cursor de CodeMirror y mantener el foco en el editor.

## 3. Criterios de Aceptación (Definition of Done)
* [ ] Al hacer clic en cualquier símbolo matemático de la paleta, se inserta su código LaTeX correspondiente en el cursor del editor.
* [ ] La paleta cuenta con categorías claras y filtro de búsqueda por nombre del símbolo.
* [ ] La vista previa de KaTeX renderiza inmediatamente el símbolo insertado en menos de 10 ms.
