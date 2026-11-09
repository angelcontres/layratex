import { save } from '@tauri-apps/plugin-dialog';
import { compilerService } from './compilerService';
import { latexToVisual } from '../visual/latexConverter';

export interface WordExportOptions {
  title?: string;
  author?: string;
  date?: string;
  fontStyle?: 'serif' | 'sans';
  isRawLatex?: boolean;
}

export interface WordExportResult {
  success: boolean;
  docxBase64: string;
  docxBlobUrl: string;
  savedPath: string | null;
  tempPath: string | null;
  durationMs: number;
}

// Tabla precalculada para CRC-32 estándar (IEEE 802.3) requerido por contenedores ZIP (.docx)
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function uint8ToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Empaqueta múltiples archivos XML en un contenedor ZIP estándar OpenXML (.docx) en memoria.
 */
export function buildZipArchive(files: { name: string; content: string | Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const entries = files.map(f => {
    const nameBytes = encoder.encode(f.name);
    const dataBytes = typeof f.content === 'string' ? encoder.encode(f.content) : f.content;
    const crc = crc32(dataBytes);
    return { nameBytes, dataBytes, crc, offset: 0 };
  });

  let localSize = 0;
  for (const e of entries) {
    e.offset = localSize;
    localSize += 30 + e.nameBytes.length + e.dataBytes.length;
  }

  let centralSize = 0;
  for (const e of entries) {
    centralSize += 46 + e.nameBytes.length;
  }

  const totalSize = localSize + centralSize + 22;
  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);
  let pos = 0;

  // 1. Local File Headers + Data
  for (const e of entries) {
    view.setUint32(pos, 0x04034b50, true); // Local file header signature
    view.setUint16(pos + 4, 20, true);     // Version needed to extract (2.0)
    view.setUint16(pos + 6, 0x0800, true); // UTF-8 filename flag
    view.setUint16(pos + 8, 0, true);      // Compression method: 0 (STORE)
    view.setUint16(pos + 10, 0, true);     // Last mod file time
    view.setUint16(pos + 12, 0x5421, true);// Last mod file date
    view.setUint32(pos + 14, e.crc, true); // CRC-32
    view.setUint32(pos + 18, e.dataBytes.length, true); // Compressed size
    view.setUint32(pos + 22, e.dataBytes.length, true); // Uncompressed size
    view.setUint16(pos + 26, e.nameBytes.length, true); // File name length
    view.setUint16(pos + 28, 0, true);     // Extra field length
    pos += 30;
    out.set(e.nameBytes, pos);
    pos += e.nameBytes.length;
    out.set(e.dataBytes, pos);
    pos += e.dataBytes.length;
  }

  const centralDirOffset = pos;

  // 2. Central Directory File Headers
  for (const e of entries) {
    view.setUint32(pos, 0x02014b50, true); // Central directory signature
    view.setUint16(pos + 4, 20, true);     // Version made by
    view.setUint16(pos + 6, 20, true);     // Version needed
    view.setUint16(pos + 8, 0x0800, true); // UTF-8 flag
    view.setUint16(pos + 10, 0, true);     // Compression method: STORE
    view.setUint16(pos + 12, 0, true);     // Mod time
    view.setUint16(pos + 14, 0x5421, true);// Mod date
    view.setUint32(pos + 16, e.crc, true); // CRC-32
    view.setUint32(pos + 20, e.dataBytes.length, true);
    view.setUint32(pos + 24, e.dataBytes.length, true);
    view.setUint16(pos + 28, e.nameBytes.length, true);
    view.setUint16(pos + 30, 0, true);     // Extra field length
    view.setUint16(pos + 32, 0, true);     // File comment length
    view.setUint16(pos + 34, 0, true);     // Disk number start
    view.setUint16(pos + 36, 0, true);     // Internal file attributes
    view.setUint32(pos + 38, 0, true);     // External file attributes
    view.setUint32(pos + 42, e.offset, true); // Relative offset of local header
    pos += 46;
    out.set(e.nameBytes, pos);
    pos += e.nameBytes.length;
  }

  // 3. End of Central Directory Record (EOCD)
  view.setUint32(pos, 0x06054b50, true);
  view.setUint16(pos + 4, 0, true);
  view.setUint16(pos + 6, 0, true);
  view.setUint16(pos + 8, entries.length, true);
  view.setUint16(pos + 10, entries.length, true);
  view.setUint32(pos + 12, centralSize, true);
  view.setUint32(pos + 16, centralDirOffset, true);
  view.setUint16(pos + 20, 0, true);

  return out;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Mapa de símbolos LaTeX a caracteres matemáticos Unicode para Office Math (OMML)
const LATEX_SYMBOLS: Record<string, string> = {
  '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ϵ',
  '\\varepsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\vartheta': 'ϑ',
  '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν',
  '\\xi': 'ξ', '\\pi': 'π', '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ',
  '\\upsilon': 'υ', '\\phi': 'ϕ', '\\varphi': 'φ', '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
  '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ', '\\Xi': 'Ξ',
  '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Upsilon': 'Υ', '\\Phi': 'Φ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
  '\\infty': '∞', '\\partial': '∂', '\\nabla': '∇', '\\pm': '±', '\\mp': '∓',
  '\\times': '×', '\\cdot': '⋅', '\\div': '÷', '\\neq': '≠', '\\ne': '≠',
  '\\leq': '≤', '\\le': '≤', '\\geq': '≥', '\\ge': '≥', '\\approx': '≈',
  '\\equiv': '≡', '\\propto': '∝', '\\sim': '∼', '\\simeq': '≃', '\\cong': '≅',
  '\\rightarrow': '→', '\\to': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
  '\\Rightarrow': '⇒', '\\implies': '⟹', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔', '\\iff': '⟺',
  '\\forall': '∀', '\\exists': '∃', '\\nexists': '∄', '\\in': '∈', '\\notin': '∉',
  '\\subset': '⊂', '\\subseteq': '⊆', '\\supset': '⊃', '\\supseteq': '⊇',
  '\\cup': '∪', '\\cap': '∩', '\\emptyset': '∅', '\\varnothing': '∅',
  '\\int': '∫', '\\iint': '∬', '\\iiint': '∭', '\\oint': '∮',
  '\\sum': '∑', '\\prod': '∏', '\\coprod': '∐',
  '\\ell': 'ℓ', '\\hbar': 'ℏ', '\\Re': 'ℜ', '\\Im': 'ℑ', '\\aleph': 'ℵ',
  '\\quad': '  ', '\\qquad': '    ', '\\,': ' ', '\\;': ' ', '\\!': '',
  '\\dots': '…', '\\ldots': '…', '\\cdots': '⋯', '\\vdots': '⋮', '\\ddots': '⋱',
  '\\circ': '∘', '\\bullet': '∙', '\\star': '⋆', '\\perp': '⊥', '\\parallel': '∥',
  '\\angle': '∠', '\\triangle': '△', '\\square': '◻', '\\blacksquare': '◼'
};

function readBracedArg(tex: string, startIdx: number): { content: string; nextIdx: number } | null {
  let i = startIdx;
  while (i < tex.length && /\s/.test(tex[i])) i++;
  if (i >= tex.length) return null;
  if (tex[i] !== '{') {
    if (tex[i] === '\\') {
      const m = tex.slice(i).match(/^\\[a-zA-Z]+/);
      if (m) return { content: m[0], nextIdx: i + m[0].length };
    }
    return { content: tex[i], nextIdx: i + 1 };
  }
  let depth = 0;
  let startContent = i + 1;
  for (; i < tex.length; i++) {
    if (tex[i] === '{' && (i === 0 || tex[i - 1] !== '\\')) depth++;
    else if (tex[i] === '}' && (i === 0 || tex[i - 1] !== '\\')) {
      depth--;
      if (depth === 0) {
        return { content: tex.slice(startContent, i), nextIdx: i + 1 };
      }
    }
  }
  return { content: tex.slice(startContent), nextIdx: tex.length };
}

/**
 * Convierte una expresión LaTeX matemática en nodos Office Math Markup Language (OMML <m:oMath>)
 * para que Microsoft Word, LibreOffice y Google Docs la reconozcan como ecuación nativa editable.
 */
export function latexMathToOmmlInner(rawTex: string): string {
  let tex = rawTex
    .replace(/\\begin\{(equation\*?|align\*?|gather\*?|multline\*?)\}/g, '')
    .replace(/\\end\{(equation\*?|align\*?|gather\*?|multline\*?)\}/g, '')
    .replace(/\\left\s*([()[\]|.])/g, '$1')
    .replace(/\\right\s*([()[\]|.])/g, '$1')
    .replace(/\\left\\\{/g, '{')
    .replace(/\\right\\\}/g, '}')
    .replace(/&=/g, '=')
    .replace(/\\\\/g, '   ')
    .trim();

  let out = '';
  let i = 0;

  const makeRun = (text: string, normalText = false): string => {
    if (!text) return '';
    const rPr = normalText ? '<m:rPr><m:nor/></m:rPr>' : '';
    return `<m:r>${rPr}<w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/></w:rPr><m:t>${escapeXml(text)}</m:t></m:r>`;
  };

  while (i < tex.length) {
    // 1. \frac{num}{den}
    if (tex.startsWith('\\frac', i) || tex.startsWith('\\dfrac', i) || tex.startsWith('\\tfrac', i)) {
      const cmdLen = tex.startsWith('\\frac', i) ? 5 : 6;
      const num = readBracedArg(tex, i + cmdLen);
      if (num) {
        const den = readBracedArg(tex, num.nextIdx);
        if (den) {
          out += `<m:f><m:num>${latexMathToOmmlInner(num.content)}</m:num><m:den>${latexMathToOmmlInner(den.content)}</m:den></m:f>`;
          i = den.nextIdx;
          continue;
        }
      }
    }

    // 2. \sqrt[n]{x} o \sqrt{x}
    if (tex.startsWith('\\sqrt', i)) {
      let nextPos = i + 5;
      while (nextPos < tex.length && /\s/.test(tex[nextPos])) nextPos++;
      let degXml = '<m:deg/>';
      let radPr = '<m:radPr><m:degHide m:val="1"/></m:radPr>';
      if (tex[nextPos] === '[') {
        const closeBracket = tex.indexOf(']', nextPos);
        if (closeBracket !== -1) {
          const degContent = tex.slice(nextPos + 1, closeBracket);
          degXml = `<m:deg>${latexMathToOmmlInner(degContent)}</m:deg>`;
          radPr = '<m:radPr><m:degHide m:val="0"/></m:radPr>';
          nextPos = closeBracket + 1;
        }
      }
      const arg = readBracedArg(tex, nextPos);
      if (arg) {
        out += `<m:rad>${radPr}${degXml}<m:e>${latexMathToOmmlInner(arg.content)}</m:e></m:rad>`;
        i = arg.nextIdx;
        continue;
      }
    }

    // 3. \text{...}, \mathrm{...}, \textbf{...}, \mathcal{...}
    const textCmdMatch = tex.slice(i).match(/^\\(text|mathrm|textbf|mathbf|mathcal)\b/);
    if (textCmdMatch) {
      const cmd = textCmdMatch[1];
      const arg = readBracedArg(tex, i + textCmdMatch[0].length);
      if (arg) {
        out += makeRun(arg.content, cmd === 'text' || cmd === 'mathrm');
        i = arg.nextIdx;
        continue;
      }
    }

    // 4. \vec{x}, \hat{x}, \bar{x}, \tilde{x}, \dot{x}
    const accMatch = tex.slice(i).match(/^\\(vec|hat|bar|overline|tilde|dot)\b/);
    if (accMatch) {
      const accType = accMatch[1];
      const accChar = accType === 'vec' ? '→' : accType === 'hat' ? '^' : accType === 'tilde' ? '~' : accType === 'dot' ? '˙' : '¯';
      const arg = readBracedArg(tex, i + accMatch[0].length);
      if (arg) {
        out += `<m:acc><m:accPr><m:chr m:val="${accChar}"/></m:accPr><m:e>${latexMathToOmmlInner(arg.content)}</m:e></m:acc>`;
        i = arg.nextIdx;
        continue;
      }
    }

    // 5. Otros comandos \alpha, \int, etc. + posible sub/superíndice
    if (tex[i] === '\\') {
      const cmdMatch = tex.slice(i).match(/^\\[a-zA-Z]+|^\\[,;!]/);
      if (cmdMatch) {
        const cmd = cmdMatch[0];
        const sym = LATEX_SYMBOLS[cmd] ?? cmd.slice(1);
        let nextIdx = i + cmd.length;
        while (nextIdx < tex.length && tex[nextIdx] === ' ') nextIdx++;

        // Verificar si tiene subíndice y/o superíndice adherido
        const subSup = parseSubSupAfterBase(tex, nextIdx, makeRun(sym));
        if (subSup) {
          out += subSup.xml;
          i = subSup.nextIdx;
        } else {
          out += makeRun(sym);
          i = nextIdx;
        }
        continue;
      }
    }

    // 6. Grupo entre llaves { ... }
    if (tex[i] === '{') {
      const group = readBracedArg(tex, i);
      if (group) {
        const baseXml = latexMathToOmmlInner(group.content);
        const subSup = parseSubSupAfterBase(tex, group.nextIdx, baseXml);
        if (subSup) {
          out += subSup.xml;
          i = subSup.nextIdx;
        } else {
          out += baseXml;
          i = group.nextIdx;
        }
        continue;
      }
    }

    // 7. Carácter individual seguido de _ o ^
    const ch = tex[i];
    if (ch !== '_' && ch !== '^' && !/\s/.test(ch)) {
      const subSup = parseSubSupAfterBase(tex, i + 1, makeRun(ch));
      if (subSup) {
        out += subSup.xml;
        i = subSup.nextIdx;
        continue;
      }
    }

    // 8. Carácter normal
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    out += makeRun(ch);
    i++;
  }

  return out || makeRun(rawTex);
}

function parseSubSupAfterBase(
  tex: string,
  startIdx: number,
  baseXml: string
): { xml: string; nextIdx: number } | null {
  let i = startIdx;
  while (i < tex.length && /\s/.test(tex[i])) i++;
  if (i >= tex.length || (tex[i] !== '_' && tex[i] !== '^')) return null;

  let subXml: string | null = null;
  let supXml: string | null = null;

  for (let pass = 0; pass < 2; pass++) {
    while (i < tex.length && /\s/.test(tex[i])) i++;
    if (i < tex.length && tex[i] === '_' && subXml === null) {
      const arg = readBracedArg(tex, i + 1);
      if (arg) {
        subXml = latexMathToOmmlInner(arg.content);
        i = arg.nextIdx;
      }
    } else if (i < tex.length && tex[i] === '^' && supXml === null) {
      const arg = readBracedArg(tex, i + 1);
      if (arg) {
        supXml = latexMathToOmmlInner(arg.content);
        i = arg.nextIdx;
      }
    } else {
      break;
    }
  }

  if (subXml !== null && supXml !== null) {
    return {
      xml: `<m:sSubSup><m:e>${baseXml}</m:e><m:sub>${subXml}</m:sub><m:sup>${supXml}</m:sup></m:sSubSup>`,
      nextIdx: i
    };
  }
  if (subXml !== null) {
    return {
      xml: `<m:sSub><m:e>${baseXml}</m:e><m:sub>${subXml}</m:sub></m:sSub>`,
      nextIdx: i
    };
  }
  if (supXml !== null) {
    return {
      xml: `<m:sSup><m:e>${baseXml}</m:e><m:sup>${supXml}</m:sup></m:sSup>`,
      nextIdx: i
    };
  }
  return null;
}

/**
 * Renderiza texto con formato inline (**negrita**, *cursiva*, `código`, y ecuaciones inline $...$)
 * como nodos XML de Word (<w:r> y <m:oMath>).
 */
function renderInlineRunsXml(text: string, defaultItalic = false, fontSizeHalfPt = 24): string {
  // Microtipografía TeX
  const cleanText = text
    .replace(/"([^"\n]+)"/g, '“$1”')
    .replace(/``([^'\n]+)''/g, '“$1”')
    .replace(/(\d+)\s*--\s*(\d+)/g, '$1–$2')
    .replace(/\s+---\s+/g, ' — ');

  // Tokenizar matemáticas inline $...$
  const parts = cleanText.split(/(\$[^\$\n]+\$)/g);
  let xml = '';

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const mathTex = part.slice(1, -1).trim();
      xml += `<m:oMath>${latexMathToOmmlInner(mathTex)}</m:oMath>`;
      continue;
    }

    // Procesar **negrita**, *cursiva* y `monoespaciado`
    const subTokens = part.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    for (const token of subTokens) {
      if (!token) continue;
      let isBold = false;
      let isItalic = defaultItalic;
      let isMono = false;
      let raw = token;

      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        isBold = true;
        raw = token.slice(2, -2);
      } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        isItalic = !defaultItalic; // En teoremas en cursiva, *texto* hace énfasis inverso (upright) como \emph en LaTeX
        raw = token.slice(1, -1);
      } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        isMono = true;
        raw = token.slice(1, -1);
      }

      const rPrParts: string[] = [];
      if (isMono) {
        rPrParts.push('<w:rFonts w:ascii="CMU Typewriter Text" w:hAnsi="CMU Typewriter Text" w:cs="Consolas"/>');
      }
      if (isBold) rPrParts.push('<w:b/><w:bCs/>');
      if (isItalic) rPrParts.push('<w:i/><w:iCs/>');
      if (fontSizeHalfPt !== 24) {
        rPrParts.push(`<w:sz w:val="${fontSizeHalfPt}"/><w:szCs w:val="${fontSizeHalfPt}"/>`);
      }

      const rPr = rPrParts.length > 0 ? `<w:rPr>${rPrParts.join('')}</w:rPr>` : '';
      xml += `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(raw)}</w:t></w:r>`;
    }
  }

  return xml;
}

