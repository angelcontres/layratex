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
 * Convierte un bloque tabular de LaTeX a una tabla en formato Markdown.
 */
function parseTabularToMarkdown(tabularBlock: string): string {
  const match = tabularBlock.match(/\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/);
  if (!match) return tabularBlock;

  const inner = match[1];
  const rawRows = inner.split(/\\\\/);
  const parsedRows: string[][] = [];

  for (const rawRow of rawRows) {
    const cleanRow = rawRow.replace(/\\(hline|toprule|midrule|bottomrule)/g, '').trim();
    if (!cleanRow) continue;
    const cells = cleanRow.split('&').map(cell => {
      let c = cell.trim();
      c = c.replace(/\\textbf\{([^}]+)\}/g, '$1');
      return c;
    });
    if (cells.length > 0 && !cells.every(c => !c)) {
      parsedRows.push(cells);
    }
  }

  if (parsedRows.length === 0) return '';
  const colCount = Math.max(...parsedRows.map(r => r.length));
  for (const r of parsedRows) {
    while (r.length < colCount) r.push('');
  }

  const header = parsedRows[0];
  const divider = Array(colCount).fill(':---');
  const dataRows = parsedRows.slice(1);

  let md = `\n| ${header.join(' | ')} |\n| ${divider.join(' | ')} |\n`;
  for (const row of dataRows) {
    md += `| ${row.join(' | ')} |\n`;
  }
  return md;
}

/**
 * Convierte texto visual simple a un documento LaTeX completo y compilable (.tex).
 * Opcionalmente preserva el preámbulo existente (paquetes y configuraciones) si el usuario ya tenía código LaTeX.
 */
