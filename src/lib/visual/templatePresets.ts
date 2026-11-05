export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultTitle: string;
  defaultAuthor?: string;
  latexPreamble: string;
  initialContent: string;
}

export const TEMPLATE_PRESETS: DocumentTemplate[] = [
  {
    id: 'scientific_paper',
    name: 'Artículo Científico (Estándar LaTeX article)',
    description: 'Estructura canónica con Resumen (Abstract), Teoremas, Demostraciones, Ecuaciones y Tablas Booktabs.',
    icon: 'BookOpen',
    defaultTitle: 'Análisis Asintótico de Sistemas Dinámicos No Lineales',
    defaultAuthor: 'Departamento de Matemática Aplicada e Ingeniería',
    latexPreamble: `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{booktabs}
\\usepackage{microtype}
\\usepackage{geometry}
\\geometry{top=2.5cm, bottom=2.5cm, left=3cm, right=3cm}
\\newtheorem{theorem}{Teorema}
\\newtheorem{definition}{Definición}
\\newtheorem{lemma}{Lema}
`,
    initialContent: `> **Resumen**
> En este artículo se estudia la estabilidad global de sistemas diferenciales acoplados mediante funcionales de Lyapunov. Se establecen condiciones necesarias y suficientes para la convergencia exponencial y se validan los resultados mediante simulaciones numéricas de alta precisión.

# Introducción

El estudio de la estabilidad en ecuaciones diferenciales ordinarias y en derivadas parciales constituye uno de los pilares del análisis matemático moderno. Desde la formulación clásica de Poincaré y Lyapunov, la caracterización del comportamiento asintótico ha permitido modelar fenómenos físicos complejos.

En las secciones siguientes se formalizan las definiciones fundamentales y se demuestra el resultado principal de acotación espectral.

# Marco Teórico y Resultados Principales

> **Definición:** Un punto de equilibrio $x^* \\in \\mathbb{R}^n$ del sistema autónomo $\\dot{x} = f(x)$ se denomina *globalmente asintóticamente estable* si es estable en el sentido de Lyapunov y $\\lim_{t \\to \\infty} \\|x(t) - x^*\\| = 0$ para toda condición inicial $x(0) \\in \\mathbb{R}^n$.

Consideremos la energía total asociada al operador diferencial mediante la identidad variacional:

$$
\\mathcal{E}(u) = \\frac{1}{2} \\int_{\\Omega} |\\nabla u(x)|^2\\, dx + \\int_{\\Omega} V(x)|u(x)|^2\\, dx
$$

> **Teorema:** Si existe una función continuamente diferenciable $V: \\mathbb{R}^n \\to \\mathbb{R}_{\\ge 0}$ radialmente no acotada tal que $\\nabla V(x) \\cdot f(x) \\le -\\alpha \\|x\\|^2$ para alguna constante $\\alpha > 0$, entonces el origen es exponencialmente estable.

> **Demostración:** Derivando $V(x(t))$ respecto al tiempo a lo largo de las trayectorias del sistema e integrando mediante el lema de Grönwall se obtiene directamente la cota exponencial $\|x(t)\| \\le C e^{-\\alpha t/2} \|x(0)\|$.

# Resultados Numéricos

| Método de Integración | Orden $p$ | Error Relativo $L_2$ | Tiempo CPU (ms) |
| :--- | :--- | :--- | :--- |
| Euler Implícito | 1 | $4.12 \\times 10^{-2}$ | 1.8 |
| Runge–Kutta Clásico (RK4) | 4 | $1.05 \\times 10^{-6}$ | 4.2 |
| Gauss–Legendre Simpléctico | 6 | $8.30 \\times 10^{-11}$ | 7.9 |

# Conclusiones

Los resultados teóricos y experimentales confirman que los integradores simplécticos de alto orden preservan los invariantes geométricos del sistema con un costo computacional reducido.`
  },
  {
    id: 'school_homework',
    name: 'Informe / Tarea Universitaria',
    description: 'Estructura ideal para informes de laboratorio, entregas académicas y proyectos de curso.',
    icon: 'GraduationCap',
    defaultTitle: 'Informe de Laboratorio — Cinética y Velocidad de Reacción',
    defaultAuthor: 'Facultad de Ciencias e Ingeniería',
    latexPreamble: `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{geometry}
\\geometry{top=2.5cm, bottom=2.5cm, left=3cm, right=3cm}
`,
    initialContent: `> **Resumen**
> Este informe presenta las mediciones experimentales de la velocidad de reacción química en soluciones acuosas bajo diferentes regímenes térmicos, verificando el modelo exponencial de Arrhenius.

# Introducción

Durante la sesión experimental se evaluó el efecto de la temperatura sobre la constante cinética $k$ de una reacción de segundo orden. La precisión en el control isotérmico resulta indispensable para reducir la incertidumbre sistemática.

## Fundamento Teórico

La ley de velocidad diferencial y la ecuación de Arrhenius relacionan la constante específica de velocidad con la energía de activación $E_a$:

$$
v = -\\frac{d[A]}{dt} = k[A][B], \\qquad k(T) = A \\exp\\left(-\\frac{E_a}{RT}\\right)
$$

Donde $R = 8.314\\text{ J}\\cdot\\text{mol}^{-1}\\cdot\\text{K}^{-1}$ es la constante universal de los gases ideales y $T$ la temperatura absoluta en kelvin.

# Datos Experimentales

| Ensayo | Temperatura ($^\\circ\\text{C}$) | Concentración $[A]_0$ (M) | Constante $k$ ($\\text{M}^{-1}\\text{s}^{-1}$) |
| :--- | :--- | :--- | :--- |
| Prueba 1 | 20.0 | 0.100 | $1.42 \\times 10^{-3}$ |
| Prueba 2 | 30.0 | 0.100 | $2.89 \\times 10^{-3}$ |
| Prueba 3 | 40.0 | 0.100 | $5.64 \\times 10^{-3}$ |

# Conclusiones

El incremento de $10^\\circ\\text{C}$ prácticamente duplica la velocidad de reacción, en estrecha concordancia con la predicción teórica.`
  },
  {
    id: 'math_sheet',
    name: 'Taller de Matemáticas y Teoremas',
    description: 'Plantilla con definiciones, lemas, ecuaciones numeradas y demostraciones formales.',
    icon: 'Calculator',
    defaultTitle: 'Taller de Análisis Real y Cálculo Vectorial',
    defaultAuthor: 'Curso de Matemáticas Superiores',
    latexPreamble: `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{geometry}
\\geometry{margin=2.5cm}
`,
    initialContent: `# Integrales Impropias y Convergencia

## Problema 1: Integral Gaussiana

Determine el valor exacto de la integral impropia de Poisson sobre toda la recta real:

$$
I = \\int_{-\\infty}^{\\infty} e^{-x^2}\\, dx = \\sqrt{\\pi}
$$

> **Lema:** Para todo $R > 0$, sea $D_R = \\{(x,y) \\in \\mathbb{R}^2 : x^2 + y^2 \\le R^2\\}$ y $Q_R = [-R, R]^2$. Entonces la integral doble de $e^{-(x^2+y^2)}$ sobre $Q_R$ está acotada entre las integrales sobre $D_R$ y $D_{\\sqrt{2}R}$.

> **Demostración:** Pasando a coordenadas polares $x = r\\cos\\theta$, $y = r\\sin\\theta$ con jacobiano $r$, se calcula $\\int_0^{2\\pi}\\int_0^R e^{-r^2}r\\,dr\\,d\\theta = \\pi(1 - e^{-R^2})$. Tomando el límite $R \\to \\infty$ se obtiene $I^2 = \\pi$.

# Teorema de Stokes Generalizado

## Problema 2: Circulación de un Campo Vectorial

Verifique la identidad fundamental de la geometría diferencial para una variedad orientada $M$ con frontera $\\partial M$:

$$
\\int_{M} d\\omega = \\oint_{\\partial M} \\omega
$$`
  },
  {
    id: 'formal_letter',
    name: 'Carta / Memorando Académico en LaTeX',
    description: 'Formato formal en tipografía Computer Modern para comunicaciones académicas o institucionales.',
    icon: 'Mail',
    defaultTitle: 'Solicitud Académica Institucional',
    defaultAuthor: 'Comité Académico de Investigación',
    latexPreamble: `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{geometry}
\\geometry{margin=3cm}
`,
    initialContent: `# Comunicación Oficial

* **Para:** Dirección del Comité Editorial y de Investigación
* **De:** Equipo de Investigación Científica
* **Asunto:** Entrega de manuscrito en formato LaTeX y Microsoft Word (.docx)

Estimado Comité Editorial:

Por medio de la presente hacemos entrega formal del manuscrito técnico preparado en **Layratex**, cumpliendo con los estándares tipográficos de *Computer Modern*, numeración canónica de secciones y ecuaciones, así como tablas en formato \`booktabs\`.

Adjuntamos tanto la versión compilada en **PDF** para imprenta como el archivo editable en **Microsoft Word (.docx)** con ecuaciones nativas *Office Math* para el proceso de revisión por pares.

Atentamente,

**Coordinación de Investigación**`
  }
];