/**
 * Construye el contenido binario (.docx) completo con estética editorial LaTeX.
 */
export function generateLatexStyledDocxBytes(
  sourceContent: string,
  options: WordExportOptions = {}
): Uint8Array {
  const isRaw = options.isRawLatex ?? (sourceContent.includes('\\begin{document}') || sourceContent.includes('\\documentclass'));
  let title = options.title || 'Documento Sin Título';
  let author = options.author || 'Autor';
  const dateStr = options.date || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const fontStyle = options.fontStyle || 'serif';

  if (isRaw) {
    const titleMatch = sourceContent.match(/\\title\{([^}]+)\}/);
    if (titleMatch) title = titleMatch[1];
    const authorMatch = sourceContent.match(/\\author\{([^}]+)\}/);
    if (authorMatch) author = authorMatch[1];
  }

  const visualText = isRaw ? latexToVisual(sourceContent) : sourceContent;
  const primaryFont = fontStyle === 'serif' ? 'CMU Serif' : 'CMU Sans Serif';
  const fallbackFont = fontStyle === 'serif' ? 'Times New Roman' : 'Calibri';

  // Parsear líneas en bloques estructurados con numeración LaTeX
  const lines = visualText.split('\n');
  let bodyXml = '';

  // 1. Bloque \maketitle canónico de LaTeX
  bodyXml += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
        <w:jc w:val="center"/>
        <w:spacing w:before="120" w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="80"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
        <w:t>${escapeXml(author)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="420"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
        <w:t>${escapeXml(dateStr)}</w:t>
      </w:r>
    </w:p>
  `;

  let h1Count = 0;
  let h2Count = 0;
  let h3Count = 0;
  let eqCount = 0;
  let tableCount = 0;
  let theoremCount = 0;
  let isFirstParaAfterHeading = true;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Bloque de ecuación $$ ... $$
    if (trimmed.startsWith('$$')) {
      let mathLines: string[] = [];
      if (trimmed.endsWith('$$') && trimmed.length > 2 && trimmed !== '$$') {
        mathLines.push(trimmed.slice(2, -2).trim());
        i++;
      } else {
        i++;
        while (i < lines.length && !lines[i].trim().endsWith('$$')) {
          mathLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          const last = lines[i].trim().replace(/\$\$\s*$/, '').trim();
          if (last) mathLines.push(last);
          i++;
        }
      }
      eqCount++;
      const mathContent = mathLines.join('\n').trim();
      const omml = latexMathToOmmlInner(mathContent);

      // Tabla sin bordes de 3 columnas (15% | 70% ecuación centrada | 15% número (1) a la derecha) estilo LaTeX
      bodyXml += `
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:jc w:val="center"/>
            <w:tblBorders>
              <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            </w:tblBorders>
          </w:tblPr>
          <w:tr>
            <w:tc>
              <w:tcPr><w:tcW w:w="600" w:type="pct"/><w:vAlign w:val="center"/></w:tcPr>
              <w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>
            </w:tc>
            <w:tc>
              <w:tcPr><w:tcW w:w="3800" w:type="pct"/><w:vAlign w:val="center"/></w:tcPr>
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:before="160" w:after="160"/></w:pPr>
                <m:oMathPara><m:oMath>${omml}</m:oMath></m:oMathPara>
              </w:p>
            </w:tc>
            <w:tc>
              <w:tcPr><w:tcW w:w="600" w:type="pct"/><w:vAlign w:val="center"/></w:tcPr>
              <w:p>
                <w:pPr><w:jc w:val="right"/><w:spacing w:before="160" w:after="160"/></w:pPr>
                <w:r><w:t>(${eqCount})</w:t></w:r>
              </w:p>
            </w:tc>
          </w:tr>
        </w:tbl>
      `;
      continue;
    }

    // Bloque de Tabla Markdown -> Tabla Booktabs LaTeX en Word
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const parseCells = (l: string) => l.split('|').slice(1, -1).map(c => c.trim());
      const headers = parseCells(tableLines[0]);
      const isDivider = tableLines.length > 1 && tableLines[1].replace(/[\s|:-]/g, '') === '';
      const rowStart = isDivider ? 2 : 1;
      const rows: string[][] = [];
      for (let r = rowStart; r < tableLines.length; r++) {
        const c = parseCells(tableLines[r]);
        if (c.length > 0 && !c.every(x => !x)) rows.push(c);
      }

      tableCount++;
      // Título superior "Cuadro N" estilo LaTeX
      bodyXml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="80"/></w:pPr>
          <w:r><w:rPr><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">Cuadro ${tableCount}: </w:t></w:r>
          <w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>Datos tabulados del documento</w:t></w:r>
        </w:p>
      `;

      // Tabla con bordes booktabs (\toprule sz=12, \midrule sz=6, \bottomrule sz=12, sin verticales)
      bodyXml += `
        <w:tbl>
          <w:tblPr>
            <w:jc w:val="center"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/>
              <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/>
              <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            </w:tblBorders>
            <w:tblCellMar>
              <w:top w:w="80" w:type="dxa"/>
              <w:left w:w="180" w:type="dxa"/>
              <w:bottom w:w="80" w:type="dxa"/>
              <w:right w:w="180" w:type="dxa"/>
            </w:tblCellMar>
          </w:tblPr>
          <w:tr>
            ${headers.map(h => `
              <w:tc>
                <w:tcPr>
                  <w:tcBorders>
                    <w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/>
                    <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
                  </w:tcBorders>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr>
                  ${renderInlineRunsXml(`**${h}**`, false, 21)}
                </w:p>
              </w:tc>
            `).join('')}
          </w:tr>
          ${rows.map((row, rIdx) => `
            <w:tr>
              ${headers.map((_, cIdx) => `
                <w:tc>
                  <w:tcPr>
                    ${rIdx === rows.length - 1 ? '<w:tcBorders><w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/></w:tcBorders>' : ''}
                  </w:tcPr>
                  <w:p>
                    <w:pPr><w:jc w:val="center"/><w:spacing w:before="50" w:after="50"/></w:pPr>
                    ${renderInlineRunsXml(row[cIdx] || '', false, 21)}
                  </w:p>
                </w:tc>
              `).join('')}
            </w:tr>
          `).join('')}
        </w:tbl>
        <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr></w:p>
      `;
      continue;
    }

    // Bloques de cita / Resumen / Teoremas / Demostraciones (> ...)
    if (line.startsWith('>')) {
      const quoteLines: string[] = [line.replace(/^>\s?/, '')];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const fullQuote = quoteLines.join(' ').trim();

      if (/^\*\*(Resumen|Abstract):?\*\*/i.test(fullQuote)) {
        const cleanAbs = fullQuote.replace(/^\*\*(?:Resumen|Abstract):?\*\*:?\s*/i, '').trim();
        bodyXml += `
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:before="200" w:after="60"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>Resumen</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:jc w:val="both"/>
              <w:ind w:left="720" w:right="720" w:firstLine="300"/>
              <w:spacing w:before="0" w:after="280" w:line="260" w:lineRule="auto"/>
            </w:pPr>
            ${renderInlineRunsXml(cleanAbs, false, 20)}
          </w:p>
        `;
      } else if (/^\*\*(Teorema|Definición|Lema|Corolario|Proposición)/i.test(fullQuote)) {
        const matchEnv = fullQuote.match(/^\*\*(Teorema|Definición|Lema|Corolario|Proposición)(?:\s+[^*:]+)?:?\*\*:?\s*([\s\S]*)/i);
        const envLabel = matchEnv ? matchEnv[1] : 'Teorema';
        const envBody = matchEnv ? matchEnv[2] : fullQuote;
        theoremCount++;
        const isItalicEnv = /teorema|lema|corolario|proposición/i.test(envLabel);
        bodyXml += `
          <w:p>
            <w:pPr>
              <w:jc w:val="both"/>
              <w:spacing w:before="200" w:after="200" w:line="280" w:lineRule="auto"/>
            </w:pPr>
            <w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(envLabel)} ${theoremCount}. </w:t></w:r>
            ${renderInlineRunsXml(envBody, isItalicEnv, 24)}
          </w:p>
        `;
      } else if (/^\*\*(Demostración|Prueba|Proof):?\*\*/i.test(fullQuote)) {
        const cleanProof = fullQuote.replace(/^\*\*(?:Demostración|Prueba|Proof):?\*\*:?\s*/i, '').trim();
        bodyXml += `
          <w:p>
            <w:pPr>
              <w:jc w:val="both"/>
              <w:spacing w:before="160" w:after="200" w:line="280" w:lineRule="auto"/>
            </w:pPr>
            <w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">Demostración. </w:t></w:r>
            ${renderInlineRunsXml(cleanProof, false, 24)}
            <w:r><w:t xml:space="preserve">   ◻</w:t></w:r>
          </w:p>
        `;
      } else {
        bodyXml += `
          <w:p>
            <w:pPr>
              <w:jc w:val="both"/>
              <w:ind w:left="560" w:right="560"/>
              <w:spacing w:before="160" w:after="160" w:line="276" w:lineRule="auto"/>
            </w:pPr>
            ${renderInlineRunsXml(fullQuote, true, 22)}
          </w:p>
        `;
      }
      continue;
    }

    // Encabezados # H1, ## H2, ### H3 con numeración LaTeX
    if (line.startsWith('# ')) {
      h1Count++;
      h2Count = 0;
      h3Count = 0;
      isFirstParaAfterHeading = true;
      const rawTitle = line.substring(2).trim().replace(/^\d+(?:\.\d+)*\.?\s+/, '');
      bodyXml += `
        <w:p>
          <w:pPr>
            <w:pStyle w:val="Heading1"/>
            <w:keepNext/>
            <w:spacing w:before="360" w:after="160"/>
          </w:pPr>
          <w:r><w:rPr><w:b/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr><w:t xml:space="preserve">${h1Count}   </w:t></w:r>
          ${renderInlineRunsXml(`**${rawTitle}**`, false, 30)}
        </w:p>
      `;
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      h2Count++;
      h3Count = 0;
      isFirstParaAfterHeading = true;
      const prefix = h1Count > 0 ? `${h1Count}.${h2Count}` : `1.${h2Count}`;
      const rawTitle = line.substring(3).trim().replace(/^\d+(?:\.\d+)*\.?\s+/, '');
      bodyXml += `
        <w:p>
          <w:pPr>
            <w:pStyle w:val="Heading2"/>
            <w:keepNext/>
            <w:spacing w:before="280" w:after="120"/>
          </w:pPr>
          <w:r><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t xml:space="preserve">${prefix}   </w:t></w:r>
          ${renderInlineRunsXml(`**${rawTitle}**`, false, 26)}
        </w:p>
      `;
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      h3Count++;
      isFirstParaAfterHeading = true;
      const p1 = h1Count > 0 ? h1Count : 1;
      const p2 = h2Count > 0 ? h2Count : 1;
      const prefix = `${p1}.${p2}.${h3Count}`;
      const rawTitle = line.substring(4).trim().replace(/^\d+(?:\.\d+)*\.?\s+/, '');
      bodyXml += `
        <w:p>
          <w:pPr>
            <w:pStyle w:val="Heading3"/>
            <w:keepNext/>
            <w:spacing w:before="220" w:after="80"/>
          </w:pPr>
          <w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${prefix}   </w:t></w:r>
          ${renderInlineRunsXml(`**${rawTitle}**`, false, 24)}
        </w:p>
      `;
      i++;
      continue;
    }

    // Salto de página (---)
    if (trimmed === '---' || trimmed === '***') {
      bodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
      isFirstParaAfterHeading = true;
      i++;
      continue;
    }

    // Listas con viñetas (* o -)
    if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('+ ')) {
      const itemText = line.substring(2).trim();
      bodyXml += `
        <w:p>
          <w:pPr>
            <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            <w:jc w:val="both"/>
            <w:spacing w:before="40" w:after="40" w:line="276" w:lineRule="auto"/>
          </w:pPr>
          ${renderInlineRunsXml(itemText, false, 24)}
        </w:p>
      `;
      i++;
      continue;
    }

    // Listas numeradas (1. ...)
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      bodyXml += `
        <w:p>
          <w:pPr>
            <w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr>
            <w:jc w:val="both"/>
            <w:spacing w:before="40" w:after="40" w:line="276" w:lineRule="auto"/>
          </w:pPr>
          ${renderInlineRunsXml(orderedMatch[2].trim(), false, 24)}
        </w:p>
      `;
      i++;
      continue;
    }

    // Párrafo normal con sangría canónica de LaTeX (\noindent en el primero, 1.5em = 360 twips en los siguientes)
    const indentAttr = isFirstParaAfterHeading ? '0' : '360';
    isFirstParaAfterHeading = false;

    bodyXml += `
      <w:p>
        <w:pPr>
          <w:jc w:val="both"/>
          <w:ind w:firstLine="${indentAttr}"/>
          <w:spacing w:before="0" w:after="60" w:line="288" w:lineRule="auto"/>
        </w:pPr>
        ${renderInlineRunsXml(trimmed, false, 24)}
      </w:p>
    `;
    i++;
  }

  // Configuración de página A4 canónica de LaTeX (210x297mm, márgenes 2.5cm arriba/abajo y 3cm izq/der)
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:footerReference w:type="default" r:id="rIdFooter1"/>
      <w:pgSz w:w="11906" w:h="16838" w:orient="portrait"/>
      <w:pgMar w:top="1418" w:right="1701" w:bottom="1418" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="${primaryFont}" w:hAnsi="${primaryFont}" w:cs="${fallbackFont}" w:eastAsia="${fallbackFont}"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="es-ES" w:eastAsia="es-ES" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="60" w:line="288" w:lineRule="auto"/>
        <w:jc w:val="both"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="160"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="360" w:after="160"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="280" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="220" w:after="80"/><w:outlineLvl w:val="2"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
