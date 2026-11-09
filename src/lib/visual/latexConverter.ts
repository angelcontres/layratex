/**
 * Convertidor bidireccional entre la representación amigable de PaperCraft
 * y el código LaTeX estándar compilable (.tex) con estética académica completa.
 */

export interface VisualDocMetadata {
  title: string;
  author?: string;
  date?: string;
  templateId?: string;
  fontStyle?: 'serif' | 'sans';
}

/**
 * Extrae el argumento entre llaves balanceadas de un comando LaTeX como \title{...} o \author{...}.
 */
function extractBalancedCommandArg(source: string, commandName: string): string | null {
  const regex = new RegExp(`\\\\${commandName}\\s*(?:\\[[^\\]]*\\])?\\s*\\{`, 'm');
  const match = regex.exec(source);
  if (!match) return null;

  let idx = match.index + match[0].length;
  let depth = 1;
  const start = idx;

  while (idx < source.length && depth > 0) {
    const ch = source[idx];
    const prev = idx > 0 ? source[idx - 1] : '';
    if (ch === '{' && prev !== '\\') depth++;
    else if (ch === '}' && prev !== '\\') depth--;
    idx++;
  }

  if (depth !== 0) return null;
  return source.slice(start, idx - 1).trim();
}

/**
 * Reemplaza el argumento entre llaves balanceadas de un comando LaTeX (ej. \title{...}).
 */
function replaceBalancedCommandArg(source: string, commandName: string, newValue: string): string {
  const regex = new RegExp(`(\\\\${commandName}\\s*(?:\\[[^\\]]*\\])?\\s*\\{)`, 'm');
  const match = regex.exec(source);
  if (!match) return source;

  let idx = match.index + match[0].length;
  let depth = 1;

  while (idx < source.length && depth > 0) {
    const ch = source[idx];
    const prev = idx > 0 ? source[idx - 1] : '';
    if (ch === '{' && prev !== '\\') depth++;
    else if (ch === '}' && prev !== '\\') depth--;
    idx++;
  }

  if (depth !== 0) return source;
  return source.slice(0, match.index) + `\\${commandName}{${newValue}}` + source.slice(idx);
}

/**
 * Extrae título, autor y fecha de cualquier documento LaTeX (.tex) soportando llaves anidadas.
 */
