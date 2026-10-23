export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultTitle: string;
  latexPreamble: string;
  initialContent: string;
}

export const TEMPLATE_PRESETS: DocumentTemplate[] = [
  {
    id: 'school_homework',
    name: 'Tarea Escolar / Universitaria',
    description: 'Estructura ideal para deberes, informes de clase y entregas académicas.',
    icon: 'GraduationCap',
    defaultTitle: 'Tarea de Ciencias — Velocidad de Reacción',
    latexPreamble: `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\geometry{top=2.5cm, bottom=2.5cm, left=3cm, right=3cm}
\\usepackage{xcolor}
\\usepackage{tcolorbox}
`,
    initialContent: `# Introducción

Este documento presenta los resultados del experimento escolar realizado durante la semana pasada. Se evaluó la velocidad de reacción química en soluciones acuosas bajo diferentes temperaturas.

## Fundamento Teórico

La cinética química estudia la rapidez con que los reactivos se transforman en productos a lo largo del tiempo.

$$
v = -\\frac{\\Delta [A]}{\\Delta t} = \\frac{\\Delta [B]}{\\Delta t}
$$

Donde $[A]$ representa la concentración molar del reactivo y $t$ el tiempo transcurrido en segundos.

> **Nota Importante:** Todos los instrumentos fueron calibrados a una temperatura ambiente de $20^\\circ\\text{C}$ antes de iniciar las mediciones.

## Resultados Obtenidos

Se registraron tres pruebas consecutivas para garantizar la reproducibilidad de los datos obtenidos en el laboratorio.

## Conclusión

El incremento de temperatura aumenta la energía cinética de las moléculas, favoreciendo colisiones efectivas y acelerando la velocidad de reacción.`
  },
  {
    id: 'office_report',
    name: 'Informe de Oficina / Reporte',
    description: 'Documento ejecutivo profesional con resumen, objetivos y recomendaciones.',
    icon: 'Briefcase',
    defaultTitle: 'Informe Mensual de Rendimiento Operativo',
    latexPreamble: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath}
\\usepackage{geometry}
\\geometry{top=2cm, bottom=2cm, left=2.5cm, right=2.5cm}
\\usepackage{xcolor}
\\usepackage{tcolorbox}
`,
    initialContent: `# Resumen Ejecutivo

El presente informe detalla las métricas clave de desempeño operacional durante el último trimestre, destacando un incremento del 24% en la eficiencia de entregas de proyectos.

## Objetivos Principales

* Optimizar los tiempos de respuesta al cliente.
* Automatizar la generación de reportes técnicos internos.
* Reducir costos operativos en infraestructura descentralizada.

## Análisis Financiero

El ahorro operativo neto generado por la adopción de herramientas locales sin dependencias de nube se calcula mediante la relación:

$$
\\text{Ahorro Total} = \\sum_{i=1}^{n} (\\text{Costo Nube}_i - \\text{Costo Local}_i)
$$

> **Recomendación Estratégica:** Continuar la transición hacia flujos de trabajo Local-First para garantizar privacidad y cero costos mensuales recurrentes.

## Próximos Pasos

Se convocará a una reunión de seguimiento el próximo lunes para definir las asignaciones operativas del equipo.`
  },
  {
    id: 'math_sheet',
    name: 'Hoja de Ejercicios Matemáticos',
    description: 'Plantilla clara para resolución de ecuaciones, integrales y problemas.',
    icon: 'Calculator',
    defaultTitle: 'Taller de Cálculo Integral y Diferencial',
    latexPreamble: `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\geometry{margin=2.5cm}
`,
    initialContent: `# Taller Práctico de Cálculo

**Estudiante:** Angel Contreras  
**Curso:** Cálculo Avanzado  
**Fecha:** \\today

## Ejercicio 1: Integral Definida

Calcular la integral gaussiana fundamental en todo el dominio real:

$$
I = \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

**Procedimiento:** Elevando al cuadrado y cambiando a coordenadas polares se obtiene el volumen del paraboloide de revolución.

## Ejercicio 2: Ecuación Diferencial

Resolver la ecuación diferencial homogénea de primer orden:

$$
\\frac{dy}{dx} + P(x)y = 0 \\implies y(x) = C e^{-\\int P(x)dx}
$$

> **Recordatorio:** No olvidar verificar la constante de integración con las condiciones iniciales dadas.`
  },
  {
    id: 'formal_letter',
    name: 'Carta Formal / Solicitud',
    description: 'Formato limpio y formal para comunicaciones institucionales o solicitudes.',
    icon: 'Mail',
    defaultTitle: 'Carta Formal de Solicitud Institucional',
    latexPreamble: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{geometry}
\\geometry{margin=3cm}
`,
    initialContent: `# Carta Formal

**Fecha:** 23 de octubre de 2026  
**Para:** Dirección del Departamento Académico  
**De:** Representante Estudiantil  
**Asunto:** Solicitud de ampliación de horario de laboratorios

Estimada Dirección:

Por medio de la presente, me dirijo a usted con el debido respeto para solicitar formalmente la extensión del horario de atención en los laboratorios de cómputo e ingeniería durante el período de exámenes finales.

Esta iniciativa beneficiará a más de 120 estudiantes que requieren acceso a software técnico y herramientas de compilación para sus proyectos de graduación.

Agradeciendo de antemano su amable atención a la presente solicitud, quedo a su disposición para cualquier consulta.

Atentamente,

**Equipo de Estudiantes**  
Facultad de Ingeniería`
  }
];
