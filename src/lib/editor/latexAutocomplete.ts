import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
  snippet,
  snippetCompletion,
  autocompletion,
  acceptCompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap
} from '@codemirror/autocomplete';
import { EditorSelection, type Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

// ============================================================================
// 1. Catálogo Completo de Comandos y Snippets LaTeX (TICKET-022)
// ============================================================================

export interface LatexItemDef {
  label: string;
  detail: string;
  info?: string;
  type: 'keyword' | 'function' | 'class' | 'variable' | 'text' | 'constant';
  template?: string;
  boost?: number;
}

/**
 * 1. Comandos de estructura y control de documento
 */
export const structureCommands: LatexItemDef[] = [
  {
    label: '\\documentclass',
    detail: 'Clase de documento',
    info: 'Define la estructura base del documento: article, report, book, letter o beamer.',
    type: 'keyword',
    template: '\\documentclass[${1:12pt,a4paper}]{${2:article}}',
    boost: 90
  },
  {
    label: '\\usepackage',
    detail: 'Importar paquete',
    info: 'Carga extensiones y librerías externas (ej. amsmath, graphicx, hyperref).',
    type: 'keyword',
    template: '\\usepackage{${1:paquete}}',
    boost: 88
  },
  {
    label: '\\section',
    detail: 'Sección principal',
    info: 'Encabezado de sección de primer nivel numerado.',
    type: 'keyword',
    template: '\\section{${1:Título de la sección}}',
    boost: 95
  },
  {
    label: '\\subsection',
    detail: 'Subsección',
    info: 'Encabezado secundario de sección (ej. 1.1).',
    type: 'keyword',
    template: '\\subsection{${1:Título de la subsección}}',
    boost: 94
  },
  {
    label: '\\subsubsection',
    detail: 'Sub-subsección',
    info: 'Encabezado de tercer nivel (ej. 1.1.1).',
    type: 'keyword',
    template: '\\subsubsection{${1:Título del sub-tema}}',
    boost: 92
  },
  {
    label: '\\paragraph',
    detail: 'Párrafo con encabezado',
    info: 'Encabezado en negrita al inicio de un párrafo.',
    type: 'keyword',
    template: '\\paragraph{${1:Título}} ${0}',
    boost: 80
  },
  {
    label: '\\subparagraph',
    detail: 'Subpárrafo con encabezado',
    info: 'Encabezado subordinado a un párrafo.',
    type: 'keyword',
    template: '\\subparagraph{${1:Título}} ${0}',
    boost: 75
  },
  {
    label: '\\tableofcontents',
    detail: 'Índice de contenidos',
    info: 'Genera el índice de materias automáticamente a partir de sections y subsections.',
    type: 'keyword',
    template: '\\tableofcontents',
    boost: 85
  },
  {
    label: '\\title',
    detail: 'Título del documento',
    info: 'Define el metadato del título principal.',
    type: 'keyword',
    template: '\\title{${1:Título del Documento}}',
    boost: 87
  },
  {
    label: '\\author',
    detail: 'Autor del documento',
    info: 'Nombre del autor o autores.',
    type: 'keyword',
    template: '\\author{${1:Nombre del Autor}}',
    boost: 86
  },
  {
    label: '\\date',
    detail: 'Fecha del documento',
    info: 'Fecha visible en la portada (usa \\today para fecha actual).',
    type: 'keyword',
    template: '\\date{${1:\\today}}',
    boost: 85
  },
  {
    label: '\\maketitle',
    detail: 'Generar encabezado/portada',
    info: 'Dibuja el título, autor y fecha previamente declarados.',
    type: 'keyword',
    template: '\\maketitle',
    boost: 89
  },
  {
    label: '\\appendix',
    detail: 'Inicio de apéndices',
    info: 'Cambia la numeración de secciones a letras (A, B, C...).',
    type: 'keyword',
    template: '\\appendix',
    boost: 70
  },
  {
    label: '\\bibliography',
    detail: 'Archivo de bibliografía',
    info: 'Enlaza archivo .bib con referencias BibTeX.',
    type: 'keyword',
    template: '\\bibliography{${1:referencias}}',
    boost: 75
  },
  {
    label: '\\bibliographystyle',
    detail: 'Estilo bibliográfico',
    info: 'Define formato de citas (plain, IEEEtran, apa, etc.).',
    type: 'keyword',
    template: '\\bibliographystyle{${1:plain}}',
    boost: 74
  },
  {
    label: '\\chapter',
    detail: 'Capítulo (book/report)',
    info: 'Encabezado de capítulo para libros o reportes extensos.',
    type: 'keyword',
    template: '\\chapter{${1:Nombre del Capítulo}}',
    boost: 80
  },
  {
    label: '\\part',
    detail: 'Parte de documento',
    info: 'División mayor que un capítulo.',
    type: 'keyword',
    template: '\\part{${1:Nombre de la Parte}}',
    boost: 70
  },
  {
    label: '\\label',
    detail: 'Etiqueta de referencia',
    info: 'Marca una sección, figura, tabla o ecuación para ser referenciada con \\ref.',
    type: 'keyword',
    template: '\\label{${1:sec:nombre}}',
    boost: 82
  },
  {
    label: '\\ref',
    detail: 'Referencia cruzada',
    info: 'Muestra el número de la sección, figura o ecuación etiquetada con \\label.',
    type: 'keyword',
    template: '\\ref{${1:etiqueta}}',
    boost: 81
  },
  {
    label: '\\cite',
    detail: 'Cita bibliográfica',
    info: 'Inserta cita de una entrada bibliográfica.',
    type: 'keyword',
    template: '\\cite{${1:clave_bib}}',
    boost: 80
  },
  {
    label: '\\newpage',
    detail: 'Salto de página',
    info: 'Fuerza un salto de página.',
    type: 'keyword',
    template: '\\newpage',
    boost: 78
  },
  {
    label: '\\clearpage',
    detail: 'Vaciado y salto de página',
    info: 'Imprime todos los flotantes pendientes y salta de página.',
    type: 'keyword',
    template: '\\clearpage',
    boost: 72
  },
  {
    label: '\\vspace',
    detail: 'Espacio vertical',
    info: 'Inserta espacio en blanco vertical (ej. 1cm, 10pt).',
    type: 'keyword',
    template: '\\vspace{${1:1cm}}',
    boost: 73
  },
  {
    label: '\\hspace',
    detail: 'Espacio horizontal',
    info: 'Inserta espacio en blanco horizontal (ej. 1cm, 1em).',
    type: 'keyword',
    template: '\\hspace{${1:1cm}}',
    boost: 73
  },
  {
    label: '\\item',
    detail: 'Elemento de lista',
    info: 'Añade una viñeta o número dentro de un entorno itemize o enumerate.',
    type: 'keyword',
    template: '\\item ${0}',
    boost: 85
  }
];

/**
 * 2. Comandos de formato y tipografía
 */
export const formatCommands: LatexItemDef[] = [
  {
    label: '\\textbf',
    detail: 'Texto en negrita',
    info: 'Aplica tipografía en negrita (bold font) al texto entre llaves.',
    type: 'function',
    template: '\\textbf{${1:texto}}',
    boost: 96
  },
  {
    label: '\\textit',
    detail: 'Texto en cursiva',
    info: 'Aplica tipografía en cursiva / itálica al texto entre llaves.',
    type: 'function',
    template: '\\textit{${1:texto}}',
    boost: 95
  },
  {
    label: '\\texttt',
    detail: 'Texto monoespaciado / código',
    info: 'Aplica tipografía monoespaciada (tipo máquina de escribir / código).',
    type: 'function',
    template: '\\texttt{${1:código}}',
    boost: 93
  },
  {
    label: '\\underline',
    detail: 'Texto subrayado',
    info: 'Dibuja una línea continua debajo del texto.',
    type: 'function',
    template: '\\underline{${1:texto subrayado}}',
    boost: 88
  },
  {
    label: '\\emph',
    detail: 'Texto enfatizado',
    info: 'Enfatiza texto de forma semántica (cambia a cursiva en texto normal o viceversa).',
    type: 'function',
    template: '\\emph{${1:texto}}',
    boost: 90
  },
  {
    label: '\\textsc',
    detail: 'Versalitas (Small Caps)',
    info: 'Mayúsculas de tamaño reducido.',
    type: 'function',
    template: '\\textsc{${1:texto}}',
    boost: 76
  },
  {
    label: '\\textsf',
    detail: 'Tipografía Sans-Serif',
    info: 'Aplica tipografía sin remates (sans-serif).',
    type: 'function',
    template: '\\textsf{${1:texto}}',
    boost: 75
  },
  {
    label: '\\textrm',
    detail: 'Tipografía Romana / Serif',
    info: 'Aplica tipografía con remates estándar romana.',
    type: 'function',
    template: '\\textrm{${1:texto}}',
    boost: 74
  },
  {
    label: '\\textcolor',
    detail: 'Color de texto',
    info: 'Colorea el texto especificado (requiere paquete xcolor).',
    type: 'function',
    template: '\\textcolor{${1:blue}}{${2:texto}}',
    boost: 84
  },
  {
    label: '\\small',
    detail: 'Tamaño pequeño',
    info: 'Reduce el tamaño de la tipografía.',
    type: 'function',
    template: '{\\small ${1:texto}}',
    boost: 72
  },
  {
    label: '\\large',
    detail: 'Tamaño grande',
    info: 'Aumenta un nivel el tamaño de la tipografía.',
    type: 'function',
    template: '{\\large ${1:texto}}',
    boost: 73
  },
  {
    label: '\\Large',
    detail: 'Tamaño más grande',
    info: 'Aumenta dos niveles el tamaño de la tipografía.',
    type: 'function',
    template: '{\\Large ${1:texto}}',
    boost: 74
  },
  {
    label: '\\LARGE',
    detail: 'Tamaño muy grande',
    info: 'Aumenta tres niveles el tamaño de la tipografía.',
    type: 'function',
    template: '{\\LARGE ${1:texto}}',
    boost: 72
  },
  {
    label: '\\Huge',
    detail: 'Tamaño gigante',
    info: 'Tamaño máximo de fuente.',
    type: 'function',
    template: '{\\Huge ${1:texto}}',
    boost: 71
  },
  {
    label: '\\centering',
    detail: 'Centrado de párrafo o bloque',
    info: 'Centra horizontalmente el contenido del entorno actual.',
    type: 'function',
    template: '\\centering',
    boost: 86
  },
  {
    label: '\\raggedright',
    detail: 'Alineación a la izquierda',
    info: 'Alinea texto a la izquierda sin justificar.',
    type: 'function',
    template: '\\raggedright',
    boost: 70
  },
  {
    label: '\\raggedleft',
    detail: 'Alineación a la derecha',
    info: 'Alinea texto a la derecha.',
    type: 'function',
    template: '\\raggedleft',
    boost: 70
  },
  {
    label: '\\footnote',
    detail: 'Nota al pie de página',
    info: 'Inserta una nota al pie numerada automáticamente.',
    type: 'function',
    template: '\\footnote{${1:Texto explicativo al pie}}',
    boost: 83
  }
];

/**
 * 3. Entornos LaTeX con auto-cierre y snippets integrados
 */
export const environmentCommands: LatexItemDef[] = [
  {
    label: '\\begin',
    detail: 'Entorno genérico con auto-cierre',
    info: 'Inserta \\begin{env}...\\end{env} con cursor en el interior y sincronización simultánea del nombre.',
    type: 'class',
    template: '\\begin{${1:entorno}}\n\t${0}\n\\end{${1:entorno}}',
    boost: 100
  },
  {
    label: '\\begin{equation}',
    detail: 'Ecuación numerada en bloque',
    info: 'Entorno para ecuación matemática destacada con número de referencia.',
    type: 'class',
    template: '\\begin{equation}\n\t${0}\n\\end{equation}',
    boost: 98
  },
  {
    label: '\\begin{equation*}',
    detail: 'Ecuación en bloque no numerada',
    info: 'Ecuación matemática centrada sin número de referencia.',
    type: 'class',
    template: '\\begin{equation*}\n\t${0}\n\\end{equation*}',
    boost: 97
  },
  {
    label: '\\begin{align}',
    detail: 'Sistema multilínea alineado (&)',
    info: 'Sistema de ecuaciones alineado por el símbolo & con numeración por línea.',
    type: 'class',
    template: '\\begin{align}\n\t${1:f(x)} &= ${2:ax + b} \\\\\n\t${3:g(x)} &= ${4:cx + d}\n\\end{align}',
    boost: 97
  },
  {
    label: '\\begin{align*}',
    detail: 'Sistema multilínea alineado sin numerar',
    info: 'Sistema de ecuaciones alineado por & sin numerar.',
    type: 'class',
    template: '\\begin{align*}\n\t${1:f(x)} &= ${2:ax + b} \\\\\n\t${3:g(x)} &= ${4:cx + d}\n\\end{align*}',
    boost: 96
  },
  {
    label: '\\begin{gather}',
    detail: 'Ecuaciones centradas consecutivas',
    info: 'Conjunto de ecuaciones independientes centradas línea por línea.',
    type: 'class',
    template: '\\begin{gather}\n\t${1:E = mc^2} \\\\\n\t${2:F = ma}\n\\end{gather}',
    boost: 91
  },
  {
    label: '\\begin{gather*}',
    detail: 'Ecuaciones centradas sin numerar',
    info: 'Conjunto de ecuaciones independientes centradas sin numerar.',
    type: 'class',
    template: '\\begin{gather*}\n\t${1:E = mc^2} \\\\\n\t${2:F = ma}\n\\end{gather*}',
    boost: 90
  },
  {
    label: '\\begin{matrix}',
    detail: 'Matriz sin delimitadores',
    info: 'Matriz matemática simple sin corchetes ni paréntesis.',
    type: 'class',
    template: '\\begin{matrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{matrix}',
    boost: 94
  },
  {
    label: '\\begin{pmatrix}',
    detail: 'Matriz con paréntesis ( )',
    info: 'Matriz delimitada por paréntesis curvos estándar.',
    type: 'class',
    template: '\\begin{pmatrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{pmatrix}',
    boost: 95
  },
  {
    label: '\\begin{bmatrix}',
    detail: 'Matriz con corchetes [ ]',
    info: 'Matriz delimitada por corchetes rectangulares.',
    type: 'class',
    template: '\\begin{bmatrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{bmatrix}',
    boost: 95
  },
  {
    label: '\\begin{vmatrix}',
    detail: 'Determinante | |',
    info: 'Matriz con barras simples verticales para determinantes.',
    type: 'class',
    template: '\\begin{vmatrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{vmatrix}',
    boost: 91
  },
  {
    label: '\\begin{Vmatrix}',
    detail: 'Norma de matriz ‖ ‖',
    info: 'Matriz con barras dobles verticales para normas matriciales.',
    type: 'class',
    template: '\\begin{Vmatrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{Vmatrix}',
    boost: 89
  },
  {
    label: '\\begin{cases}',
    detail: 'Función a trozos / casos',
    info: 'Define funciones por partes con llave izquierda automática.',
    type: 'class',
    template: '\\begin{cases}\n\t${1:x} & \\text{si } ${2:x \\ge 0} \\\\\n\t${3:-x} & \\text{si } ${4:x < 0}\n\\end{cases}',
    boost: 93
  },
  {
    label: '\\begin{split}',
    detail: 'División de ecuación larga',
    info: 'Divide una sola ecuación numerada en múltiples renglones.',
    type: 'class',
    template: '\\begin{split}\n\t${1:a} &= ${2:b + c} \\\\\n\t&= ${3:d}\n\\end{split}',
    boost: 87
  },
  {
    label: '\\begin{itemize}',
    detail: 'Lista con viñetas',
    info: 'Entorno de lista desordenada con viñetas circulares.',
    type: 'class',
    template: '\\begin{itemize}\n\t\\item ${0}\n\\end{itemize}',
    boost: 96
  },
  {
    label: '\\begin{enumerate}',
    detail: 'Lista numerada ordenada',
    info: 'Entorno de lista ordenada con numeración secuencial (1, 2, 3...).',
    type: 'class',
    template: '\\begin{enumerate}\n\t\\item ${0}\n\\end{enumerate}',
    boost: 96
  },
  {
    label: '\\begin{description}',
    detail: 'Lista de descripciones/términos',
    info: 'Lista con títulos o términos destacados para cada elemento.',
    type: 'class',
    template: '\\begin{description}\n\t\\item[${1:Término}] ${0}\n\\end{description}',
    boost: 88
  },
  {
    label: '\\begin{figure}',
    detail: 'Figura flotante completa',
    info: 'Snippet con \\centering, \\includegraphics, pie de figura \\caption y \\label.',
    type: 'class',
    template: '\\begin{figure}[htbp]\n\t\\centering\n\t\\includegraphics[width=0.8\\textwidth]{${1:ruta/a/imagen.png}}\n\t\\caption{${2:Descripción o pie de la figura}}\n\t\\label{fig:${3:etiqueta}}\n\\end{figure}',
    boost: 98
  },
  {
    label: '\\begin{table}',
    detail: 'Tabla flotante completa',
    info: 'Snippet con entorno table, pie \\caption, \\label y cuadrícula tabular con bordes.',
    type: 'class',
    template: '\\begin{table}[htbp]\n\t\\centering\n\t\\caption{${1:Título descriptivo de la tabla}}\n\t\\label{tab:${2:etiqueta}}\n\t\\begin{tabular}{|c|c|c|}\n\t\t\\hline\n\t\t${3:Encabezado 1} & ${4:Encabezado 2} & ${5:Encabezado 3} \\\\\n\t\t\\hline\n\t\t${6:Dato 1} & ${7:Dato 2} & ${8:Dato 3} \\\\\n\t\t\\hline\n\t\\end{tabular}\n\\end{table}',
    boost: 98
  },
  {
    label: '\\begin{tabular}',
    detail: 'Cuadrícula / tabla de celdas',
    info: 'Entorno base de alineación y bordes de columnas (|c|c|).',
    type: 'class',
    template: '\\begin{tabular}{|c|c|}\n\t\\hline\n\t${1:Columna 1} & ${2:Columna 2} \\\\\n\t\\hline\n\t${3:Valor 1} & ${4:Valor 2} \\\\\n\t\\hline\n\\end{tabular}',
    boost: 95
  },
  {
    label: '\\begin{center}',
    detail: 'Bloque centrado',
    info: 'Centra un bloque de texto o contenido visual en la página.',
    type: 'class',
    template: '\\begin{center}\n\t${0}\n\\end{center}',
    boost: 89
  },
  {
    label: '\\begin{quote}',
    detail: 'Cita textual destacada',
    info: 'Bloque con márgenes aumentados para citas o extractos.',
    type: 'class',
    template: '\\begin{quote}\n\t${0}\n\\end{quote}',
    boost: 86
  },
  {
    label: '\\begin{verbatim}',
    detail: 'Texto literal / código sin formato',
    info: 'Imprime el texto exactamente tal como se escribe sin procesar comandos LaTeX.',
    type: 'class',
    template: '\\begin{verbatim}\n${0}\n\\end{verbatim}',
    boost: 87
  },
  {
    label: '\\begin{proof}',
    detail: 'Demostración matemática',
    info: 'Entorno de demostración con símbolo Q.E.D. (cuadrado blanco final).',
    type: 'class',
    template: '\\begin{proof}\n\t${0}\n\\end{proof}',
    boost: 88
  },
  {
    label: '\\begin{theorem}',
    detail: 'Teorema matemático',
    info: 'Entorno formal de teorema con tipografía destacada.',
    type: 'class',
    template: '\\begin{theorem}\n\t${0}\n\\end{theorem}',
    boost: 87
  },
  {
    label: '\\begin{lemma}',
    detail: 'Lema auxiliar',
    info: 'Entorno para enunciado de lema matemático.',
    type: 'class',
    template: '\\begin{lemma}\n\t${0}\n\\end{lemma}',
    boost: 86
  },
  {
    label: '\\begin{document}',
    detail: 'Cuerpo principal del documento',
    info: 'Contiene todo el contenido visible del documento LaTeX.',
    type: 'class',
    template: '\\begin{document}\n\t${0}\n\\end{document}',
    boost: 93
  }
];

/**
 * 4. Snippets rápidos de figuras, tablas y estructuras
 */
export const quickSnippets: LatexItemDef[] = [
  {
    label: '\\figure',
    detail: 'Snippet rápido de figura',
    info: 'Inserta figura con imagen centrada, pie y etiqueta.',
    type: 'class',
    template: '\\begin{figure}[htbp]\n\t\\centering\n\t\\includegraphics[width=0.8\\textwidth]{${1:ruta/a/imagen.png}}\n\t\\caption{${2:Descripción de la figura}}\n\t\\label{fig:${3:etiqueta}}\n\\end{figure}',
    boost: 99
  },
  {
    label: '\\fig',
    detail: 'Atajo rápido: Figura',
    info: 'Alias corto para insertar un entorno de figura completo.',
    type: 'class',
    template: '\\begin{figure}[htbp]\n\t\\centering\n\t\\includegraphics[width=0.8\\textwidth]{${1:imagen.png}}\n\t\\caption{${2:Pie}}\n\t\\label{fig:${3:etiqueta}}\n\\end{figure}',
    boost: 99
  },
  {
    label: '\\table',
    detail: 'Snippet rápido de tabla',
    info: 'Inserta tabla completa con caption, label y tabular con bordes.',
    type: 'class',
    template: '\\begin{table}[htbp]\n\t\\centering\n\t\\caption{${1:Título}}\n\t\\label{tab:${2:etiqueta}}\n\t\\begin{tabular}{|c|c|c|}\n\t\t\\hline\n\t\t${3:A} & ${4:B} & ${5:C} \\\\\n\t\t\\hline\n\t\t${6:1} & ${7:2} & ${8:3} \\\\\n\t\t\\hline\n\t\\end{tabular}\n\\end{table}',
    boost: 99
  },
  {
    label: '\\tab',
    detail: 'Atajo rápido: Tabla',
    info: 'Alias corto para insertar una tabla interactiva.',
    type: 'class',
    template: '\\begin{table}[htbp]\n\t\\centering\n\t\\caption{${1:Título}}\n\t\\label{tab:${2:etiqueta}}\n\t\\begin{tabular}{|c|c|}\n\t\t\\hline\n\t\t${3:Col1} & ${4:Col2} \\\\\n\t\t\\hline\n\t\t${5:Dato1} & ${6:Dato2} \\\\\n\t\t\\hline\n\t\\end{tabular}\n\\end{table}',
    boost: 99
  },
  {
    label: '\\mat',
    detail: 'Atajo rápido: Matriz pmatrix',
    info: 'Inserta matriz 2x2 entre paréntesis.',
    type: 'class',
    template: '\\begin{pmatrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{pmatrix}',
    boost: 95
  },
  {
    label: '\\pmatrix',
    detail: 'Atajo: Matriz con paréntesis',
    info: 'Inserta matriz con paréntesis.',
    type: 'class',
    template: '\\begin{pmatrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{pmatrix}',
    boost: 95
  },
  {
    label: '\\bmatrix',
    detail: 'Atajo: Matriz con corchetes',
    info: 'Inserta matriz con corchetes [ ].',
    type: 'class',
    template: '\\begin{bmatrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{bmatrix}',
    boost: 95
  },
  {
    label: '\\eq',
    detail: 'Atajo rápido: Ecuación',
    info: 'Inserta bloque de ecuación numerada.',
    type: 'class',
    template: '\\begin{equation}\n\t${0}\n\\end{equation}',
    boost: 97
  },
  {
    label: '\\ali',
    detail: 'Atajo rápido: Sistema align',
    info: 'Inserta bloque align para ecuaciones multilínea.',
    type: 'class',
    template: '\\begin{align}\n\t${1:f(x)} &= ${2:ax + b} \\\\\n\t${3:g(x)} &= ${4:cx + d}\n\\end{align}',
    boost: 96
  }
];

/**
 * 5. Comandos y símbolos matemáticos
 */
export const mathCommands: LatexItemDef[] = [
  // Fracciones, raíces y operadores de cálculo
  {
    label: '\\frac',
    detail: 'Fracción matemática',
    info: 'Crea una fracción con numerador y denominador: \\frac{a}{b}.',
    type: 'function',
    template: '\\frac{${1:numerador}}{${2:denominador}}',
    boost: 98
  },
  {
    label: '\\sqrt',
    detail: 'Raíz cuadrada o enésima',
    info: 'Raíz cuadrada \\sqrt{x} o enésima \\sqrt[n]{x}.',
    type: 'function',
    template: '\\sqrt{${1:x}}',
    boost: 97
  },
  {
    label: '\\sum',
    detail: 'Sumatorio',
    info: 'Operador sumatorio con límites inferior y superior.',
    type: 'function',
    template: '\\sum_{${1:i=1}}^{${2:n}} ${0}',
    boost: 96
  },
  {
    label: '\\int',
    detail: 'Integral',
    info: 'Integral definida con límites inferior y superior.',
    type: 'function',
    template: '\\int_{${1:a}}^{${2:b}} ${3:f(x)} \\, d${4:x}',
    boost: 96
  },
  {
    label: '\\iint',
    detail: 'Integral doble',
    info: 'Integral doble de área o superficie.',
    type: 'function',
    template: '\\iint_{${1:D}} ${2:f(x, y)} \\, dA',
    boost: 92
  },
  {
    label: '\\iiint',
    detail: 'Integral triple',
    info: 'Integral triple de volumen.',
    type: 'function',
    template: '\\iiint_{${1:V}} ${2:f(x, y, z)} \\, dV',
    boost: 91
  },
  {
    label: '\\oint',
    detail: 'Integral de contorno cerrado',
    info: 'Integral de contorno o circuito cerrado.',
    type: 'function',
    template: '\\oint_{${1:C}} ${2:\\vec{F}} \\cdot d\\vec{r}',
    boost: 93
  },
  {
    label: '\\prod',
    detail: 'Productorio',
    info: 'Operador de multiplicación sucesiva con límites.',
    type: 'function',
    template: '\\prod_{${1:i=1}}^{${2:n}} ${0}',
    boost: 92
  },
  {
    label: '\\lim',
    detail: 'Límite matemático',
    info: 'Límite cuando una variable tiende a un valor.',
    type: 'function',
    template: '\\lim_{${1:x} \\to ${2:\\infty}} ${0}',
    boost: 94
  },
  {
    label: '\\partial',
    detail: 'Derivada parcial (∂)',
    info: 'Símbolo de diferenciación parcial.',
    type: 'constant',
    template: '\\partial',
    boost: 93
  },
  {
    label: '\\nabla',
    detail: 'Operador Nabla / Gradiente (∇)',
    info: 'Operador diferencial vectorial gradiente, divergencia o rotacional.',
    type: 'constant',
    template: '\\nabla',
    boost: 92
  },
  {
    label: '\\infty',
    detail: 'Infinito (∞)',
    info: 'Símbolo de infinito.',
    type: 'constant',
    template: '\\infty',
    boost: 95
  },

  // Letras griegas minúsculas
  { label: '\\alpha', detail: 'Letra griega α', type: 'variable', template: '\\alpha', boost: 90 },
  { label: '\\beta', detail: 'Letra griega β', type: 'variable', template: '\\beta', boost: 90 },
  { label: '\\gamma', detail: 'Letra griega γ', type: 'variable', template: '\\gamma', boost: 89 },
  { label: '\\delta', detail: 'Letra griega δ', type: 'variable', template: '\\delta', boost: 89 },
  { label: '\\epsilon', detail: 'Letra griega ϵ', type: 'variable', template: '\\epsilon', boost: 88 },
  { label: '\\varepsilon', detail: 'Letra griega varepsilon ε', type: 'variable', template: '\\varepsilon', boost: 88 },
  { label: '\\zeta', detail: 'Letra griega ζ', type: 'variable', template: '\\zeta', boost: 85 },
  { label: '\\eta', detail: 'Letra griega η', type: 'variable', template: '\\eta', boost: 85 },
  { label: '\\theta', detail: 'Letra griega θ', type: 'variable', template: '\\theta', boost: 90 },
  { label: '\\vartheta', detail: 'Letra griega vartheta ϑ', type: 'variable', template: '\\vartheta', boost: 85 },
  { label: '\\iota', detail: 'Letra griega ι', type: 'variable', template: '\\iota', boost: 83 },
  { label: '\\kappa', detail: 'Letra griega κ', type: 'variable', template: '\\kappa', boost: 85 },
  { label: '\\lambda', detail: 'Letra griega λ', type: 'variable', template: '\\lambda', boost: 90 },
  { label: '\\mu', detail: 'Letra griega μ', type: 'variable', template: '\\mu', boost: 89 },
  { label: '\\nu', detail: 'Letra griega ν', type: 'variable', template: '\\nu', boost: 86 },
  { label: '\\xi', detail: 'Letra griega ξ', type: 'variable', template: '\\xi', boost: 85 },
  { label: '\\pi', detail: 'Letra griega π', type: 'variable', template: '\\pi', boost: 92 },
  { label: '\\varpi', detail: 'Letra griega varpi ϖ', type: 'variable', template: '\\varpi', boost: 82 },
  { label: '\\rho', detail: 'Letra griega ρ', type: 'variable', template: '\\rho', boost: 88 },
  { label: '\\varrho', detail: 'Letra griega varrho ϱ', type: 'variable', template: '\\varrho', boost: 82 },
  { label: '\\sigma', detail: 'Letra griega σ', type: 'variable', template: '\\sigma', boost: 89 },
  { label: '\\varsigma', detail: 'Letra griega varsigma ς', type: 'variable', template: '\\varsigma', boost: 82 },
  { label: '\\tau', detail: 'Letra griega τ', type: 'variable', template: '\\tau', boost: 88 },
  { label: '\\upsilon', detail: 'Letra griega υ', type: 'variable', template: '\\upsilon', boost: 82 },
  { label: '\\phi', detail: 'Letra griega ϕ', type: 'variable', template: '\\phi', boost: 89 },
  { label: '\\varphi', detail: 'Letra griega varphi φ', type: 'variable', template: '\\varphi', boost: 89 },
  { label: '\\chi', detail: 'Letra griega χ', type: 'variable', template: '\\chi', boost: 85 },
  { label: '\\psi', detail: 'Letra griega ψ', type: 'variable', template: '\\psi', boost: 87 },
  { label: '\\omega', detail: 'Letra griega ω', type: 'variable', template: '\\omega', boost: 90 },

  // Letras griegas mayúsculas
  { label: '\\Gamma', detail: 'Letra griega Gamma Γ', type: 'variable', template: '\\Gamma', boost: 86 },
  { label: '\\Delta', detail: 'Letra griega Delta Δ', type: 'variable', template: '\\Delta', boost: 88 },
  { label: '\\Theta', detail: 'Letra griega Theta Θ', type: 'variable', template: '\\Theta', boost: 87 },
  { label: '\\Lambda', detail: 'Letra griega Lambda Λ', type: 'variable', template: '\\Lambda', boost: 87 },
  { label: '\\Xi', detail: 'Letra griega Xi Ξ', type: 'variable', template: '\\Xi', boost: 84 },
  { label: '\\Pi', detail: 'Letra griega Pi Π', type: 'variable', template: '\\Pi', boost: 86 },
  { label: '\\Sigma', detail: 'Letra griega Sigma Σ', type: 'variable', template: '\\Sigma', boost: 88 },
  { label: '\\Upsilon', detail: 'Letra griega Upsilon Υ', type: 'variable', template: '\\Upsilon', boost: 83 },
  { label: '\\Phi', detail: 'Letra griega Phi Φ', type: 'variable', template: '\\Phi', boost: 87 },
  { label: '\\Psi', detail: 'Letra griega Psi Ψ', type: 'variable', template: '\\Psi', boost: 85 },
  { label: '\\Omega', detail: 'Letra griega Omega Ω', type: 'variable', template: '\\Omega', boost: 88 },

  // Relaciones, lógica y conjuntos
  { label: '\\leq', detail: 'Menor o igual (≤)', type: 'constant', template: '\\leq', boost: 88 },
  { label: '\\geq', detail: 'Mayor o igual (≥)', type: 'constant', template: '\\geq', boost: 88 },
  { label: '\\neq', detail: 'Diferente / No igual (≠)', type: 'constant', template: '\\neq', boost: 89 },
  { label: '\\approx', detail: 'Aproximadamente igual (≈)', type: 'constant', template: '\\approx', boost: 87 },
  { label: '\\equiv', detail: 'Equivalente / congruente (≡)', type: 'constant', template: '\\equiv', boost: 86 },
  { label: '\\sim', detail: 'Similar (∼)', type: 'constant', template: '\\sim', boost: 83 },
  { label: '\\forall', detail: 'Para todo (∀)', type: 'constant', template: '\\forall', boost: 87 },
  { label: '\\exists', detail: 'Existe (∃)', type: 'constant', template: '\\exists', boost: 87 },
  { label: '\\nexists', detail: 'No existe (∄)', type: 'constant', template: '\\nexists', boost: 84 },
  { label: '\\in', detail: 'Pertenece a (∈)', type: 'constant', template: '\\in', boost: 89 },
  { label: '\\notin', detail: 'No pertenece a (∉)', type: 'constant', template: '\\notin', boost: 87 },
  { label: '\\subset', detail: 'Subconjunto propio (⊂)', type: 'constant', template: '\\subset', boost: 86 },
  { label: '\\subseteq', detail: 'Subconjunto o igual (⊆)', type: 'constant', template: '\\subseteq', boost: 87 },
  { label: '\\supset', detail: 'Superconjunto (⊃)', type: 'constant', template: '\\supset', boost: 84 },
  { label: '\\supseteq', detail: 'Superconjunto o igual (⊇)', type: 'constant', template: '\\supseteq', boost: 84 },
  { label: '\\cup', detail: 'Unión de conjuntos (∪)', type: 'constant', template: '\\cup', boost: 86 },
  { label: '\\cap', detail: 'Intersección de conjuntos (∩)', type: 'constant', template: '\\cap', boost: 86 },
  { label: '\\setminus', detail: 'Diferencia de conjuntos (\\)', type: 'constant', template: '\\setminus', boost: 83 },
  { label: '\\emptyset', detail: 'Conjunto vacío (∅)', type: 'constant', template: '\\emptyset', boost: 85 },
  { label: '\\implies', detail: 'Implica (⟹)', type: 'constant', template: '\\implies', boost: 88 },
  { label: '\\iff', detail: 'Si y solo si (⟺)', type: 'constant', template: '\\iff', boost: 88 },
  { label: '\\to', detail: 'Tiende a / flecha derecha (→)', type: 'constant', template: '\\to', boost: 91 },
  { label: '\\rightarrow', detail: 'Flecha derecha (→)', type: 'constant', template: '\\rightarrow', boost: 89 },
  { label: '\\leftarrow', detail: 'Flecha izquierda (←)', type: 'constant', template: '\\leftarrow', boost: 87 },
  { label: '\\Rightarrow', detail: 'Flecha doble derecha (⇒)', type: 'constant', template: '\\Rightarrow', boost: 88 },
  { label: '\\Leftarrow', detail: 'Flecha doble izquierda (⇐)', type: 'constant', template: '\\Leftarrow', boost: 86 },
  { label: '\\leftrightarrow', detail: 'Flecha bidireccional (↔)', type: 'constant', template: '\\leftrightarrow', boost: 85 },
  { label: '\\mapsto', detail: 'Mapea a (↦)', type: 'constant', template: '\\mapsto', boost: 85 },

  // Operadores aritméticos y estándar
  { label: '\\times', detail: 'Multiplicación (×)', type: 'constant', template: '\\times', boost: 89 },
  { label: '\\div', detail: 'División (÷)', type: 'constant', template: '\\div', boost: 87 },
  { label: '\\cdot', detail: 'Punto de producto (·)', type: 'constant', template: '\\cdot', boost: 91 },
  { label: '\\pm', detail: 'Más o menos (±)', type: 'constant', template: '\\pm', boost: 89 },
  { label: '\\mp', detail: 'Menos o más (∓)', type: 'constant', template: '\\mp', boost: 84 },
  { label: '\\ast', detail: 'Asterisco (*)', type: 'constant', template: '\\ast', boost: 81 },
  { label: '\\circ', detail: 'Composición de funciones (∘)', type: 'constant', template: '\\circ', boost: 83 },

  // Funciones trigonométricas y trascendentes
  { label: '\\sin', detail: 'Función seno', type: 'function', template: '\\sin(${1:x})', boost: 88 },
  { label: '\\cos', detail: 'Función coseno', type: 'function', template: '\\cos(${1:x})', boost: 88 },
  { label: '\\tan', detail: 'Función tangente', type: 'function', template: '\\tan(${1:x})', boost: 88 },
  { label: '\\sec', detail: 'Función secante', type: 'function', template: '\\sec(${1:x})', boost: 83 },
  { label: '\\csc', detail: 'Función cosecante', type: 'function', template: '\\csc(${1:x})', boost: 83 },
  { label: '\\cot', detail: 'Función cotangente', type: 'function', template: '\\cot(${1:x})', boost: 83 },
  { label: '\\arcsin', detail: 'Función arco seno', type: 'function', template: '\\arcsin(${1:x})', boost: 84 },
  { label: '\\arccos', detail: 'Función arco coseno', type: 'function', template: '\\arccos(${1:x})', boost: 84 },
  { label: '\\arctan', detail: 'Función arco tangente', type: 'function', template: '\\arctan(${1:x})', boost: 85 },
  { label: '\\sinh', detail: 'Función seno hiperbólico', type: 'function', template: '\\sinh(${1:x})', boost: 83 },
  { label: '\\cosh', detail: 'Función coseno hiperbólico', type: 'function', template: '\\cosh(${1:x})', boost: 83 },
  { label: '\\tanh', detail: 'Función tangente hiperbólica', type: 'function', template: '\\tanh(${1:x})', boost: 83 },
  { label: '\\ln', detail: 'Logaritmo natural', type: 'function', template: '\\ln(${1:x})', boost: 88 },
  { label: '\\log', detail: 'Logaritmo en base 10 o b', type: 'function', template: '\\log_{${1:10}}(${2:x})', boost: 87 },
  { label: '\\exp', detail: 'Función exponencial', type: 'function', template: '\\exp(${1:x})', boost: 86 },
  { label: '\\det', detail: 'Determinante', type: 'function', template: '\\det(${1:A})', boost: 85 },
  { label: '\\min', detail: 'Mínimo', type: 'function', template: '\\min', boost: 83 },
  { label: '\\max', detail: 'Máximo', type: 'function', template: '\\max', boost: 83 },

  // Tipografías y conjuntos matemáticos
  {
    label: '\\mathbf',
    detail: 'Vector / matriz negrita matemática',
    info: 'Renderiza símbolos o letras en negrita matemática recta (Bold).',
    type: 'function',
    template: '\\mathbf{${1:v}}',
    boost: 90
  },
  {
    label: '\\mathcal',
    detail: 'Tipografía caligráfica (Lagrangiano, etc.)',
    info: 'Fuente caligráfica manuscrita para operadores o transformadas.',
    type: 'function',
    template: '\\mathcal{${1:L}}',
    boost: 90
  },
  {
    label: '\\mathbb',
    detail: 'Conjuntos numéricos (ℝ, ℂ, ℕ, ℤ)',
    info: 'Blackboard bold para números reales, complejos, naturales, enteros.',
    type: 'function',
    template: '\\mathbb{${1:R}}',
    boost: 91
  },
  {
    label: '\\mathrm',
    detail: 'Texto normal / romano en fórmula',
    info: 'Imprime unidades o texto recto sin itálica dentro de fórmulas matemáticas.',
    type: 'function',
    template: '\\mathrm{${1:texto}}',
    boost: 88
  },
  {
    label: '\\mathit',
    detail: 'Itálica matemática',
    info: 'Fuente cursiva para variables matemáticas.',
    type: 'function',
    template: '\\mathit{${1:var}}',
    boost: 82
  },
  {
    label: '\\mathfrak',
    detail: 'Tipografía Fraktur matemática',
    info: 'Fuente estilo gótico Fraktur para álgebra abstracta o álgebras de Lie.',
    type: 'function',
    template: '\\mathfrak{${1:g}}',
    boost: 82
  },

  // Modificadores de variables y delimitadores adaptables
  {
    label: '\\left(',
    detail: 'Paréntesis adaptables automáticos',
    info: 'Paréntesis izquierdo y derecho de altura adaptable al contenido.',
    type: 'function',
    template: '\\left( ${1:expresión} \\right)',
    boost: 91
  },
  {
    label: '\\left[',
    detail: 'Corchetes adaptables automáticos',
    info: 'Corchetes de altura adaptable al contenido.',
    type: 'function',
    template: '\\left[ ${1:expresión} \\right]',
    boost: 90
  },
  {
    label: '\\left\\{',
    detail: 'Llaves adaptables automáticas',
    info: 'Llaves matemáticas de altura adaptable.',
    type: 'function',
    template: '\\left\\{ ${1:expresión} \\right\\}',
    boost: 90
  },
  {
    label: '\\vec',
    detail: 'Vector con flecha superior',
    info: 'Añade una flecha de vector sobre el símbolo.',
    type: 'function',
    template: '\\vec{${1:v}}',
    boost: 89
  },
  {
    label: '\\hat',
    detail: 'Acento circunflejo / unitario',
    info: 'Símbolo con acento en sombrero (ej. vector unitario o estimador estadístico).',
    type: 'function',
    template: '\\hat{${1:x}}',
    boost: 88
  },
  {
    label: '\\bar',
    detail: 'Barra superior / media',
    info: 'Barra superior sobre la variable (ej. valor medio x̄).',
    type: 'function',
    template: '\\bar{${1:x}}',
    boost: 87
  },
  {
    label: '\\tilde',
    detail: 'Tilde matemática (~)',
    info: 'Tilde sobre la variable.',
    type: 'function',
    template: '\\tilde{${1:x}}',
    boost: 86
  },
  {
    label: '\\dot',
    detail: 'Derivada temporal de 1er orden (un punto)',
    info: 'Punto superior de derivada temporal (ẋ = dx/dt).',
    type: 'function',
    template: '\\dot{${1:x}}',
    boost: 87
  },
  {
    label: '\\ddot',
    detail: 'Derivada temporal de 2do orden (dos puntos)',
    info: 'Dos puntos superiores para aceleración o segunda derivada (ẍ).',
    type: 'function',
    template: '\\ddot{${1:x}}',
    boost: 87
  },
  {
    label: '\\overbrace',
    detail: 'Llave superior explicativa',
    info: 'Llave horizontal sobre la expresión con etiqueta superior.',
    type: 'function',
    template: '\\overbrace{${1:expresión}}^{${2:nota}}',
    boost: 84
  },
  {
    label: '\\underbrace',
    detail: 'Llave inferior explicativa',
    info: 'Llave horizontal bajo la expresión con etiqueta inferior.',
    type: 'function',
    template: '\\underbrace{${1:expresión}}_{${2:nota}}',
    boost: 84
  },
  {
    label: '\\quad',
    detail: 'Espacio mediano (1em)',
    info: 'Inserta separación horizontal de un espacio eme.',
    type: 'constant',
    template: '\\quad',
    boost: 87
  },
  {
    label: '\\qquad',
    detail: 'Espacio doble (2em)',
    info: 'Inserta separación horizontal doble.',
    type: 'constant',
    template: '\\qquad',
    boost: 86
  }
];

/**
 * Nombres de entornos estándar reconocidos para completado contextual dentro de \\begin{...}
 */
export const LATEX_ENVIRONMENTS = [
  { name: 'equation', desc: 'Ecuación numerada en bloque' },
  { name: 'equation*', desc: 'Ecuación centrada sin numerar' },
  { name: 'align', desc: 'Sistema multilínea alineado (&)' },
  { name: 'align*', desc: 'Sistema multilínea sin numerar' },
  { name: 'gather', desc: 'Ecuaciones centradas consecutivas' },
  { name: 'gather*', desc: 'Ecuaciones centradas sin numerar' },
  { name: 'matrix', desc: 'Matriz sin bordes' },
  { name: 'pmatrix', desc: 'Matriz con paréntesis' },
  { name: 'bmatrix', desc: 'Matriz con corchetes' },
  { name: 'vmatrix', desc: 'Determinante simple' },
  { name: 'Vmatrix', desc: 'Norma de matriz doble' },
  { name: 'cases', desc: 'Función a trozos' },
  { name: 'split', desc: 'División de ecuación larga' },
  { name: 'figure', desc: 'Figura flotante' },
  { name: 'table', desc: 'Tabla flotante' },
  { name: 'tabular', desc: 'Cuadrícula de celdas' },
  { name: 'itemize', desc: 'Lista con viñetas' },
  { name: 'enumerate', desc: 'Lista ordenada numerada' },
  { name: 'description', desc: 'Lista de términos' },
  { name: 'center', desc: 'Bloque centrado' },
  { name: 'quote', desc: 'Cita textual' },
  { name: 'verbatim', desc: 'Código literal sin formato' },
  { name: 'proof', desc: 'Demostración matemática' },
  { name: 'theorem', desc: 'Teorema formal' },
  { name: 'lemma', desc: 'Lema auxiliar' },
  { name: 'document', desc: 'Cuerpo del documento' }
];

// ============================================================================
// 2. Conversión a Completions Oficiales de CodeMirror 6
// ============================================================================

function toCompletion(def: LatexItemDef): Completion {
  if (def.template) {
    return snippetCompletion(def.template, {
      label: def.label,
      detail: def.detail,
      info: def.info,
      type: def.type,
      boost: def.boost
    });
  }

  return {
    label: def.label,
    detail: def.detail,
    info: def.info,
    type: def.type,
    boost: def.boost
  };
}

// Catálogo consolidado para sugerencias cuando se escribe '\'
export const ALL_LATEX_COMPLETIONS: Completion[] = [
  ...quickSnippets.map(toCompletion),
  ...environmentCommands.map(toCompletion),
  ...structureCommands.map(toCompletion),
  ...formatCommands.map(toCompletion),
  ...mathCommands.map(toCompletion)
];

// Completions contextuales para cuando el usuario está escribiendo dentro de \begin{ o \end{
export const ENVIRONMENT_NAME_COMPLETIONS: Completion[] = LATEX_ENVIRONMENTS.map((env) => ({
  label: env.name,
  detail: env.desc,
  type: 'class',
  boost: 90
}));

// ============================================================================
// 3. Fuente de Autocompletado Contextual CodeMirror 6 (CompletionSource)
// ============================================================================

export function latexCompletionSource(context: CompletionContext): CompletionResult | null {
  // Caso A: El usuario está escribiendo el nombre del entorno dentro de \begin{... o \end{...
  const envMatch = context.matchBefore(/\\(begin|end)\{([a-zA-Z*]*)/);
  if (envMatch) {
    const isBegin = envMatch.text.startsWith('\\begin');
    const typedEnv = envMatch.text.slice(envMatch.text.indexOf('{') + 1);
    const from = envMatch.to - typedEnv.length;

    // Para entornos dentro de \begin{, si el usuario selecciona, completamos y auto-cerramos si no existe
    const options: Completion[] = LATEX_ENVIRONMENTS.map((env) => {
      if (isBegin) {
        // Snippet que completa el cierre de llave y genera el \end{env} si no está cerrado
        return {
          label: env.name,
          detail: env.desc,
          type: 'class',
          apply: (view: EditorView, _comp: Completion, applyFrom: number, applyTo: number) => {
            const doc = view.state.doc;
            let replaceEnd = applyTo;
            // Si inmediatamente después hay una '}', la absorbemos
            if (doc.sliceString(applyTo, applyTo + 1) === '}') {
              replaceEnd = applyTo + 1;
            }

            const afterText = doc.sliceString(replaceEnd, replaceEnd + 150);
            const line = doc.lineAt(applyFrom);
            const indentMatch = line.text.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';
            const innerIndent = indent + '  ';

            let insertText = `${env.name}}`;
            let targetCursor = applyFrom + insertText.length;

            if (!afterText.trim().startsWith(`\\end{${env.name}}`)) {
              insertText += `\n${innerIndent}\n${indent}\\end{${env.name}}`;
              targetCursor = applyFrom + env.name.length + 1 + 1 + innerIndent.length;
            }

            view.dispatch({
              changes: { from: applyFrom, to: replaceEnd, insert: insertText },
              selection: EditorSelection.cursor(targetCursor),
              scrollIntoView: true
            });
          }
        };
      } else {
        // Para \end{ solo cerramos la llave
        return {
          label: env.name,
          detail: env.desc,
          type: 'class',
          apply: (view: EditorView, _comp: Completion, applyFrom: number, applyTo: number) => {
            let replaceEnd = applyTo;
            if (view.state.doc.sliceString(applyTo, applyTo + 1) === '}') {
              replaceEnd = applyTo + 1;
            }
            view.dispatch({
              changes: { from: applyFrom, to: replaceEnd, insert: `${env.name}}` },
              selection: EditorSelection.cursor(applyFrom + env.name.length + 1),
              scrollIntoView: true
            });
          }
        };
      }
    });

    return {
      from,
      options,
      validFor: /^[a-zA-Z*]*$/
    };
  }

  // Caso B: El usuario escribió comando iniciando con '\'
  const commandMatch = context.matchBefore(/\\[a-zA-Z*]*/);
  if (commandMatch) {
    return {
      from: commandMatch.from,
      options: ALL_LATEX_COMPLETIONS,
      validFor: /^\\[a-zA-Z*]*$/
    };
  }

  // Si se invocó explícitamente (ej. Ctrl+Espacio)
  if (context.explicit) {
    return {
      from: context.pos,
      options: ALL_LATEX_COMPLETIONS
    };
  }

  return null;
}

// ============================================================================
// 4. Auto-Cierre Inteligente de Entornos al Teclear '}' o Enter (Task 3)
// ============================================================================

/**
 * Interceptor al teclear '}' tras `\begin{nombre}`.
 * Inserta automáticamente `\end{nombre}` con salto de línea e indentación intermedia.
 */
export const latexAutoCloseInputHandler = EditorView.inputHandler.of((view, from, to, text) => {
  if (text !== '}') return false;

  const doc = view.state.doc;
  const line = doc.lineAt(from);
  const textBefore = line.text.slice(0, from - line.from);

  // Comprueba si justo antes estamos escribiendo \begin{nombre_entorno
  const match = textBefore.match(/\\begin\{([a-zA-Z*0-9_\-]+)$/);
  if (!match) return false;

  const envName = match[1];

  // Si closeBrackets ya tenía una '}' adelantada en el cursor, la reemplazamos
  let replaceTo = to;
  if (doc.sliceString(from, from + 1) === '}') {
    replaceTo = from + 1;
  }

  // Verificar si ya existe un \end{envName} inmediatamente después para evitar duplicados
  const nextText = doc.sliceString(replaceTo, replaceTo + 150);
  if (nextText.trim().startsWith(`\\end{${envName}}`)) {
    return false;
  }

  // Calcular indentación de la línea actual
  const indentMatch = line.text.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '';
  const innerIndent = indent + '  ';

  const insertText = `}\n${innerIndent}\n${indent}\\end{${envName}}`;
  const targetCursor = from + 1 + 1 + innerIndent.length;

  view.dispatch({
    changes: { from, to: replaceTo, insert: insertText },
    selection: EditorSelection.cursor(targetCursor),
    scrollIntoView: true
  });

  return true;
});

/**
 * Handler para la tecla Enter justo tras un entorno `\begin{nombre}`.
 * Si el usuario ya cerró la llave y pulsa Enter, genera `\end{nombre}` si aún no existe.
 */
export function handleEnterAfterBegin(view: EditorView): boolean {
  const { head } = view.state.selection.main;
  const doc = view.state.doc;
  const line = doc.lineAt(head);
  const textBefore = line.text.slice(0, head - line.from).trimEnd();

  const match = textBefore.match(/\\begin\{([a-zA-Z*0-9_\-]+)\}$/);
  if (!match) return false;

  const envName = match[1];

  const nextText = doc.sliceString(head, head + 150);
  if (nextText.trim().startsWith(`\\end{${envName}}`)) {
    return false;
  }

  const indentMatch = line.text.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '';
  const innerIndent = indent + '  ';

  const insertText = `\n${innerIndent}\n${indent}\\end{${envName}}`;
  const targetCursor = head + 1 + innerIndent.length;

  view.dispatch({
    changes: { from: head, insert: insertText },
    selection: EditorSelection.cursor(targetCursor),
    scrollIntoView: true
  });

  return true;
}

// ============================================================================
// 5. Configuración e Integración Completa para CodeMirror 6
// ============================================================================

export function createLatexAutocompleteExtension(): Extension[] {
  return [
    // 1. Cierre automático de corchetes y llaves ({}, [], ())
    closeBrackets(),

    // 2. Extensión de autocompletado nativa con filtrado difuso (fuzzy)
    autocompletion({
      override: [latexCompletionSource],
      activateOnTyping: true,
      maxRenderedOptions: 50,
      icons: true,
      defaultKeymap: false // Configuramos nuestro propio keymap para priorizar Tab y Enter
    }),

    // 3. Auto-cierre de entornos al teclear '}'
    latexAutoCloseInputHandler,

    // 4. Mapeo de teclas de autocompletado y atajos LaTeX
    keymap.of([
      // Tab completa la sugerencia si el menú de completado está visible
      { key: 'Tab', run: acceptCompletion },
      // Enter cierra entorno si estamos al final de \begin{...}, o completa sugerencia
      { key: 'Enter', run: acceptCompletion },
      { key: 'Enter', run: handleEnterAfterBegin },
      // Atajos estándar de CodeMirror para autocompletado y closeBrackets
      ...completionKeymap,
      ...closeBracketsKeymap
    ])
  ];
}