export function visualToLatex(
  visualText: string, 
  metadata: VisualDocMetadata, 
  existingLatex?: string
): string {
  let body = visualText;

  // Mecanismo de protección de bloques (stash) para no alterar matemáticas, tablas ni figuras
  const stash: string[] = [];
  const stashBlock = (content: string) => {
    const placeholder = `ZXLAYRATEXSTASH${stash.length}XZ`;
    stash.push(content);
    return placeholder;
  };

  // 1. Proteger bloques matemáticos en display ($$ ... $$)
  body = body.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const trimmed = math.trim();
    // Si ya es un entorno AMS (align, gather, etc.), no envolverlo en \[ ... \]
    if (/^\\begin\{(equation\*?|align\*?|gather\*?|multline\*?)\}/.test(trimmed)) {
      return stashBlock(`\n${trimmed}\n`);
    }
    return stashBlock(`\n\\[\n${trimmed}\n\\]\n`);
  });

  // 2. Convertir y proteger tablas Markdown a formato canónico con booktabs (\toprule, \midrule, \bottomrule)
  body = body.replace(/((?:\|[^\n]+\|\r?\n?){2,})/g, (match) => {
    const rawLines = match.trim().split('\n').filter(l => l.includes('|'));
    if (rawLines.length < 2) return match;

    const parseRow = (line: string) => line.split('|').slice(1, -1).map(c => c.trim());
    const headerRow = parseRow(rawLines[0]);
    const isDivider = rawLines[1].replace(/[\s|:-]/g, '') === '';
    const dataStartIndex = isDivider ? 2 : 1;
    const colCount = headerRow.length;
    // En LaTeX booktabs profesional no se usan barras verticales '|'
    const colSpec = Array(colCount).fill('c').join('');

    let texTable = `\n\\begin{table}[htbp]\n\\centering\n\\begin{tabular}{${colSpec}}\n\\toprule\n`;
    texTable += headerRow.map(h => `\\textbf{${h}}`).join(' & ') + ' \\\\\n\\midrule\n';

    for (let i = dataStartIndex; i < rawLines.length; i++) {
      const row = parseRow(rawLines[i]);
      if (row.length === 0 || row.every(c => !c)) continue;
      while (row.length < colCount) row.push('');
      texTable += row.join(' & ') + ' \\\\\n';
    }

    texTable += `\\bottomrule\n\\end{tabular}\n\\end{table}\n`;
    return stashBlock(texTable);
  });

  // 3. Proteger fórmulas en línea ($ ... $)
  body = body.replace(/\$([^\$\n]+)\$/g, (m) => stashBlock(m));

  // 4. Convertir y proteger imágenes Markdown ![caption](url) a figure
  body = body.replace(/!\[(.*?)\]\((.*?)\)/g, (_, caption, url) => {
    return stashBlock(`\n\\begin{figure}[htbp]\n\\centering\n\\includegraphics[width=0.8\\textwidth]{${url}}\n\\caption{${caption || 'Figura'}}\n\\end{figure}\n`);
  });

  // 5. Soporte canónico para entorno abstract / Resumen
  body = body.replace(/(?:^>\s*\*\*(?:Resumen|Abstract)\*\*\s*\n|^#\s+(?:Resumen|Abstract)\s*\n|^##\s+(?:Resumen|Abstract)\s*\n)((?:^[^\n#]+\n?)+)/im, (_, content) => {
    const cleanAbstract = content
      .trim()
      .split('\n')
      .map((l: string) => l.replace(/^>\s?/, '').trim())
      .filter(Boolean)
      .join('\n');
    return stashBlock(`\n\\begin{abstract}\n${cleanAbstract}\n\\end{abstract}\n`);
  });

  // Evitar duplicar el título si el texto visual inicia con un encabezado idéntico a metadata.title
  if (metadata.title) {
    const cleanTitle = metadata.title.trim();
    const titleRegex = new RegExp(`^#\\s+${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
    body = body.replace(titleRegex, '');
  }

  // 5. Encabezados (# Título -> \section{Título})
  body = body.replace(/^#\s+(.+)$/gm, '\n\\section{$1}\n');
  body = body.replace(/^##\s+(.+)$/gm, '\n\\subsection{$1}\n');
  body = body.replace(/^###\s+(.+)$/gm, '\n\\subsubsection{$1}\n');

  // 6. Saltos de página / Divisores (--- -> \newpage)
  body = body.replace(/^---\s*$/gm, '\n\\newpage\n');

  // 7. Notas / Callouts agrupados (> Nota -> \begin{quote} ... \end{quote})
  body = body.replace(/((?:^>[^\n]*\n?)+)/gm, (match) => {
    const lines = match
      .split('\n')
      .map(l => l.replace(/^>\s?/, ''))
      .filter(l => l.trim().length > 0)
      .join('\n');
    return `\n\\begin{quote}\n${lines}\n\\end{quote}\n`;
  });

  // 8. Listas con viñetas (* o - -> \begin{itemize})
  body = body.replace(/((?:^[*-]\s+[^\n]+\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map(line => line.replace(/^[*-]\s+/, '  \\item '))
      .join('\n');
    return `\n\\begin{itemize}\n${items}\n\\end{itemize}\n`;
  });

  // 9. Listas numeradas (1. 2. -> \begin{enumerate})
  body = body.replace(/((?:^\d+\.\s+[^\n]+\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map(line => line.replace(/^\d+\.\s+/, '  \\item '))
      .join('\n');
    return `\n\\begin{enumerate}\n${items}\n\\end{enumerate}\n`;
  });

  // 10. Escapar caracteres especiales reservados de LaTeX fuera de bloques matemáticos
  body = body.replace(/(?<!\\)%/g, '\\%');
  body = body.replace(/(?<!\\)&/g, '\\&');
  body = body.replace(/(?<!\\)_/g, '\\_');

  // 11. Formato de texto básico
  body = body.replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}');
  body = body.replace(/\*([^*]+)\*/g, '\\textit{$1}');

  // 12. Microtipografía TeX: Comillas tipográficas dobles canónicas (``...'')
  body = body.replace(/"([^"\n]+)"/g, "``$1''");

  // Restaurar bloques protegidos
  for (let i = stash.length - 1; i >= 0; i--) {
    body = body.replace(`ZXLAYRATEXSTASH${i}XZ`, stash[i]);
  }

  // Normalizar saltos de línea excesivos
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  // Si existe código LaTeX previo con preámbulo personalizado, preservarlo
  if (existingLatex) {
    const matchDoc = existingLatex.match(/([\s\S]*?\\begin\{document\})/);
    if (matchDoc) {
      let preamble = matchDoc[1];
      if (metadata.title) {
        preamble = preamble.replace(/\\title\{[^}]*\}/, `\\title{${metadata.title}}`);
      }
      if (metadata.author) {
        preamble = preamble.replace(/\\author\{[^}]*\}/, `\\author{${metadata.author}}`);
      }
      let makeTitleCmd = '';
      if (!preamble.includes('\\maketitle')) {
        makeTitleCmd = '\\maketitle\n\n';
      }
      return `${preamble}\n${makeTitleCmd}${body || '\\phantom{.}'}\n\n\\end{document}\n`;
    }
  }

  // Preámbulo estándar limpio por defecto
  const fontPackage = metadata.fontStyle === 'sans' 
    ? '\\renewcommand{\\familydefault}{\\sfdefault}\n' 
    : '';

  return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{microtype}
\\usepackage{geometry}
\\geometry{top=2.5cm, bottom=2.5cm, left=3cm, right=3cm}
\\usepackage{hyperref}
\\usepackage{xcolor}
${fontPackage}\\title{${metadata.title || 'Documento sin título'}}
\\author{${metadata.author || 'Usuario'}}
\\date{\\today}

\\begin{document}
\\maketitle

${body || '\\phantom{.}'}

\\end{document}
`;
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

  // 1. Convertir tablas \begin{table} y \begin{tabular} a Markdown
  body = body.replace(/(?:\\begin\{table\}(?:\[.*?\])?\s*(?:\\centering\s*)?)?(?:\\begin\{center\}\s*)?\\begin\{tabular\}\{[^}]*\}[\s\S]*?\\end\{tabular\}(?:\s*\\end\{center\})?(?:\s*\\end\{table\})?/g, (match) => {
    return parseTabularToMarkdown(match);
  });

  // 2. Convertir entorno abstract a nota de Resumen
  body = body.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (_, absText) => {
    const lines = absText.trim().split('\n').map((l: string) => `> ${l.trim()}`).join('\n');
    return `\n> **Resumen**\n${lines}\n\n`;
  });

  // 2. Convertir bloques matemáticos en display a $$ ... $$
  body = body.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  body = body.replace(/\\begin\{(equation\*?|align\*?|gather\*?|multline\*?)\}([\s\S]*?)\\end\{\1\}/g, (fullMatch) => {
    return `\n$$\n${fullMatch.trim()}\n$$\n`;
  });

  // 3. Convertir fórmulas inline \( ... \) a $ ... $
  body = body.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 4. Convertir figuras e imágenes a Markdown ![caption](url)
  body = body.replace(/\\begin\{figure\}[\s\S]*?\\includegraphics(?:\[.*?\])?\{([^}]+)\}[\s\S]*?\\caption\{([^}]+)\}[\s\S]*?\\end\{figure\}/g, (_, url, caption) => {
    return `\n![${caption}](${url})\n`;
  });
  body = body.replace(/\\includegraphics(?:\[.*?\])?\{([^}]+)\}/g, (_, url) => {
    return `\n![](${url})\n`;
  });

  // 5. Convertir encabezados (\section, \subsection, \subsubsection a #, ##, ###)
  body = body.replace(/\\section\*?\{([^}]+)\}/g, '\n# $1\n');
  body = body.replace(/\\subsection\*?\{([^}]+)\}/g, '\n## $1\n');
  body = body.replace(/\\subsubsection\*?\{([^}]+)\}/g, '\n### $1\n');

  // 6. Convertir saltos de página (\newpage, \clearpage -> ---)
  body = body.replace(/\\(newpage|clearpage|pagebreak)\b/g, '\n---\n');

  // 7. Convertir notas (\begin{quote} ... \end{quote} a > ...)
  body = body.replace(/\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g, (_, text) => {
    const lines = text.trim().split('\n').map((l: string) => `> ${l.trim()}`).join('\n');
    return `\n${lines}\n\n`;
  });

  // 8. Convertir listas con viñetas (\begin{itemize} -> * ...)
  body = body.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, listContent: string) => {
    const items = listContent
      .trim()
      .split(/\\item\s+/)
      .filter(Boolean)
      .map((item: string) => `* ${item.trim()}`)
      .join('\n');
    return `\n${items}\n\n`;
  });

  // 9. Convertir listas numeradas (\begin{enumerate} -> 1. ...)
  body = body.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, listContent: string) => {
    let counter = 1;
    const items = listContent
      .trim()
      .split(/\\item\s+/)
      .filter(Boolean)
      .map((item: string) => `${counter++}. ${item.trim()}`)
      .join('\n');
    return `\n${items}\n\n`;
  });

  // 10. Convertir formato de texto
  body = body.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
  body = body.replace(/\\textit\{([^}]+)\}/g, '*$1*');
  body = body.replace(/\\emph\{([^}]+)\}/g, '*$1*');
  body = body.replace(/\\underline\{([^}]+)\}/g, '$1');

  // 11. Restaurar caracteres reservados escapados
  body = body.replace(/\\%/g, '%');
  body = body.replace(/\\&/g, '&');
  body = body.replace(/\\_/g, '_');

  // 12. Restaurar comillas tipográficas TeX (``...'' a "...")
  body = body.replace(/``([^'\n]+)''/g, '"$1"');

  // 13. Limpiar placeholders como \phantom{.}
  body = body.replace(/\\phantom\{\.\}/g, '');

  // Limpiar saltos de línea excesivos
  return body.trim().replace(/\n{3,}/g, '\n\n');
}