</w:styles>`;

  const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="•"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

  const footer1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr><w:jc w:val="center"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
    <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>1</w:t></w:r>
    <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
  </w:p>
</w:ftr>`;

  const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
  <w:zoom w:percent="100"/>
  <w:autoHyphenation w:val="true"/>
  <m:mathPr>
    <m:mathFont m:val="Cambria Math"/>
    <m:brkBin m:val="before"/>
    <m:brkBinSub m:val="--"/>
    <m:smallFrac m:val="0"/>
    <m:dispDef/>
    <m:lMargin m:val="0"/>
    <m:rMargin m:val="0"/>
    <m:defJc m:val="centerGroup"/>
    <m:wrapIndent m:val="1440"/>
    <m:intLim m:val="subSup"/>
    <m:naryLim m:val="undOvr"/>
  </m:mathPr>
</w:settings>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`;

  const isoNow = new Date().toISOString();
  const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:dcterms="http://purl.org/dc/terms/"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>${escapeXml(author)}</dc:creator>
  <cp:lastModifiedBy>Layratex Editorial Engine</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${isoNow}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${isoNow}</dcterms:modified>
</cp:coreProperties>`;

  const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Layratex — Hybrid LaTeX Editor</Application>
  <AppVersion>0.3.0</AppVersion>
