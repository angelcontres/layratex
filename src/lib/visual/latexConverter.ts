/**
 * Convertidor bidireccional entre la representación amigable de PaperCraft (Notion-like)
 * y el código LaTeX estándar compilable (.tex).
 */

export interface VisualDocMetadata {
  title: string;
  author?: string;
  date?: string;
  templateId?: string;
  fontStyle?: 'serif' | 'sans';
}

/**
 * Convierte texto visual simple (con encabezados, fórmulas, negrita y notas) a un documento LaTeX completo.
 */
export function visualToLatex(visualText: string, metadata: VisualDocMetadata): string {
  const fontPackage = metadata.fontStyle === 'sans' 
    ? '\\renewcommand{\\familydefault}{\\sfdefault}\n' 
    : '';

  let body = visualText;

  // 1. Convertir bloques de ecuaciones $$ ... $$ a \[ ... \]
  body = body.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return `\n\\[\n${math.trim()}\n\\]\n`;
  });

  // 2. Convertir títulos (# Título -> \section{Título})
  body = body.replace(/^#\s+(.+)$/gm, '\\section{$1}');
  body = body.replace(/^##\s+(.+)$/gm, '\\subsection{$1}');
  body = body.replace(/^###\s+(.+)$/gm, '\\subsubsection{$1}');

  // 3. Convertir notas/callouts (> **Nota:** ... -> \begin{quote} ... \end{quote})
  body = body.replace(/^>\s+(.+)$/gm, '\\begin{quote}\n$1\n\\end{quote}');

  // 4. Convertir listas (* Item -> \begin{itemize} \item Item \end{itemize})
  // Agrupar elementos contiguos con viñetas
  body = body.replace(/(?:^\*\s+.+\n?)+/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map(line => line.replace(/^\*\s+/, '  \\item '))
      .join('\n');
    return `\\begin{itemize}\n${items}\n\\end{itemize}\n`;
  });

  // 5. Convertir tablas Markdown a \begin{tabular}
  body = body.replace(/((?:\|[^\n]+\|\r?\n?){2,})/g, (match) => {
    const rawLines = match.trim().split('\n').filter(l => l.includes('|'));
    if (rawLines.length < 2) return match;

    const parseRow = (line: string) => line.split('|').slice(1, -1).map(c => c.trim());
    const headerRow = parseRow(rawLines[0]);
    const isDivider = rawLines[1].replace(/[\s|:-]/g, '') === '';
    const dataStartIndex = isDivider ? 2 : 1;
    const colCount = headerRow.length;
    const colSpec = '|' + Array(colCount).fill('c').join('|') + '|';

    let texTable = `\\begin{center}\n\\begin{tabular}{${colSpec}}\n\\hline\n`;
    texTable += headerRow.map(h => `\\textbf{${h}}`).join(' & ') + ' \\\\ \\hline\n';

    for (let i = dataStartIndex; i < rawLines.length; i++) {
      const row = parseRow(rawLines[i]);
      if (row.length === 0 || row.every(c => !c)) continue;
      while (row.length < colCount) row.push('');
      texTable += row.join(' & ') + ' \\\\ \\hline\n';
    }

    texTable += `\\end{tabular}\n\\end{center}\n`;
    return texTable;
  });

  // 6. Convertir imágenes Markdown ![caption](url) a figure
  body = body.replace(/!\[(.*?)\]\((.*?)\)/g, (_, caption, url) => {
    return `\n\\begin{figure}[htbp]\n\\centering\n\\includegraphics[width=0.8\\textwidth]{${url}}\n\\caption{${caption || 'Figura'}}\n\\end{figure}\n`;
  });

  // 7. Convertir formato de texto
  // Negrita **texto** -> \textbf{texto}
  body = body.replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}');
  // Cursiva *texto* o _texto_ -> \textit{texto}
  body = body.replace(/\*([^*]+)\*/g, '\\textit{$1}');

  const latexDocument = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{geometry}
\\geometry{top=2.5cm, bottom=2.5cm, left=3cm, right=3cm}
\\usepackage{hyperref}
\\usepackage{xcolor}
${fontPackage}
\\title{${metadata.title || 'Documento sin título'}}
\\author{${metadata.author || 'Usuario'}}
\\date{\\today}

\\begin{document}
\\maketitle

${body.trim()}

\\end{document}
`;

  return latexDocument;
}

/**
 * Convierte un documento LaTeX existente en texto visual amigable para el lienzo PaperCraft.
 */
export function latexToVisual(latexCode: string): string {
  // Extraer el cuerpo de \begin{document} ... \end{document}
  let body = latexCode;
  const matchDoc = latexCode.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (matchDoc) {
    body = matchDoc[1];
  }

  // Eliminar \maketitle
  body = body.replace(/\\maketitle/g, '');

  // Convertir \section, \subsection, \subsubsection a #, ##, ###
  body = body.replace(/\\section\*?\{([^}]+)\}/g, '# $1\n');
  body = body.replace(/\\subsection\*?\{([^}]+)\}/g, '## $1\n');
  body = body.replace(/\\subsubsection\*?\{([^}]+)\}/g, '### $1\n');

  // Convertir bloques matemáticos \[ ... \] o \begin{equation} ... \end{equation} a $$ ... $$
  body = body.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  body = body.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);

  // Convertir \begin{quote} ... \end{quote} a > ...
  body = body.replace(/\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g, (_, text) => {
    return text.trim().split('\n').map((l: string) => `> ${l.trim()}`).join('\n') + '\n';
  });

  // Convertir \begin{itemize} ... \end{itemize} a * ...
  body = body.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, listContent) => {
    return listContent
      .replace(/\\item\s+(.*)/g, '* $1')
      .trim() + '\n';
  });

  // Convertir formato básico
  body = body.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
  body = body.replace(/\\textit\{([^}]+)\}/g, '*$1*');
  body = body.replace(/\\emph\{([^}]+)\}/g, '*$1*');
  body = body.replace(/\\underline\{([^}]+)\}/g, '$1');

  // Limpiar saltos de línea excesivos
  return body.trim().replace(/\n{3,}/g, '\n\n');
}
