/**
 * Documento de Bienvenida inicial de Layratex
 * Diseñado con la estética editorial canónica de un artículo científico en LaTeX (\documentclass{article}).
 */

export const WELCOME_TITLE = 'Layratex: Composición Tipográfica de Alta Precisión en LaTeX y Exportación Híbrida';

export const WELCOME_CONTENT = `> **Resumen**
> Este documento ilustra el sistema de maquetación editorial de **Layratex**, diseñado con la tipografía oficial *Computer Modern* de Donald Knuth, justificación silábica automática, sangría canónica TeX, teoremas numerados, tablas de estilo \`booktabs\` y exportación instantánea tanto a **PDF** como a **Microsoft Word (.docx)**.

# Introducción a la Estética LaTeX

En el estándar tipográfico de LaTeX (\`\\documentclass[12pt,a4paper]{article}\`), el primer párrafo posterior a cualquier encabezado de sección se compone sin sangría inicial (\`\\noindent\`), mientras que los párrafos sucesivos reciben automáticamente una sangría de primera línea de $1.5\\text{ em}$.

Este segundo párrafo demuestra dicha regla editorial clásica. Puedes hacer clic sobre cualquier párrafo, sección, ecuación o tabla de esta hoja A4 para editar su contenido en vivo, o teclear \`/\` en cualquier línea para insertar entornos de LaTeX como teoremas, demostraciones, resúmenes, tablas o ecuaciones.

## Modelado Matemático y Entornos Académicos

Las ecuaciones en bloque se centran automáticamente en la caja tipográfica y reciben numeración secuencial alineada al margen derecho, tal como en el entorno \`equation\` de \`amsmath\`:

$$
\\mathcal{F}\\{f(t)\\}(\\omega) = \\int_{-\\infty}^{\\infty} f(t)\\, e^{-i\\omega t}\\, dt, \\qquad \\nabla \\times \\vec{B} = \\mu_0 \\vec{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\vec{E}}{\\partial t}
$$

> **Teorema:** Sea $f: [a,b] \\to \\mathbb{R}$ una función continua en el intervalo cerrado $[a,b]$. Si $F(x) = \\int_a^x f(t)\\,dt$, entonces $F$ es diferenciable en $(a,b)$ y cumple que $F'(x) = f(x)$ para todo $x \\in (a,b)$.

> **Demostración:** Por definición de derivada, el cociente incremental $[F(x+h)-F(x)]/h = \\frac{1}{h}\\int_x^{x+h} f(t)\\,dt$ converge a $f(x)$ cuando $h \\to 0$ por el teorema del valor medio para integrales.

# Tablas Científicas y Exportación Universal

Las tablas se componen siguiendo las reglas de publicación académica del paquete \`booktabs\` (\`\\toprule\`, \`\\midrule\`, \`\\bottomrule\`), prescindiendo de líneas verticales para maximizar la legibilidad:

| Formato | Motor Editorial | Ecuaciones y Estructura | Uso Recomendado |
| :--- | :--- | :--- | :--- |
| **PDF (.pdf)** | Tectonic / Motor Autónomo | Vectorial KaTeX & TeX | Publicación e imprenta |
| **Word (.docx)** | OpenXML + Office Math | Ecuaciones OMML editables | Revisión y entrega en Word |
| **LaTeX (.tex)** | Código fuente puro | Paquetes \`amsmath\` y \`booktabs\` | Archivos y repositorios |

## Guía Rápida de Comandos

* Haz clic en **Exportar Word (.docx)** en la barra superior para obtener un archivo nativo de Microsoft Word con ecuaciones editables y formato LaTeX.
* Haz clic en **Exportar PDF** (o presiona \`Ctrl+Enter\`) para generar el documento PDF listo para impresión.
* Cambia entre la vista **Hoja LaTeX** y el código fuente **LaTeX (.tex)** en cualquier momento desde la esquina superior derecha.
`;