export function extractLatexMetadata(latexCode: string): {
  title?: string;
  author?: string;
  date?: string;
} {
  const cleanMacro = (val: string | null): string | undefined => {
    if (!val) return undefined;
    let res = val
      .replace(/\\thanks\{[^{}]*\}/g, '')
      .replace(/\\(?:textbf|textit|emph|large|Large|LARGE|huge|Huge|small|normalsize)\{([^{}]*)\}/g, '$1')
      .replace(/\\(?:large|Large|LARGE|huge|Huge|bf|it|rm|sf)\b\s*/g, '')
      .replace(/\\and\b/g, ' · ')
      .replace(/\\\\/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return res || undefined;
  };

  return {
    title: cleanMacro(extractBalancedCommandArg(latexCode, 'title')),
    author: cleanMacro(extractBalancedCommandArg(latexCode, 'author')),
    date: cleanMacro(extractBalancedCommandArg(latexCode, 'date'))
  };
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
    const cleanRow = rawRow.replace(/\\(hline|toprule|midrule|bottomrule|cline\{[^}]*\})/g, '').trim();
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
  body = body.replace(/(?:^>\s*\*\*(?:Resumen|Abstract):?\*\*:?\s*\n|^#\s+(?:Resumen|Abstract)\s*\n|^##\s+(?:Resumen|Abstract)\s*\n)((?:^[^\n#]+\n?)+)/im, (_, content) => {
    const cleanAbstract = content
      .trim()
      .split('\n')
      .map((l: string) => l.replace(/^>\s?/, '').trim())
      .filter(Boolean)
      .join('\n');
    return stashBlock(`\n\\begin{abstract}\n${cleanAbstract}\n\\end{abstract}\n`);
  });

  // 5b. Soporte canónico para entornos matemáticos AMS: Teorema, Definición, Lema, Demostración
  body = body.replace(/((?:^>\s*[^\n]+\n?)+)/gm, (match) => {
    const cleanLines = match
      .trim()
      .split('\n')
      .map(l => l.replace(/^>\s?/, '').trim());
    const joined = cleanLines.join('\n');

    const thmMatch = joined.match(/^\*\*(Teorema|Theorem):?\*\*:?\s*([\s\S]*)/i);
    if (thmMatch) {
      return stashBlock(`\n\\begin{theorem}\n${thmMatch[2].trim()}\n\\end{theorem}\n`);
    }
    const defMatch = joined.match(/^\*\*(Definición|Definicion|Definition):?\*\*:?\s*([\s\S]*)/i);
    if (defMatch) {
      return stashBlock(`\n\\begin{definition}\n${defMatch[2].trim()}\n\\end{definition}\n`);
    }
    const lemMatch = joined.match(/^\*\*(Lema|Lemma):?\*\*:?\s*([\s\S]*)/i);
    if (lemMatch) {
      return stashBlock(`\n\\begin{lemma}\n${lemMatch[2].trim()}\n\\end{lemma}\n`);
    }
    const proofMatch = joined.match(/^\*\*(Demostración|Demostracion|Proof):?\*\*:?\s*([\s\S]*)/i);
    if (proofMatch) {
      return stashBlock(`\n\\begin{proof}\n${proofMatch[2].trim()}\n\\end{proof}\n`);
    }
    return match;
  });

  // Evitar duplicar el título si el texto visual inicia con un encabezado idéntico a metadata.title
  if (metadata.title) {
    const cleanTitle = metadata.title.trim();
    const titleRegex = new RegExp(`^#\\s+${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
    body = body.replace(titleRegex, '');
  }

  // 6. Encabezados (# Título -> \section{Título})
  body = body.replace(/^#\s+(.+)$/gm, '\n\\section{$1}\n');
  body = body.replace(/^##\s+(.+)$/gm, '\n\\subsection{$1}\n');
  body = body.replace(/^###\s+(.+)$/gm, '\n\\subsubsection{$1}\n');

  // 7. Saltos de página / Divisores (--- -> \newpage)
  body = body.replace(/^---\s*$/gm, '\n\\newpage\n');

  // 8. Notas / Callouts agrupados (> Nota -> \begin{quote} ... \end{quote})
  body = body.replace(/((?:^>[^\n]*\n?)+)/gm, (match) => {
    const lines = match
      .split('\n')
      .map(l => l.replace(/^>\s?/, ''))
      .filter(l => l.trim().length > 0)
      .join('\n');
    return `\n\\begin{quote}\n${lines}\n\\end{quote}\n`;
  });

  // 9. Listas con viñetas (* o - -> \begin{itemize})
  body = body.replace(/((?:^[*-]\s+[^\n]+\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map(line => line.replace(/^[*-]\s+/, '  \\item '))
      .join('\n');
    return `\n\\begin{itemize}\n${items}\n\\end{itemize}\n`;
  });

  // 10. Listas numeradas (1. 2. -> \begin{enumerate})
  body = body.replace(/((?:^\d+\.\s+[^\n]+\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map(line => line.replace(/^\d+\.\s+/, '  \\item '))
      .join('\n');
    return `\n\\begin{enumerate}\n${items}\n\\end{enumerate}\n`;
  });

  // 11. Escapar caracteres especiales reservados de LaTeX fuera de bloques matemáticos
  body = body.replace(/(?<!\\)%/g, '\\%');
  body = body.replace(/(?<!\\)&/g, '\\&');
  body = body.replace(/(?<!\\)_/g, '\\_');

  // 12. Formato de texto básico
  body = body.replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}');
  body = body.replace(/\*([^*]+)\*/g, '\\textit{$1}');

  // 13. Microtipografía TeX: Comillas tipográficas dobles canónicas (``...'')
  body = body.replace(/"([^"\n]+)"/g, "``$1''");

  // Restaurar bloques protegidos
  for (let i = stash.length - 1; i >= 0; i--) {
    body = body.replace(`ZXLAYRATEXSTASH${i}XZ`, stash[i]);
  }

  // Normalizar saltos de línea excesivos
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  // Si existe código LaTeX previo con preámbulo personalizado, preservarlo intacto
  if (existingLatex) {
    const matchDoc = existingLatex.match(/([\s\S]*?\\begin\{document\})/);
    if (matchDoc) {
      let preamble = matchDoc[1];
      if (metadata.title) {
        if (/\\title\s*(?:\[[^\]]*\])?\s*\{/.test(preamble)) {
          preamble = replaceBalancedCommandArg(preamble, 'title', metadata.title);
        } else {
          preamble = preamble.replace(/\\begin\{document\}/, `\\title{${metadata.title}}\n\\begin{document}`);
        }
      }
      if (metadata.author) {
        if (/\\author\s*(?:\[[^\]]*\])?\s*\{/.test(preamble)) {
          preamble = replaceBalancedCommandArg(preamble, 'author', metadata.author);
        } else {
          preamble = preamble.replace(/\\begin\{document\}/, `\\author{${metadata.author}}\n\\begin{document}`);
        }
      }
      let makeTitleCmd = '';
      if (!preamble.includes('\\maketitle')) {
        makeTitleCmd = '\\maketitle\n\n';
      }
      return `${preamble}\n${makeTitleCmd}${body || '\\phantom{.}'}\n\n\\end{document}\n`;
    }
  }

  // Preámbulo estándar limpio por defecto con soporte completo de amsthm y microtype
  const fontPackage = metadata.fontStyle === 'sans' 
    ? '\\renewcommand{\\familydefault}{\\sfdefault}\n' 
    : '';

  return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{microtype}
\\usepackage{geometry}
\\geometry{top=2.5cm, bottom=2.5cm, left=3cm, right=3cm}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\newtheorem{theorem}{Teorema}
\\newtheorem{definition}{Definición}
\\newtheorem{lemma}{Lema}
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
  let body = latexCode;
  const matchDoc = latexCode.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (matchDoc) {
    body = matchDoc[1];
  }

  // Eliminar comentarios LaTeX no escapados (% ...)
  body = body.replace(/(?<!\\)%.*$/gm, '');

  // Eliminar \maketitle, \tableofcontents y definiciones de \title, \author, \date si estaban dentro de \begin{document}
  body = body.replace(/\\maketitle\b/g, '');
  body = body.replace(/\\tableofcontents\b/g, '');
  body = replaceBalancedCommandArg(body, 'title', '').replace(/\\title\{\}/g, '');
  body = replaceBalancedCommandArg(body, 'author', '').replace(/\\author\{\}/g, '');
  body = replaceBalancedCommandArg(body, 'date', '').replace(/\\date\{\}/g, '');

  // Eliminar comandos \label{...} sueltos para no ensuciar el texto visual
  body = body.replace(/\\label\{[^}]*\}/g, '');

  // 1. Convertir tablas \begin{table} y \begin{tabular} a Markdown
  body = body.replace(/(?:\\begin\{table\*?\}(?:\[.*?\])?\s*(?:\\centering\s*)?(?:\\caption\{[^}]*\}\s*)?)?(?:\\begin\{center\}\s*)?\\begin\{tabular\}\{[^}]*\}[\s\S]*?\\end\{tabular\}(?:\s*\\caption\{[^}]*\})?(?:\s*\\end\{center\})?(?:\s*\\end\{table\*?\})?/g, (match) => {
    return parseTabularToMarkdown(match);
  });

  // 2. Convertir entorno abstract a nota de Resumen
  body = body.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (_, absText) => {
    const lines = absText.trim().split('\n').map((l: string) => `> ${l.trim()}`).join('\n');
    return `\n> **Resumen**\n${lines}\n\n`;
  });

  // 2b. Convertir entornos académicos AMS (theorem, definition, lemma, proof)
  body = body.replace(/\\begin\{theorem\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{theorem\}/g, (_, text) => {
    return `\n> **Teorema:** ${text.trim().replace(/\n+/g, ' ')}\n\n`;
  });
  body = body.replace(/\\begin\{definition\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{definition\}/g, (_, text) => {
    return `\n> **Definición:** ${text.trim().replace(/\n+/g, ' ')}\n\n`;
  });
  body = body.replace(/\\begin\{lemma\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{lemma\}/g, (_, text) => {
    return `\n> **Lema:** ${text.trim().replace(/\n+/g, ' ')}\n\n`;
  });
  body = body.replace(/\\begin\{proof\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{proof\}/g, (_, text) => {
    return `\n> **Demostración:** ${text.trim().replace(/\n+/g, ' ')}\n\n`;
  });

  // 3. Convertir bloques matemáticos en display a $$ ... $$
  body = body.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  body = body.replace(/\\begin\{(equation\*?|align\*?|gather\*?|multline\*?)\}([\s\S]*?)\\end\{\1\}/g, (fullMatch) => {
    return `\n$$\n${fullMatch.trim()}\n$$\n`;
  });

  // 4. Convertir fórmulas inline \( ... \) a $ ... $
  body = body.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 5. Convertir figuras e imágenes a Markdown ![caption](url)
  body = body.replace(/\\begin\{figure\*?\}[\s\S]*?\\includegraphics(?:\[.*?\])?\{([^}]+)\}[\s\S]*?\\caption\{([^}]+)\}[\s\S]*?\\end\{figure\*?\}/g, (_, url, caption) => {
    return `\n![${caption}](${url})\n`;
  });
  body = body.replace(/\\includegraphics(?:\[.*?\])?\{([^}]+)\}/g, (_, url) => {
    return `\n![](${url})\n`;
  });

  // 6. Convertir encabezados (\section, \subsection, \subsubsection a #, ##, ###)
  body = body.replace(/\\section\*?(?:\[[^\]]*\])?\{([^}]+)\}/g, '\n# $1\n');
  body = body.replace(/\\subsection\*?(?:\[[^\]]*\])?\{([^}]+)\}/g, '\n## $1\n');
  body = body.replace(/\\subsubsection\*?(?:\[[^\]]*\])?\{([^}]+)\}/g, '\n### $1\n');

  // 7. Convertir saltos de página (\newpage, \clearpage -> ---)
  body = body.replace(/\\(newpage|clearpage|pagebreak)\b/g, '\n---\n');

  // 8. Convertir notas (\begin{quote} ... \end{quote} a > ...)
  body = body.replace(/\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g, (_, text) => {
    const lines = text.trim().split('\n').map((l: string) => `> ${l.trim()}`).join('\n');
    return `\n${lines}\n\n`;
  });

  // 9. Convertir listas con viñetas (\begin{itemize} -> * ...)
  body = body.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, listContent: string) => {
    const items = listContent
      .trim()
      .split(/\\item\s+/)
      .filter(Boolean)
      .map((item: string) => `* ${item.trim()}`)
      .join('\n');
    return `\n${items}\n\n`;
  });

  // 10. Convertir listas numeradas (\begin{enumerate} -> 1. ...)
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

  // 11. Convertir formato de texto
  body = body.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
  body = body.replace(/\\textit\{([^}]+)\}/g, '*$1*');
  body = body.replace(/\\emph\{([^}]+)\}/g, '*$1*');
  body = body.replace(/\\texttt\{([^}]+)\}/g, '`$1`');
  body = body.replace(/\\underline\{([^}]+)\}/g, '$1');

  // 12. Restaurar caracteres reservados escapados
  body = body.replace(/\\%/g, '%');
  body = body.replace(/\\&/g, '&');
  body = body.replace(/\\_/g, '_');

  // 13. Restaurar comillas tipográficas TeX (``...'' a "...")
  body = body.replace(/``([^'\n]+)''/g, '"$1"');

  // 14. Limpiar placeholders como \phantom{.}
  body = body.replace(/\\phantom\{\.\}/g, '');

  // Limpiar saltos de línea excesivos
  return body.trim().replace(/\n{3,}/g, '\n\n');
}

/**
 * Resuelve en memoria comandos `\input{ruta}` e `\include{ruta}` utilizando un mapa
 * de archivos del proyecto (`relative_path -> contenido`).
 * Permite que tanto la Hoja Visual A4 (`PaperEditor`), la Vista Previa (`LatexPreview`)
 * como la Exportación a Word/PDF rendericen el documento completo aunque `main.tex`
 * esté dividido en subcarpetas (`secciones/`, `capitulos/`, etc.).
 */
export function resolveLatexInputsInMemory(
  latexCode: string,
  filesMap: Record<string, string>,
  depth = 0
): string {
  if (!latexCode || !filesMap || Object.keys(filesMap).length === 0 || depth > 8) {
    return latexCode;
  }

  const lines = latexCode.split('\n');
  const resolvedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('%')) {
      resolvedLines.push(line);
      continue;
    }

    const lineWithoutComment = trimmed.replace(/(?<!\\)%.*$/, '').trim();
    const match = lineWithoutComment.match(/^\\(input|include)\{([^}]+)\}/);
    if (match) {
      const cmd = match[1].toUpperCase();
      const rawTarget = match[2].trim().replace(/\\/g, '/').replace(/^\.\//, '');
      const withTex = rawTarget.toLowerCase().endsWith('.tex') ? rawTarget : `${rawTarget}.tex`;

      const subContent =
        filesMap[withTex] ??
        filesMap[rawTarget] ??
        Object.entries(filesMap).find(
          ([k]) => k.toLowerCase() === withTex.toLowerCase() || k.toLowerCase().endsWith(`/${withTex.toLowerCase()}`)
        )?.[1];

      if (typeof subContent === 'string') {
        const nested = resolveLatexInputsInMemory(subContent, filesMap, depth + 1);
        resolvedLines.push(`% === BEGIN ${cmd}: ${withTex} ===`);
        resolvedLines.push(nested.trim());
        resolvedLines.push(`% === END ${cmd}: ${withTex} ===`);
        continue;
      }
    }

    resolvedLines.push(line);
  }

  return resolvedLines.join('\n');
}

export interface ModularSubfileItem {
  relative_path: string;
  content: string;
}

export interface ModularProjectSplitResult {
  mainTex: string;
  subfiles: ModularSubfileItem[];
  bibContent: string;
}

/**
 * Convierte un documento LaTeX monolítico en una estructura modular profesional de proyecto
 * dividida por carpetas (`main.tex` + `secciones/01-....tex` + `referencias.bib`),
 * compatible con los 3 modos de Layratex (Hoja Visual, Código .tex y Exportación PDF/Word + `build/`).
 */
export function splitLatexIntoModularProject(
  fullLatexCode: string,
  sectionsFolder = 'secciones'
): ModularProjectSplitResult {
  const defaultBib = `% Bibliografía BibTeX del Proyecto\n@article{knuth1984,\n  author  = {Donald E. Knuth},\n  title   = {Literate Programming},\n  journal = {The Computer Journal},\n  year    = {1984},\n  volume  = {27},\n  number  = {2},\n  pages   = {97--111}\n}\n`;

  // Si ya contiene \input{secciones/...} y no hay secciones sueltas que dividir, preservar
  const beginDocIdx = fullLatexCode.indexOf('\\begin{document}');
  const endDocIdx = fullLatexCode.lastIndexOf('\\end{document}');

  if (beginDocIdx === -1 || endDocIdx === -1 || endDocIdx <= beginDocIdx) {
    return {
      mainTex: fullLatexCode,
      subfiles: [
        {
          relative_path: `${sectionsFolder}/01-contenido.tex`,
          content: fullLatexCode.trim() + '\n'
        }
      ],
      bibContent: defaultBib
    };
  }

  const preamble = fullLatexCode.slice(0, beginDocIdx + '\\begin{document}'.length);
  const rawBody = fullLatexCode
    .slice(beginDocIdx + '\\begin{document}'.length, endDocIdx)
    // Limpiar marcadores previos de BEGIN/END INPUT si se re-modulariza desde contenido expandido
    .replace(/^% === (BEGIN|END) (INPUT|INCLUDE): .* ===$/gm, '')
    .trim();

  // Dividir el cuerpo por cada \section{...} o \section*{...}
  const lines = rawBody.split('\n');
  const headerLines: string[] = [];
  const sections: Array<{ title: string; lines: string[] }> = [];
  let currentSection: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const secMatch = line.trim().match(/^\\section\*?\{([^}]+)\}/);
    if (secMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: secMatch[1].trim(),
        lines: [line]
      };
    } else {
      if (currentSection) {
        currentSection.lines.push(line);
      } else {
        headerLines.push(line);
      }
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  // Si no había ningún \section{...}, crear una sección inicial en secciones/01-introduccion.tex
  if (sections.length === 0) {
    const subPath = `${sectionsFolder}/01-introduccion.tex`;
    const bodyContent = rawBody || '\\section{Introducción}\nRedacta aquí el contenido de la primera sección.';
    const mainTex = `${preamble}\n\\maketitle\n\n\\input{${sectionsFolder}/01-introduccion}\n\n\\end{document}\n`;
    return {
      mainTex,
      subfiles: [{ relative_path: subPath, content: bodyContent.trim() + '\n' }],
      bibContent: defaultBib
    };
  }

  const subfiles: ModularSubfileItem[] = [];
  const inputLines: string[] = [];

  sections.forEach((sec, idx) => {
    const numPrefix = String(idx + 1).padStart(2, '0');
    const slug = sec.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || `seccion-${numPrefix}`;

    const relWithoutExt = `${sectionsFolder}/${numPrefix}-${slug}`;
    const relWithExt = `${relWithoutExt}.tex`;

    subfiles.push({
      relative_path: relWithExt,
      content: sec.lines.join('\n').trim() + '\n'
    });
    inputLines.push(`\\input{${relWithoutExt}}`);
  });

  const frontMatter = headerLines.join('\n').trim() || '\\maketitle';
  const mainTex = `${preamble}\n${frontMatter}\n\n% --- Secciones Modulares del Proyecto ---\n${inputLines.join('\n')}\n\n\\end{document}\n`;

  return {
    mainTex,
    subfiles,
    bibContent: defaultBib
  };
}

export interface SurgicalProjectSavePayload {
  mainTexContent: string;
  updatedSubfiles: ModularSubfileItem[];
}

/**
 * Sincroniza quirúrgicamente el documento LaTeX ensamblado (editado en el modo Hoja Visual)
 * de vuelta hacia los archivos `\input{...}` / `\include{...}` originales de un proyecto existente,
 * preservando nombres de carpetas personalizados (`chapters/`, `secciones/`, `partes/`) y el
 * preámbulo/bibliografía de `main.tex`.
 */
export function syncAssembledLatexToExistingProject(
  assembledLatex: string,
  rawMainLatex: string,
  existingFilesMap: Record<string, string> = {}
): SurgicalProjectSavePayload {
  // 1. Detectar todos los \input{...} y \include{...} activos en el main.tex original
  const existingInputPaths: string[] = [];
  for (const line of rawMainLatex.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('%')) continue;
    const withoutComment = trimmed.replace(/(?<!\\)%.*$/, '').trim();
    const match = withoutComment.match(/^\\(?:input|include)\{([^}]+)\}/);
    if (match) {
      const rawTarget = match[1].trim().replace(/\\/g, '/').replace(/^\.\//, '');
      const withTex = rawTarget.toLowerCase().endsWith('.tex') ? rawTarget : `${rawTarget}.tex`;
      const exactKey =
        Object.keys(existingFilesMap).find((k) => k.toLowerCase() === withTex.toLowerCase()) ||
        withTex;
      existingInputPaths.push(exactKey);
    }
  }

  // Si el main.tex original no utiliza \input ni \include, guardar directamente sobre main.tex
  if (existingInputPaths.length === 0) {
    return {
      mainTexContent: assembledLatex,
      updatedSubfiles: []
    };
  }

  // 2. Actualizar \title{...} y \author{...} en rawMainLatex a partir de assembledLatex
  const meta = extractLatexMetadata(assembledLatex);
  let updatedMainTex = rawMainLatex;
  if (meta.title) {
    updatedMainTex = updatedMainTex.replace(
      /\\title\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/,
      `\\title{${meta.title}}`
    );
  }
  if (meta.author) {
    const latexAuthor = meta.author.includes(' · ')
      ? meta.author.split(' · ').join(' \\and ')
      : meta.author;
    updatedMainTex = updatedMainTex.replace(
      /\\author\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/,
      `\\author{${latexAuthor}}`
    );
  }

  // 3. Extraer el cuerpo de assembledLatex y dividir por secciones
  const beginDocIdx = assembledLatex.indexOf('\\begin{document}');
  const endDocIdx = assembledLatex.lastIndexOf('\\end{document}');
  const rawBody =
    beginDocIdx !== -1 && endDocIdx !== -1 && endDocIdx > beginDocIdx
      ? assembledLatex.slice(beginDocIdx + '\\begin{document}'.length, endDocIdx)
      : assembledLatex;

  const cleanBody = rawBody
    .replace(/^% === (BEGIN|END) (INPUT|INCLUDE): .* ===$/gm, '')
    .replace(/^\\maketitle\s*$/gm, '')
    .trim();

  const sections: Array<{ title: string; lines: string[] }> = [];
  const orphanHeaderLines: string[] = [];
  let currentSection: { title: string; lines: string[] } | null = null;

  for (const line of cleanBody.split('\n')) {
    const secMatch = line.trim().match(/^\\(?:section|chapter)\*?\{([^}]+)\}/);
    if (secMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: secMatch[1].trim(),
        lines: [line]
      };
    } else if (currentSection) {
      currentSection.lines.push(line);
    } else if (line.trim()) {
      orphanHeaderLines.push(line);
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  // Si había texto antes del primer \section, anteponerlo a la primera sección
  if (orphanHeaderLines.length > 0 && sections.length > 0) {
    sections[0].lines = [...orphanHeaderLines, '', ...sections[0].lines];
  } else if (sections.length === 0 && cleanBody) {
    sections.push({
      title: 'Contenido',
      lines: [cleanBody]
    });
  }

  // Determinar la carpeta base de secciones a partir del primer \input existente (ej. "chapters" o "secciones")
  const firstInput = existingInputPaths[0];
  const lastSlashIdx = firstInput.lastIndexOf('/');
  const preferredFolder = lastSlashIdx !== -1 ? firstInput.slice(0, lastSlashIdx) : 'secciones';

  const updatedSubfiles: ModularSubfileItem[] = [];
  const newInputDirectives: string[] = [];

  sections.forEach((sec, idx) => {
    if (idx < existingInputPaths.length) {
      // Mapear quirúrgicamente al archivo existente preservando su ruta y nombre exacto
      updatedSubfiles.push({
        relative_path: existingInputPaths[idx],
        content: sec.lines.join('\n').trim() + '\n'
      });
    } else {
      // Sección nueva añadida desde el modo Hoja Visual: crear en la misma carpeta del proyecto
      const numPrefix = String(idx + 1).padStart(2, '0');
      const slug =
        sec.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 32) || `seccion-${numPrefix}`;

      const relWithoutExt = preferredFolder
        ? `${preferredFolder}/${numPrefix}-${slug}`
        : `${numPrefix}-${slug}`;
      const relWithExt = `${relWithoutExt}.tex`;

      updatedSubfiles.push({
        relative_path: relWithExt,
        content: sec.lines.join('\n').trim() + '\n'
      });
      newInputDirectives.push(`\\input{${relWithoutExt}}`);
    }
  });

  // Si se añadieron nuevas secciones, insertar sus \input{...} antes de \end{document} (o bibliografía)
  if (newInputDirectives.length > 0) {
    const newInputsBlock = newInputDirectives.join('\n');
    const bibIdx = updatedMainTex.search(/\\(?:bibliography|printbibliography)\b/);
    const endIdx = updatedMainTex.lastIndexOf('\\end{document}');
    const insertPos = bibIdx !== -1 ? bibIdx : endIdx;

    if (insertPos !== -1) {
      updatedMainTex =
        updatedMainTex.slice(0, insertPos).trimEnd() +
        '\n' +
        newInputsBlock +
        '\n\n' +
        updatedMainTex.slice(insertPos);
    } else {
      updatedMainTex = `${updatedMainTex.trimEnd()}\n${newInputsBlock}\n`;
    }
  }

  return {
    mainTexContent: updatedMainTex,
    updatedSubfiles
  };
}