</Properties>`;

  return buildZipArchive([
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: rootRelsXml },
    { name: 'docProps/core.xml', content: coreXml },
    { name: 'docProps/app.xml', content: appXml },
    { name: 'word/_rels/document.xml.rels', content: docRelsXml },
    { name: 'word/document.xml', content: documentXml },
    { name: 'word/styles.xml', content: stylesXml },
    { name: 'word/numbering.xml', content: numberingXml },
    { name: 'word/settings.xml', content: settingsXml },
    { name: 'word/footer1.xml', content: footer1Xml }
  ]);
}

export const wordExportService = {
  /**
   * Exporta el documento actual a un archivo Microsoft Word (.docx) nativo con estética LaTeX.
   */
  async exportToDocx(
    sourceContent: string,
    suggestedName: string = 'documento.docx',
    options: WordExportOptions = {}
  ): Promise<WordExportResult> {
    const startTime = performance.now();
    const cleanSuggestedName = suggestedName.toLowerCase().endsWith('.docx')
      ? suggestedName
      : `${suggestedName.replace(/\.(tex|pdf)$/i, '')}.docx`;

    const bytes = generateLatexStyledDocxBytes(sourceContent, options);
    const docxBase64 = uint8ToBase64(bytes);

    let docxBlobUrl = '';
    if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      docxBlobUrl = URL.createObjectURL(blob);
    }

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));

    let tempPath: string | null = null;
    try {
      tempPath = await compilerService.createTempDocxFromBytes(docxBase64, cleanSuggestedName);
    } catch (e) {
      console.warn('No se pudo crear archivo Word temporal en Tauri:', e);
    }

    let savedPath: string | null = null;
    if (compilerService.isNative()) {
      try {
        const target = await save({
          filters: [
            { name: 'Documento de Microsoft Word (*.docx)', extensions: ['docx'] },
            { name: 'Todos los archivos (*.*)', extensions: ['*'] }
          ],
          defaultPath: cleanSuggestedName
        });

        if (target) {
          savedPath = await compilerService.saveDocxBytes(docxBase64, target);
        }
      } catch (err) {
        console.warn('Cancelado o error en guardado nativo de Word:', err);
      }
    } else if (typeof document !== 'undefined') {
      compilerService.downloadDocxFromBase64(docxBase64, cleanSuggestedName);
      savedPath = cleanSuggestedName;
    }

    return {
      success: true,
      docxBase64,
      docxBlobUrl,
      savedPath,
      tempPath,
      durationMs
    };
  }
};
