<script lang="ts">
  import katex from 'katex';
  import { 
    Calculator, 
    ChevronLeft,
    ChevronRight,
    X
  } from '@lucide/svelte';
  import MathBuilderModal from './MathBuilderModal.svelte';
  import TableBuilderModal from './TableBuilderModal.svelte';
  import SlashMenu from './SlashMenu.svelte';
  import FloatingToolbar from './FloatingToolbar.svelte';

  type PaperTone = 'dark' | 'cream' | 'sepia' | 'white';

  let {
    content = $bindable(''),
    title = $bindable('Documento Sin Título'),
    author = $bindable('Autor'),
    fontStyle = $bindable<'serif' | 'sans'>('serif'),
    paperTone = $bindable<PaperTone>('white'),
    showCropMarks = $bindable(true),
    onStatsChange = (stats: { words: number; pages: number }) => {}
  }: {
    content?: string;
    title?: string;
    author?: string;
    fontStyle?: 'serif' | 'sans';
    paperTone?: PaperTone;
    showCropMarks?: boolean;
    onStatsChange?: (stats: { words: number; pages: number }) => void;
  } = $props();

  let activeTextareaRef = $state<HTMLTextAreaElement | null>(null);
  let titleTextareaRef = $state<HTMLTextAreaElement | null>(null);
  let activeBlockId = $state<string | null>(null);
  let blockDraftText = $state<string>('');
  let showMathModal = $state(false);
  let showTableModal = $state(false);
  let activeMathTex = $state('');

  export function openFind() {
    showFindBar = true;
    showReplace = false;
    findMatches();
    setTimeout(() => {
      const input = document.querySelector('.paper-find-input') as HTMLInputElement | null;
      input?.focus();
      input?.select();
    }, 10);
  }

  export function openReplacePanel() {
    showFindBar = true;
    showReplace = true;
    findMatches();
    setTimeout(() => {
      const input = document.querySelector('.paper-find-input') as HTMLInputElement | null;
      input?.focus();
      input?.select();
    }, 10);
  }

  // Menú Slash Flotante anclado a la posición del cursor
  let showSlashMenu = $state(false);
  let slashFilter = $state('');
  let slashMenuRef = $state<any>(null);
  let slashMenuX = $state<number | null>(null);
  let slashMenuY = $state<number | null>(null);

  // Floating Toolbar sobre texto seleccionado
  let showToolbar = $state(false);
  let toolbarX = $state(0);
  let toolbarY = $state(0);

  // Buscador global reutilizable (Ctrl+F / Ctrl+H)
  let showFindBar = $state(false);
  let findQuery = $state('');
  let replaceQuery = $state('');
  let showReplace = $state(false);
  let matchCase = $state(false);
  let matches: number[] = $state([]);
  let currentMatchIndex = $state(0);

  let currentMatchLine = $derived.by(() => {
    if (matches.length === 0 || !content) return 0;
    const startPos = matches[currentMatchIndex] ?? 0;
    return content.substring(0, startPos).split('\n').length;
  });

  function closeFindBar() {
    showFindBar = false;
    showReplace = false;
    matches = [];
    currentMatchIndex = 0;
  }

  function findMatches() {
    const text = content || '';
    if (!text || !findQuery) {
      matches = [];
      currentMatchIndex = 0;
      return;
    }
    const query = findQuery;
    const results: number[] = [];
    if (matchCase) {
      let idx = text.indexOf(query);
      while (idx !== -1) {
        results.push(idx);
        idx = text.indexOf(query, idx + 1);
      }
    } else {
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      let idx = lowerText.indexOf(lowerQuery);
      while (idx !== -1) {
        results.push(idx);
        idx = lowerText.indexOf(lowerQuery, idx + 1);
      }
    }
    matches = results;
    if (results.length > 0) {
      if (currentMatchIndex >= results.length) {
        currentMatchIndex = 0;
      }
      scrollToCurrentMatch();
    } else {
      currentMatchIndex = 0;
    }
  }

  function scrollToCurrentMatch() {
    if (matches.length === 0 || !content) return;
    const startPos = matches[currentMatchIndex];
    const before = content.substring(0, startPos);
    const lineIndex = before.split('\n').length - 1;
    const targetBlock = liveBlocks.find(b => b.lineStart <= lineIndex && b.lineEnd > lineIndex);
    if (targetBlock) {
      const el = document.getElementById(targetBlock.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function nextMatch() {
    if (matches.length === 0) {
      findMatches();
      return;
    }
    currentMatchIndex = (currentMatchIndex + 1) % matches.length;
    scrollToCurrentMatch();
    const input = document.querySelector('.paper-find-input') as HTMLInputElement | null;
    input?.focus();
  }

  function prevMatch() {
    if (matches.length === 0) {
      findMatches();
      return;
    }
    currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    scrollToCurrentMatch();
    const input = document.querySelector('.paper-find-input') as HTMLInputElement | null;
    input?.focus();
  }

  function replaceCurrent() {
    if (matches.length === 0 || !findQuery) return;
    const startPos = matches[currentMatchIndex];
    const len = findQuery.length;
    const text = content || '';
    const newText = text.substring(0, startPos) + replaceQuery + text.substring(startPos + len);
    content = newText;
    if (activeBlockId !== null) {
      const curBlock = liveBlocks.find(b => b.id === activeBlockId);
      if (curBlock) blockDraftText = curBlock.rawText;
    }
    findMatches();
  }

  function replaceAll() {
    if (!findQuery) return;
    let text = content || '';
    if (!matchCase) {
      const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      text = text.replace(regex, replaceQuery);
    } else {
      const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      text = text.replace(regex, replaceQuery);
    }
    content = text;
    if (activeBlockId !== null) {
      const curBlock = liveBlocks.find(b => b.id === activeBlockId);
      if (curBlock) blockDraftText = curBlock.rawText;
    }
    findMatches();
  }

  const toneThemes: Record<PaperTone, {
    name: string;
    deskClass: string;
    sheetClass: string;
    textClass: string;
    titleClass: string;
    mutedClass: string;
    borderClass: string;
    ruleClass: string;
    cropClass: string;
    calloutClass: string;
    hoverMathClass: string;
  }> = {
    white: {
      name: 'Papel LaTeX Clásico',
      deskClass: 'bg-[#181c24] text-black',
      sheetClass: 'bg-[#ffffff] text-[#000000] border border-slate-300 shadow-[0_14px_48px_rgba(0,0,0,0.45)]',
      textClass: 'text-[#0a0a0a]',
      titleClass: 'text-[#000000] placeholder:text-slate-300',
      mutedClass: 'text-[#333333]',
      borderClass: 'border-black/20',
      ruleClass: 'border-black',
      cropClass: 'border-black/25',
      calloutClass: 'bg-slate-50 border-black/40 text-black',
      hoverMathClass: 'hover:bg-slate-100/70'
    },
    cream: {
      name: 'Marfil Editorial TeX',
      deskClass: 'bg-[#1c1916] text-[#1a1714]',
      sheetClass: 'bg-[#fcf9f2] text-[#14110e] border border-[#dcd2be] shadow-[0_14px_44px_rgba(0,0,0,0.45)]',
      textClass: 'text-[#181512]',
      titleClass: 'text-[#0f0d0a] placeholder:text-[#a89d8f]',
      mutedClass: 'text-[#4a4238]',
      borderClass: 'border-[#d4c8b4]',
      ruleClass: 'border-[#181512]',
      cropClass: 'border-[#b5a790]',
      calloutClass: 'bg-[#f4efe2] border-[#6e5a3e] text-[#241f19]',
      hoverMathClass: 'hover:bg-[#f2ecdf]'
    },
    sepia: {
      name: 'Sepia Pergamino',
      deskClass: 'bg-[#1b1713] text-[#221a12]',
      sheetClass: 'bg-[#f5ecda] text-[#221a12] border border-[#d6c4a6] shadow-[0_14px_44px_rgba(0,0,0,0.5)]',
      textClass: 'text-[#261d14]',
      titleClass: 'text-[#17110b] placeholder:text-[#a6957c]',
      mutedClass: 'text-[#594a39]',
      borderClass: 'border-[#cfbda0]',
      ruleClass: 'border-[#261d14]',
      cropClass: 'border-[#aa9678]',
      calloutClass: 'bg-[#ece0c7] border-[#785c38] text-[#2d2319]',
      hoverMathClass: 'hover:bg-[#ece0c7]'
    },
    dark: {
      name: 'Noche / Grafito',
      deskClass: 'bg-[#090b10] text-[#e6edf3]',
      sheetClass: 'bg-[#141821] text-[#e6edf3] border border-white/10 shadow-[0_14px_48px_rgba(0,0,0,0.75)]',
      textClass: 'text-[#e2e8f0]',
      titleClass: 'text-white placeholder:text-slate-600',
      mutedClass: 'text-slate-400',
      borderClass: 'border-white/15',
      ruleClass: 'border-slate-200',
      cropClass: 'border-white/20',
      calloutClass: 'bg-white/[0.04] border-slate-400 text-slate-200',
      hoverMathClass: 'hover:bg-white/5'
    }
  };

  let activeTheme = $derived(toneThemes[paperTone as PaperTone] || toneThemes.white);

  interface LiveBlock {
    id: string;
    type: 'h1' | 'h2' | 'h3' | 'math' | 'callout' | 'list' | 'table' | 'figure' | 'divider' | 'empty' | 'p';
    rawText: string;
    content: string;
    lineStart: number;
    lineEnd: number;
    isOrdered?: boolean;
    listNumber?: number;
    tableData?: { headers: string[]; rows: string[][] };
    figureData?: { caption: string; url: string };
  }

  function parseRow(line: string): string[] {
    return line.split('|').slice(1, -1).map(c => c.trim());
  }

  function parseDocumentToLiveBlocks(text: string): LiveBlock[] {
    if (!text) {
      return [{
        id: 'block-0',
        type: 'empty',
        rawText: '',
        content: '',
        lineStart: 0,
        lineEnd: 1
      }];
    }

    const lines = text.split('\n');
    const result: LiveBlock[] = [];
    let i = 0;
    let orderedCounter = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Resetear contador de listas ordenadas si no estamos en una lista ordenada
      if (!/^\d+\.\s+/.test(line)) {
        orderedCounter = 0;
      }

      // 1. Bloque de Ecuación Matemática $$ ... $$
      if (trimmed.startsWith('$$')) {
        const startLine = i;
        let rawLines = [line];
        if (trimmed.endsWith('$$') && trimmed.length > 2 && trimmed !== '$$') {
          const mathContent = trimmed.slice(2, -2).trim();
          result.push({
            id: `block-${result.length}`,
            type: 'math',
            rawText: rawLines.join('\n'),
            content: mathContent,
            lineStart: startLine,
            lineEnd: i + 1
          });
          i++;
          continue;
        }
        i++;
        while (i < lines.length) {
          rawLines.push(lines[i]);
          if (lines[i].trim().endsWith('$$')) {
            i++;
            break;
          }
          i++;
        }
        const rawText = rawLines.join('\n');
        const mathContent = rawLines
          .join('\n')
          .replace(/^\s*\$\$/, '')
          .replace(/\$\$\s*$/, '')
          .trim();

        result.push({
          id: `block-${result.length}`,
          type: 'math',
          rawText,
          content: mathContent,
          lineStart: startLine,
          lineEnd: i
        });
        continue;
      }

      // 2. Bloque de Tabla Markdown (| Col | Col |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const startLine = i;
        const tableLines = [line];
        i++;
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        const rawText = tableLines.join('\n');
        const headers = parseRow(tableLines[0]);
        const isDivider = tableLines.length > 1 && tableLines[1].replace(/[\s|:-]/g, '') === '';
        const rowStart = isDivider ? 2 : 1;
        const rows: string[][] = [];
        for (let r = rowStart; r < tableLines.length; r++) {
          const rowCells = parseRow(tableLines[r]);
          if (rowCells.length > 0 && !rowCells.every(c => !c)) {
            rows.push(rowCells);
          }
        }
        result.push({
          id: `block-${result.length}`,
          type: 'table',
          rawText,
          content: rawText,
          tableData: { headers, rows },
          lineStart: startLine,
          lineEnd: i
        });
        continue;
      }

      // 2b. Bloque de Figura / Imagen ![caption](url)
      const figMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (figMatch) {
        result.push({
          id: `block-${result.length}`,
          type: 'figure',
          rawText: line,
          content: figMatch[1] || 'Figura del documento',
          figureData: { caption: figMatch[1] || 'Figura del documento', url: figMatch[2] },
          lineStart: i,
          lineEnd: i + 1
        });
        i++;
        continue;
      }

      // 3. Bloque de Cita / Resumen / Teorema / Demostración (> ...)
      if (line.startsWith('>')) {
        const startLine = i;
        const quoteLines = [line];
        i++;
        while (i < lines.length && lines[i].startsWith('>')) {
          quoteLines.push(lines[i]);
          i++;
        }
        const rawText = quoteLines.join('\n');
        const content = quoteLines.map(l => l.replace(/^>\s?/, '')).join('\n');
        result.push({
          id: `block-${result.length}`,
          type: 'callout',
          rawText,
          content,
          lineStart: startLine,
          lineEnd: i
        });
        continue;
      }

      // 4. Encabezados
      if (line.startsWith('# ')) {
        result.push({
          id: `block-${result.length}`,
          type: 'h1',
          rawText: line,
          content: line.substring(2).trim(),
          lineStart: i,
          lineEnd: i + 1
        });
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        result.push({
          id: `block-${result.length}`,
          type: 'h2',
          rawText: line,
          content: line.substring(3).trim(),
          lineStart: i,
          lineEnd: i + 1
        });
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        result.push({
          id: `block-${result.length}`,
          type: 'h3',
          rawText: line,
          content: line.substring(4).trim(),
          lineStart: i,
          lineEnd: i + 1
        });
        i++;
        continue;
      }

      // 5. Separador / Salto de página
      if (trimmed === '---' || trimmed === '***') {
        result.push({
          id: `block-${result.length}`,
          type: 'divider',
          rawText: line,
          content: '',
          lineStart: i,
          lineEnd: i + 1
        });
        i++;
        continue;
      }

      // 6. Listas
      if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('+ ')) {
        result.push({
          id: `block-${result.length}`,
          type: 'list',
          rawText: line,
          content: line.substring(2).trim(),
          isOrdered: false,
          lineStart: i,
          lineEnd: i + 1
        });
        i++;
        continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        orderedCounter++;
        const match = line.match(/^(\d+)\.\s+(.*)/);
        result.push({
          id: `block-${result.length}`,
          type: 'list',
          rawText: line,
          content: match ? match[2] : line,
          isOrdered: true,
          listNumber: orderedCounter,
          lineStart: i,
          lineEnd: i + 1
        });
        i++;
        continue;
      }

      // 7. Línea vacía
      if (!trimmed) {
        result.push({
          id: `block-${result.length}`,
          type: 'empty',
          rawText: line,
          content: '',
          lineStart: i,
          lineEnd: i + 1
        });
        i++;
        continue;
      }

      // 8. Párrafo común
      result.push({
        id: `block-${result.length}`,
        type: 'p',
        rawText: line,
        content: line.trim(),
        lineStart: i,
        lineEnd: i + 1
      });
      i++;
    }

    return result;
  }

  let liveBlocks = $derived.by(() => parseDocumentToLiveBlocks(content));

  interface BlockNumberInfo {
    secNumber?: string;
    eqNumber?: number;
    tableNumber?: number;
    figNumber?: number;
    thmNumber?: number;
  }

  // Numeración canónica LaTeX para secciones (\section, \subsection, \subsubsection), ecuaciones, tablas, figuras y teoremas
  let blockNumberMap = $derived.by(() => {
    const map = new Map<string, BlockNumberInfo>();
    let h1Count = 0;
    let h2Count = 0;
    let h3Count = 0;
    let eqCount = 0;
    let tableCount = 0;
    let figCount = 0;
    let thmCount = 0;

    for (const b of liveBlocks) {
      if (b.type === 'h1') {
        h1Count++;
        h2Count = 0;
        h3Count = 0;
        map.set(b.id, { secNumber: `${h1Count}` });
      } else if (b.type === 'h2') {
        h2Count++;
        h3Count = 0;
        const prefix = h1Count > 0 ? `${h1Count}` : '1';
        map.set(b.id, { secNumber: `${prefix}.${h2Count}` });
      } else if (b.type === 'h3') {
        h3Count++;
        const prefix1 = h1Count > 0 ? `${h1Count}` : '1';
        const prefix2 = h2Count > 0 ? `${h2Count}` : '1';
        map.set(b.id, { secNumber: `${prefix1}.${prefix2}.${h3Count}` });
      } else if (b.type === 'math') {
        eqCount++;
        map.set(b.id, { eqNumber: eqCount });
      } else if (b.type === 'table') {
        tableCount++;
        map.set(b.id, { tableNumber: tableCount });
      } else if (b.type === 'figure') {
        figCount++;
        map.set(b.id, { figNumber: figCount });
      } else if (b.type === 'callout') {
        if (/^\*\*(Teorema|Theorem|Definición|Definicion|Definition|Lema|Lemma|Corolario|Proposición)/i.test(b.content.trim())) {
          thmCount++;
          map.set(b.id, { thmNumber: thmCount });
        }
      }
    }
    return map;
  });

  // Regla tipográfica canónica de LaTeX (\noindent en el primer párrafo tras un encabezado o entorno)
  function isFirstParagraph(blockId: string): boolean {
    const idx = liveBlocks.findIndex(b => b.id === blockId);
    if (idx <= 0) return true;
    for (let i = idx - 1; i >= 0; i--) {
      const prev = liveBlocks[i];
      if (prev.type === 'empty') continue;
      if (prev.type === 'h1' || prev.type === 'h2' || prev.type === 'h3' || prev.type === 'divider') {
        return true;
      }
      return false;
    }
    return true;
  }

  function getHeadingDisplay(b: LiveBlock): { number?: string; title: string } {
    const info = blockNumberMap.get(b.id);
    const rawContent = b.content.trim();
    const existingNumMatch = rawContent.match(/^(\d+(?:\.\d+)*\.?)\s+(.*)/);
    if (existingNumMatch) {
      return {
        number: existingNumMatch[1].replace(/\.$/, ''),
        title: existingNumMatch[2]
      };
    }
    return {
      number: info?.secNumber,
      title: rawContent
    };
  }

  function parseCalloutEnv(b: LiveBlock): {
    kind: 'abstract' | 'theorem' | 'definition' | 'proof' | 'quote';
    label: string;
    body: string;
  } {
    const raw = b.content.trim();
    if (/^\*\*(Resumen|Abstract):?\*\*/i.test(raw)) {
      return {
        kind: 'abstract',
        label: 'Resumen',
        body: raw.replace(/^\*\*(?:Resumen|Abstract):?\*\*:?\s*/i, '').trim()
      };
    }
    const thmMatch = raw.match(/^\*\*(Teorema|Theorem|Lema|Lemma|Corolario|Proposición):?\*\*:?\s*([\s\S]*)/i);
    if (thmMatch) {
      const num = blockNumberMap.get(b.id)?.thmNumber ?? 1;
      const baseLabel = /lema|lemma/i.test(thmMatch[1]) ? 'Lema' : /corolario/i.test(thmMatch[1]) ? 'Corolario' : /proposici/i.test(thmMatch[1]) ? 'Proposición' : 'Teorema';
      return {
        kind: 'theorem',
        label: `${baseLabel} ${num}.`,
        body: thmMatch[2].trim()
      };
    }
    const defMatch = raw.match(/^\*\*(Definición|Definicion|Definition):?\*\*:?\s*([\s\S]*)/i);
    if (defMatch) {
      const num = blockNumberMap.get(b.id)?.thmNumber ?? 1;
      return {
        kind: 'definition',
        label: `Definición ${num}.`,
        body: defMatch[2].trim()
      };
    }
    const proofMatch = raw.match(/^\*\*(Demostración|Demostracion|Prueba|Proof):?\*\*:?\s*([\s\S]*)/i);
    if (proofMatch) {
      return {
        kind: 'proof',
        label: 'Demostración.',
        body: proofMatch[2].trim()
      };
    }
    return {
      kind: 'quote',
      label: '',
      body: raw
    };
  }

  // Estimación de altura en píxeles de cada bloque para paginación A4 precisa
  function estimateBlockHeight(b: LiveBlock): number {
    if (b.type === 'h1') return 64;
    if (b.type === 'h2') return 52;
    if (b.type === 'h3') return 44;
    if (b.type === 'divider') return 0;
    if (b.type === 'empty') return 14;
    if (b.type === 'list') {
      const lines = Math.max(1, Math.ceil((b.content || '').length / 72));
      return lines * 26 + 4;
    }
    if (b.type === 'math') {
      const lineCount = (b.content || '').split('\n').length;
      return Math.max(82, 54 + lineCount * 24);
    }
    if (b.type === 'table') {
      const rows = b.tableData?.rows.length ?? 2;
      return 64 + rows * 32 + 20;
    }
    if (b.type === 'figure') {
      return 120;
    }
    if (b.type === 'callout') {
      const lines = Math.max(1, Math.ceil((b.content || '').length / 68));
      return 34 + lines * 25;
    }
    const textLen = (b.content || '').length;
    const lines = Math.max(1, Math.ceil(textLen / 74));
    return lines * 26 + 6;
  }

  interface SheetPage {
    pageNumber: number;
    blocks: LiveBlock[];
  }

  let pages = $derived.by(() => {
    const result: SheetPage[] = [];
    let currentPageBlocks: LiveBlock[] = [];
    let currentHeight = 0;
    let pageNum = 1;

    for (const b of liveBlocks) {
      if (b.type === 'divider') {
        currentPageBlocks.push(b);
        result.push({ pageNumber: pageNum++, blocks: currentPageBlocks });
        currentPageBlocks = [];
        currentHeight = 0;
        continue;
      }

      const h = estimateBlockHeight(b);
      const maxPageHeight = pageNum === 1 ? 740 : 880;
      const isHeading = b.type === 'h1' || b.type === 'h2' || b.type === 'h3';
      const effectiveHeight = isHeading ? h + 60 : h;

      if (currentHeight + effectiveHeight > maxPageHeight && currentPageBlocks.length > 0) {
        result.push({ pageNumber: pageNum++, blocks: currentPageBlocks });
        currentPageBlocks = [b];
        currentHeight = h;
      } else {
        currentPageBlocks.push(b);
        currentHeight += h;
      }
    }

    if (currentPageBlocks.length > 0 || result.length === 0) {
      result.push({ pageNumber: pageNum, blocks: currentPageBlocks });
    }
    return result;
  });

  // Métricas
  $effect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    const estimatedPages = Math.max(1, pages.length);
    onStatsChange({ words, pages: estimatedPages });
  });

  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 28)}px`;
  }

  $effect(() => {
    const _t = title;
    if (titleTextareaRef) {
      autoResize(titleTextareaRef);
    }
  });

  function startEditing(block: LiveBlock) {
    if (activeBlockId === block.id) return;
    if (activeBlockId !== null) {
      const prevBlock = liveBlocks.find(b => b.id === activeBlockId);
      if (prevBlock) {
        commitBlock(prevBlock);
      }
    }
    const currentBlock = liveBlocks.find(b => b.id === block.id) || block;
    activeBlockId = currentBlock.id;
    blockDraftText = currentBlock.rawText;
    
    setTimeout(() => {
      if (activeTextareaRef) {
        autoResize(activeTextareaRef);
        activeTextareaRef.focus();
        const len = activeTextareaRef.value.length;
        activeTextareaRef.setSelectionRange(len, len);
      }
    }, 15);
  }

  function commitBlock(block: LiveBlock) {
    if (activeBlockId !== block.id) return;
    const target = liveBlocks.find(b => b.id === block.id) || block;
    const newText = blockDraftText;
    const lines = content.split('\n');
    const newLines = newText.split('\n');
    lines.splice(target.lineStart, target.lineEnd - target.lineStart, ...newLines);
    content = lines.join('\n');
    activeBlockId = null;
    blockDraftText = '';
  }

  export function flushActiveBlock(): string {
    if (activeBlockId !== null) {
      const curBlock = liveBlocks.find(b => b.id === activeBlockId);
      if (curBlock) {
        const lines = content.split('\n');
        const newLines = blockDraftText.split('\n');
        lines.splice(curBlock.lineStart, curBlock.lineEnd - curBlock.lineStart, ...newLines);
        content = lines.join('\n');
        activeBlockId = null;
        blockDraftText = '';
      }
    }
    return content;
  }

  export function resetEditorState() {
    activeBlockId = null;
    blockDraftText = '';
    showSlashMenu = false;
    showToolbar = false;
  }

  function appendNewBlock() {
    if (activeBlockId !== null) {
      const prevBlock = liveBlocks.find(b => b.id === activeBlockId);
      if (prevBlock) {
        commitBlock(prevBlock);
      }
    }
    const lines = content ? content.split('\n') : [];
    lines.push('');
    content = lines.join('\n');
    
    setTimeout(() => {
      const lastBlock = liveBlocks[liveBlocks.length - 1];
      if (lastBlock) {
        startEditing(lastBlock);
      }
    }, 25);
  }

  function renderInlineMath(text: string): string {
    const mathTokens: string[] = [];
    let processed = text.replace(/\$([^\$\n]+)\$/g, (_, math) => {
      try {
        const renderedMath = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        const token = `__ZXKTX${mathTokens.length}XZ__`;
        mathTokens.push(renderedMath);
        return token;
      } catch {
        const token = `__ZXKTX${mathTokens.length}XZ__`;
        mathTokens.push(`$${math}$`);
        return token;
      }
    });

    // Microtipografía TeX: comillas tipográficas y guiones en-dash / em-dash
    processed = processed
      .replace(/"([^"\n]+)"/g, '“$1”')
      .replace(/``([^'\n]+)''/g, '“$1”')
      .replace(/(\d+)\s*--\s*(\d+)/g, '$1–$2')
      .replace(/\s+---\s+/g, ' — ')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded-xs bg-black/[0.06] dark:bg-white/10 font-paper-mono text-[0.92em]">$1</code>');

    for (let i = 0; i < mathTokens.length; i++) {
      processed = processed.replace(`__ZXKTX${i}XZ__`, mathTokens[i]);
    }

    if (showFindBar && findQuery.trim()) {
      const q = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flags = matchCase ? 'g' : 'gi';
      processed = processed.replace(new RegExp(`(?![^<]*>)(${q})`, flags), '<mark class="bg-amber-400/50 text-inherit rounded-[2px] px-0.5">$1</mark>');
    }

    return processed;
  }

  function renderKaTeXBlock(tex: string): string {
    try {
      const cleaned = tex
        .replace(/^\\begin\{(equation\*?|align\*?|gather\*?|multline\*?)\}/, '')
        .replace(/\\end\{(equation\*?|align\*?|gather\*?|multline\*?)\}$/, '')
        .trim();
      return katex.renderToString(cleaned, { displayMode: true, throwOnError: false });
    } catch {
      return `<div class="text-rose-500 font-mono text-xs">${tex}</div>`;
    }
  }

  export function openMathEditor(currentTex: string = '') {
    activeMathTex = currentTex || 'v = \\frac{\\Delta x}{\\Delta t}';
    showMathModal = true;
  }

  export function getPrintPages(): HTMLElement[] {
    const target = document.querySelectorAll<HTMLElement>('#layratex-pdf-render-target [data-paper-page]');
    if (target.length > 0) {
      return Array.from(target);
    }
    const currentView = document.querySelectorAll<HTMLElement>('[data-paper-page]');
    return Array.from(currentView);
  }

  function handleInsertFormula(newTex: string) {
    const formulaBlock = `$$\n${newTex}\n$$`;
    if (activeBlockId !== null) {
      const curBlock = liveBlocks.find(b => b.id === activeBlockId);
      if (curBlock) {
        blockDraftText = formulaBlock;
        commitBlock(curBlock);
        return;
      }
    }
    content += (content.endsWith('\n') ? '' : '\n') + formulaBlock + '\n';
  }

  function handleInsertTable(tableMd: string) {
    if (activeBlockId !== null) {
      const curBlock = liveBlocks.find(b => b.id === activeBlockId);
      if (curBlock) {
        blockDraftText = tableMd;
        commitBlock(curBlock);
        return;
      }
    }
    content += (content.endsWith('\n') ? '' : '\n') + tableMd + '\n';
  }

  function handleSelectSlashAction(action: string) {
    showSlashMenu = false;
    if (!activeTextareaRef) {
      if (action === 'h1') content += (content.endsWith('\n') ? '' : '\n') + '# Nueva Sección\n';
      else if (action === 'h2') content += (content.endsWith('\n') ? '' : '\n') + '## Nueva Subsección\n';
      else if (action === 'h3') content += (content.endsWith('\n') ? '' : '\n') + '### Nueva Subsubsección\n';
      else if (action === 'abstract') content += (content.endsWith('\n') ? '' : '\n') + '> **Resumen**\n> Escribe aquí el resumen ejecutivo o abstract del artículo científico.\n';
      else if (action === 'theorem') content += (content.endsWith('\n') ? '' : '\n') + '> **Teorema:** Sea $f$ una función continua en $[a,b]$...\n';
      else if (action === 'definition') content += (content.endsWith('\n') ? '' : '\n') + '> **Definición:** Se denomina espacio métrico a todo par $(X, d)$...\n';
      else if (action === 'proof') content += (content.endsWith('\n') ? '' : '\n') + '> **Demostración:** Por reducción al absurdo se concluye inmediatamente el resultado.\n';
      else if (action === 'math') openMathEditor();
      else if (action === 'table') showTableModal = true;
      else if (action === 'image') content += (content.endsWith('\n') ? '' : '\n') + '![Descripción de la figura científica](figura.png)\n';
      else if (action === 'callout') content += (content.endsWith('\n') ? '' : '\n') + '> Observación importante...\n';
      else if (action === 'bullet') content += (content.endsWith('\n') ? '' : '\n') + '* Elemento de lista\n';
      else if (action === 'numbered') content += (content.endsWith('\n') ? '' : '\n') + '1. Primer paso\n';
      else if (action === 'divider') content += (content.endsWith('\n') ? '' : '\n') + '---\n';
      return;
    }

    const cursor = activeTextareaRef.selectionStart;
    const before = blockDraftText.substring(0, cursor).replace(/\/([a-zA-Z0-9]*)$/, '');
    const after = blockDraftText.substring(cursor);

    let inserted = '';
    if (action === 'h1') inserted = '# ';
    else if (action === 'h2') inserted = '## ';
    else if (action === 'h3') inserted = '### ';
    else if (action === 'abstract') inserted = '> **Resumen**\n> ';
    else if (action === 'theorem') inserted = '> **Teorema:** ';
    else if (action === 'definition') inserted = '> **Definición:** ';
    else if (action === 'proof') inserted = '> **Demostración:** ';
    else if (action === 'math') { openMathEditor(); return; }
    else if (action === 'table') { showTableModal = true; return; }
    else if (action === 'image') inserted = '![Descripción de la figura](figura.png)';
    else if (action === 'callout') inserted = '> ';
    else if (action === 'bullet') inserted = '* ';
    else if (action === 'numbered') inserted = '1. ';
    else if (action === 'divider') inserted = '---\n';

    blockDraftText = before + inserted + after;
    setTimeout(() => {
      if (activeTextareaRef) {
        autoResize(activeTextareaRef);
        const newPos = before.length + inserted.length;
        activeTextareaRef.setSelectionRange(newPos, newPos);
        activeTextareaRef.focus();
      }
    }, 10);
  }

  function wrapSelectionInDraft(before: string, after: string) {
    if (!activeTextareaRef) return;
    const start = activeTextareaRef.selectionStart;
    const end = activeTextareaRef.selectionEnd;
    const selected = blockDraftText.substring(start, end);
    const replacement = `${before}${selected || 'texto'}${after}`;
    blockDraftText = blockDraftText.substring(0, start) + replacement + blockDraftText.substring(end);
    setTimeout(() => {
      if (activeTextareaRef) {
        autoResize(activeTextareaRef);
        const newCursor = start + before.length + (selected ? selected.length : 5);
        activeTextareaRef.setSelectionRange(newCursor, newCursor);
        activeTextareaRef.focus();
      }
    }, 10);
  }

  function handleFormat(action: string) {
    if (!activeTextareaRef) {
      if (action === 'bold') content += '**texto**';
      else if (action === 'italic') content += '*texto*';
      else if (action === 'math') content += '\n$$\nx\n$$\n';
      else if (action === 'h1') content += '\n# Título\n';
      else if (action === 'h2') content += '\n## Subtítulo\n';
      else if (action === 'quote') content += '\n> **Teorema:** \n';
      showToolbar = false;
      return;
    }

    if (action === 'bold') wrapSelectionInDraft('**', '**');
    else if (action === 'italic') wrapSelectionInDraft('*', '*');
    else if (action === 'math') wrapSelectionInDraft('$', '$');
    else if (action === 'h1') wrapSelectionInDraft('# ', '');
    else if (action === 'h2') wrapSelectionInDraft('## ', '');
    else if (action === 'quote') wrapSelectionInDraft('> ', '');
    showToolbar = false;
  }

  function checkSelection() {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      toolbarX = rect.left + rect.width / 2;
      toolbarY = rect.top;
      showToolbar = true;
    } else {
      showToolbar = false;
    }
  }

  function handleActiveKeyDown(e: KeyboardEvent, block: LiveBlock) {
    const isMod = e.ctrlKey || e.metaKey;

    if (showSlashMenu && slashMenuRef) {
      if (slashMenuRef.handleKeyDown(e)) {
        return;
      }
    }

    if (isMod && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      openFind();
      return;
    }
    if (isMod && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      openReplacePanel();
      return;
    }

    if (isMod && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      wrapSelectionInDraft('**', '**');
      return;
    }
    if (isMod && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      wrapSelectionInDraft('*', '*');
      return;
    }
    if (isMod && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      openMathEditor();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      commitBlock(block);
      return;
    }

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        setTimeout(() => autoResize(activeTextareaRef), 0);
        return;
      }

      if (block.type === 'math' || block.type === 'table') {
        if (isMod) {
          e.preventDefault();
          commitBlock(block);
        } else {
          setTimeout(() => autoResize(activeTextareaRef), 0);
        }
        return;
      }

      if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'divider') {
        e.preventDefault();
        const currentVal = blockDraftText;
        const target = liveBlocks.find(b => b.id === block.id) || block;
        const lines = content.split('\n');
        const newLines = currentVal.split('\n');
        lines.splice(target.lineStart, target.lineEnd - target.lineStart, ...newLines, '');
        content = lines.join('\n');
        activeBlockId = null;
        blockDraftText = '';
        
        setTimeout(() => {
          const targetLine = target.lineStart + newLines.length;
          const nextBlock = liveBlocks.find(b => b.lineStart <= targetLine && b.lineEnd > targetLine);
          if (nextBlock) {
            startEditing(nextBlock);
          }
        }, 30);
        return;
      }

      if (block.type === 'list') {
        e.preventDefault();
        const trimmed = blockDraftText.trim();
        if (/^(\*|-|\+|\d+\.)\s*$/.test(trimmed)) {
          const target = liveBlocks.find(b => b.id === block.id) || block;
          const lines = content.split('\n');
          lines.splice(target.lineStart, target.lineEnd - target.lineStart, '');
          content = lines.join('\n');
          activeBlockId = null;
          blockDraftText = '';
          return;
        }

        let nextPrefix = '* ';
        const numMatch = blockDraftText.match(/^(\d+)\.\s+/);
        if (numMatch) {
          const nextNum = parseInt(numMatch[1], 10) + 1;
          nextPrefix = `${nextNum}. `;
        } else if (blockDraftText.trimStart().startsWith('- ')) {
          nextPrefix = '- ';
        }

        const target = liveBlocks.find(b => b.id === block.id) || block;
        const lines = content.split('\n');
        const newLines = blockDraftText.split('\n');
        lines.splice(target.lineStart, target.lineEnd - target.lineStart, ...newLines, nextPrefix);
        content = lines.join('\n');
        activeBlockId = null;
        blockDraftText = '';

        setTimeout(() => {
          const targetLine = target.lineStart + newLines.length;
          const nextBlock = liveBlocks.find(b => b.lineStart <= targetLine && b.lineEnd > targetLine);
          if (nextBlock) {
            startEditing(nextBlock);
          }
        }, 30);
        return;
      }

      if (block.type === 'p' || block.type === 'empty') {
        const textarea = activeTextareaRef;
        if (textarea) {
          const cursor = textarea.selectionStart;
          const before = blockDraftText.substring(0, cursor);
          const after = blockDraftText.substring(cursor);

          e.preventDefault();
          const target = liveBlocks.find(b => b.id === block.id) || block;
          const lines = content.split('\n');
          lines.splice(target.lineStart, target.lineEnd - target.lineStart, before, after);
          content = lines.join('\n');
          activeBlockId = null;
          blockDraftText = '';

          setTimeout(() => {
            const targetLine = target.lineStart + 1;
            const nextBlock = liveBlocks.find(b => b.lineStart <= targetLine && b.lineEnd > targetLine);
            if (nextBlock) {
              startEditing(nextBlock);
            }
          }, 30);
          return;
        }
      }
    }

    if (e.key === 'Backspace' && blockDraftText === '') {
      e.preventDefault();
      const target = liveBlocks.find(b => b.id === block.id) || block;
      const lines = content.split('\n');
      const prevBlockIdx = liveBlocks.findIndex(b => b.id === block.id) - 1;
      lines.splice(target.lineStart, target.lineEnd - target.lineStart);
      content = lines.join('\n');
      activeBlockId = null;
      blockDraftText = '';

      if (prevBlockIdx >= 0) {
        setTimeout(() => {
          const prevBlock = liveBlocks[prevBlockIdx];
          if (prevBlock) {
            startEditing(prevBlock);
          }
        }, 30);
      }
      return;
    }

    setTimeout(() => autoResize(activeTextareaRef), 0);
  }

  function handleActiveInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    autoResize(target);

    const textBeforeCursor = target.value.substring(0, target.selectionStart);
    const matchSlash = textBeforeCursor.match(/\/([a-zA-Z0-9]*)$/);
    if (matchSlash) {
      showSlashMenu = true;
      slashFilter = matchSlash[1];

      const rect = target.getBoundingClientRect();
      slashMenuX = Math.min(Math.max(20, rect.left + 30), window.innerWidth - 360);
      slashMenuY = Math.min(rect.bottom + 10, window.innerHeight - 320);
    } else {
      showSlashMenu = false;
    }
  }

  function getBlockEditorClass(type: LiveBlock['type']): string {
    switch (type) {
      case 'h1':
        return `text-[17pt] font-bold tracking-tight ${activeTheme.titleClass}`;
      case 'h2':
        return `text-[14pt] font-bold tracking-tight ${activeTheme.titleClass}`;
      case 'h3':
        return `text-[12pt] font-bold tracking-tight ${activeTheme.titleClass}`;
      case 'math':
        return 'font-paper-mono text-[13px] leading-relaxed text-indigo-600 dark:text-indigo-300';
      case 'table':
        return `font-paper-mono text-xs leading-relaxed ${activeTheme.textClass}`;
      case 'callout':
        return `text-[11.5pt] italic pl-2 border-l-2 border-indigo-400 ${activeTheme.textClass}`;
      case 'divider':
        return 'text-xs font-mono text-center opacity-60';
      default:
        return `text-[12pt] leading-[1.58] ${activeTheme.textClass}`;
    }
  }

  function getBlockTypeLabel(type: LiveBlock['type']): string {
    switch (type) {
      case 'h1': return '\\section';
      case 'h2': return '\\subsection';
      case 'h3': return '\\subsubsection';
      case 'math': return '\\begin{equation}';
      case 'table': return '\\begin{tabular} (booktabs)';
      case 'figure': return '\\begin{figure}';
      case 'callout': return 'Entorno Académico';
      case 'list': return '\\item';
      case 'divider': return '\\newpage';
      case 'empty': return 'Espacio vertical';
      default: return 'Párrafo TeX';
    }
  }
</script>

<!-- Mesa Editorial de Trabajo LaTeX -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
  class="h-full w-full flex flex-col items-center {activeTheme.deskClass} overflow-y-auto select-text transition-colors duration-200 py-8 px-4 md:px-10 relative"
  onmouseup={checkSelection}
>

  <!-- HOJAS FÍSICAS A4 MAQUETADAS CON ESTÉTICA CANÓNICA LATEX (\documentclass[12pt,a4paper]{article}) -->
  {#each pages as page, pageIndex (page.pageNumber)}
    <div 
      data-paper-page={pageIndex}
      class="w-full max-w-[820px] min-h-[1158px] rounded-[1px] {activeTheme.sheetClass} px-12 sm:px-20 md:px-[92px] pt-[74px] pb-[64px] flex flex-col relative transition-all duration-200 mb-10"
      style="hyphens: auto; -webkit-hyphens: auto;"
    >
      {#if showCropMarks}
        <div class="absolute top-5 left-5 w-3.5 h-3.5 border-t border-l {activeTheme.cropClass} pointer-events-none"></div>
        <div class="absolute top-5 right-5 w-3.5 h-3.5 border-t border-r {activeTheme.cropClass} pointer-events-none"></div>
        <div class="absolute bottom-5 left-5 w-3.5 h-3.5 border-b border-l {activeTheme.cropClass} pointer-events-none"></div>
        <div class="absolute bottom-5 right-5 w-3.5 h-3.5 border-b border-r {activeTheme.cropClass} pointer-events-none"></div>
      {/if}

      <!-- Encabezado Canónico LaTeX \pagestyle{headings} en páginas > 1 (Página 1 usa \thispagestyle{plain}) -->
      {#if pageIndex > 0}
        <div class="flex items-center justify-between text-[10.5pt] {activeTheme.mutedClass} {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} italic pb-2 mb-7 border-b {activeTheme.borderClass}">
          <span class="truncate max-w-md">{title || 'Documento sin título'}</span>
          <span class="not-italic">{page.pageNumber}</span>
        </div>
      {/if}

      <!-- Bloque \maketitle Canónico de LaTeX (Página 1) -->
      {#if pageIndex === 0}
        <div class="mt-4 mb-9 text-center {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'}">
          <textarea
            bind:this={titleTextareaRef}
            bind:value={title}
            oninput={(e) => autoResize(e.currentTarget)}
            rows={1}
            class="w-full text-[20pt] md:text-[22pt] font-normal leading-[1.25] {activeTheme.titleClass} bg-transparent border-none outline-hidden focus:ring-0 text-center resize-none overflow-hidden p-0"
            placeholder="Título del Artículo o Documento"
          ></textarea>
          <div class="mt-3 flex flex-col items-center gap-1">
            <input
              type="text"
              bind:value={author}
              class="w-full max-w-md text-center text-[12.5pt] font-normal {activeTheme.textClass} bg-transparent border-none outline-hidden focus:ring-0 p-0"
              placeholder="Nombre del Autor o Institución"
              title="Haz clic para editar el autor (\author)"
            />
            <div class="text-[11.5pt] {activeTheme.mutedClass} mt-0.5">
              {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      {/if}

      <!-- Cuerpo Tipográfico Estilo LaTeX article -->
      <div class="flex-1 flex flex-col {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'}">
        {#each page.blocks as block (block.id)}
          {#if activeBlockId === block.id}
            <!-- MODO EDICIÓN EN VIVO -->
            <div class="relative w-full rounded-xs bg-indigo-500/[0.06] ring-1 ring-indigo-500/40 p-2.5 my-1 transition-all">
              <textarea
                bind:this={activeTextareaRef}
                bind:value={blockDraftText}
                oninput={handleActiveInput}
                onkeydown={(e) => handleActiveKeyDown(e, block)}
                onblur={() => commitBlock(block)}
                rows={1}
                class="w-full bg-transparent border-none outline-hidden resize-none p-0 focus:ring-0 {getBlockEditorClass(block.type)} overflow-hidden"
                placeholder="Escribe en este bloque... (usa / para comandos LaTeX)"
              ></textarea>
              <div class="flex items-center justify-between flex-wrap gap-1 text-[10px] {activeTheme.mutedClass} pt-1.5 select-none font-mono opacity-75">
                <span class="font-semibold text-indigo-500 dark:text-indigo-400">{getBlockTypeLabel(block.type)}</span>
                <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {#if block.type === 'math'}
                    <button
                      type="button"
                      onmousedown={(e) => { e.preventDefault(); openMathEditor(block.content); }}
                      class="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-sans font-medium hover:bg-indigo-500 cursor-pointer"
                    >
                      Abrir Constructor Visual fx
                    </button>
                  {/if}
                  <span>Esc para previsualizar • Enter nueva línea</span>
                </div>
              </div>
            </div>
          {:else}
            <!-- MODO PREVISUALIZACIÓN EN VIVO: Estética Pura LaTeX -->
            <div 
              id={block.id}
              role="button"
              tabindex="0"
              onclick={() => startEditing(block)}
              ondblclick={() => { if (block.type === 'math') openMathEditor(block.content); }}
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEditing(block); }}
              class="group relative px-1.5 -mx-1.5 rounded-xs hover:ring-1 hover:ring-indigo-500/25 hover:bg-indigo-500/[0.02] transition-all cursor-text"
              title={block.type === 'math' ? 'Clic para editar LaTeX • Doble clic para abrir el Constructor Visual fx' : 'Haz clic para editar este bloque'}
            >
              {#if block.type === 'h1'}
                {@const heading = getHeadingDisplay(block)}
                <h2 class="text-[15.5pt] font-bold {activeTheme.titleClass} pt-5 pb-2 leading-snug tracking-normal">
                  {#if heading.number}
                    <span class="mr-3.5">{heading.number}</span>
                  {/if}
                  {@html renderInlineMath(heading.title)}
                </h2>
              {:else if block.type === 'h2'}
                {@const heading = getHeadingDisplay(block)}
                <h3 class="text-[13pt] font-bold {activeTheme.titleClass} pt-4 pb-1.5 leading-snug tracking-normal">
                  {#if heading.number}
                    <span class="mr-3">{heading.number}</span>
                  {/if}
                  {@html renderInlineMath(heading.title)}
                </h3>
              {:else if block.type === 'h3'}
                {@const heading = getHeadingDisplay(block)}
                <h4 class="text-[11.5pt] font-bold {activeTheme.titleClass} pt-3 pb-1 leading-snug tracking-normal">
                  {#if heading.number}
                    <span class="mr-2.5">{heading.number}</span>
                  {/if}
                  {@html renderInlineMath(heading.title)}
                </h4>
              {:else if block.type === 'callout'}
                {@const env = parseCalloutEnv(block)}
                {#if env.kind === 'abstract'}
                  <!-- Entorno \begin{abstract} Canónico de LaTeX -->
                  <div class="my-5 mx-8 sm:mx-12">
                    <div class="text-center font-bold text-[10pt] mb-1.5 {activeTheme.titleClass}">
                      {env.label}
                    </div>
                    <p class="text-[10pt] leading-[1.52] text-justify {activeTheme.textClass}" style="text-indent: 1.5em;">
                      {@html renderInlineMath(env.body)}
                    </p>
                  </div>
                {:else if env.kind === 'theorem'}
                  <!-- Entorno \begin{theorem} / \begin{lemma} de amsthm -->
                  <div class="my-3 text-[11.5pt] leading-[1.58] text-justify {activeTheme.textClass}">
                    <span class="font-bold not-italic {activeTheme.titleClass} mr-1.5">{env.label}</span>
                    <span class="italic">{@html renderInlineMath(env.body)}</span>
                  </div>
                {:else if env.kind === 'definition'}
                  <!-- Entorno \begin{definition} de amsthm (cuerpo upright) -->
                  <div class="my-3 text-[11.5pt] leading-[1.58] text-justify {activeTheme.textClass}">
                    <span class="font-bold {activeTheme.titleClass} mr-1.5">{env.label}</span>
                    <span>{@html renderInlineMath(env.body)}</span>
                  </div>
                {:else if env.kind === 'proof'}
                  <!-- Entorno \begin{proof} de amsthm con Q.E.D. \square a la derecha -->
                  <div class="my-3 text-[11.5pt] leading-[1.58] text-justify {activeTheme.textClass} flex flex-col">
                    <div>
                      <span class="italic mr-1.5">{env.label}</span>
                      <span>{@html renderInlineMath(env.body)}</span>
                      <span class="float-right ml-3 select-none font-serif text-[11pt]" title="Q.E.D. (\qed)">◻</span>
                    </div>
                  </div>
                {:else}
                  <!-- Entorno \begin{quote} -->
                  <blockquote class="my-3 mx-8 text-[11pt] leading-[1.55] text-justify italic {activeTheme.textClass}">
                    {@html renderInlineMath(env.body)}
                  </blockquote>
                {/if}
              {:else if block.type === 'math'}
                <div class="my-3.5 py-1.5 relative flex items-center justify-between w-full rounded-xs transition-colors {activeTheme.hoverMathClass} px-2">
                  <div class="w-12 shrink-0"></div>
                  <div class="text-center text-[12pt] overflow-x-auto max-w-[calc(100%-96px)] px-2 py-0.5">
                    {@html renderKaTeXBlock(block.content)}
                  </div>
                  <div class="w-12 shrink-0 text-right select-none font-paper-serif text-[11.5pt] {activeTheme.textClass}">
                    {#if blockNumberMap.get(block.id)?.eqNumber}
                      ({blockNumberMap.get(block.id)?.eqNumber})
                    {/if}
                  </div>
                </div>
              {:else if block.type === 'table' && block.tableData}
                <!-- Tabla Científica Estilo booktabs (\toprule, \midrule, \bottomrule) -->
                <div class="my-5 flex flex-col items-center">
                  <div class="text-[10.5pt] {activeTheme.textClass} mb-2 text-center">
                    <span class="font-bold">Cuadro {blockNumberMap.get(block.id)?.tableNumber ?? 1}:</span>
                    <span class="ml-1"> Resumen estructurado de datos</span>
                  </div>
                  <div class="overflow-x-auto max-w-full">
                    <table class="text-[10.5pt] border-collapse">
                      <thead class="font-bold {activeTheme.titleClass}">
                        <tr class="border-t-[1.8px] border-b-[1px] {activeTheme.ruleClass}">
                          {#each block.tableData.headers as h}
                            <th class="py-1.5 px-4 text-center font-bold">{@html renderInlineMath(h)}</th>
                          {/each}
                        </tr>
                      </thead>
                      <tbody class="border-b-[1.8px] {activeTheme.ruleClass}">
                        {#each block.tableData.rows as row}
                          <tr>
                            {#each row as cell}
                              <td class="py-1.5 px-4 text-center {activeTheme.textClass}">{@html renderInlineMath(cell)}</td>
                            {/each}
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                </div>
              {:else if block.type === 'figure' && block.figureData}
                <!-- Entorno \begin{figure} con \caption -->
                <figure class="my-5 flex flex-col items-center text-center">
                  <div class="px-6 py-4 rounded-xs border border-dashed {activeTheme.borderClass} max-w-md w-full flex flex-col items-center justify-center gap-2">
                    {#if block.figureData.url && (block.figureData.url.startsWith('http') || block.figureData.url.startsWith('data:') || block.figureData.url.startsWith('/'))}
                      <img src={block.figureData.url} alt={block.figureData.caption} class="max-h-56 max-w-full object-contain" />
                    {:else}
                      <div class="text-xs font-paper-mono opacity-65 py-3">[\includegraphics&#123;{block.figureData.url}&#125;]</div>
                    {/if}
                  </div>
                  <figcaption class="mt-2 text-[10.5pt] {activeTheme.textClass}">
                    <span class="font-bold">Figura {blockNumberMap.get(block.id)?.figNumber ?? 1}:</span>
                    <span class="ml-1">{@html renderInlineMath(block.figureData.caption)}</span>
                  </figcaption>
                </figure>
              {:else if block.type === 'list'}
                <div class="flex items-baseline gap-2.5 ml-6 my-0.5 text-[11.5pt] leading-[1.58]">
                  <span class="select-none font-bold {activeTheme.textClass} min-w-[1.2em] text-right">
                    {block.isOrdered ? `${block.listNumber ?? 1}.` : '•'}
                  </span>
                  <span class="text-justify flex-1 {activeTheme.textClass}">{@html renderInlineMath(block.content)}</span>
                </div>
              {:else if block.type === 'divider'}
                <div class="py-3 flex items-center justify-center">
                  <hr class="w-full border-t border-dashed {activeTheme.borderClass}" />
                </div>
              {:else if block.type === 'empty'}
                <div class="h-2.5 w-full cursor-text"></div>
              {:else}
                <p 
                  class="text-[11.5pt] leading-[1.58] text-justify {activeTheme.textClass} break-words"
                  style="text-indent: {isFirstParagraph(block.id) ? '0' : '1.75em'}; margin-bottom: 0;"
                >
                  {@html renderInlineMath(block.content)}
                </p>
              {/if}

              <!-- Etiqueta discreta LaTeX al pasar el cursor -->
              <span class="absolute right-1 top-0.5 opacity-0 group-hover:opacity-45 text-[9px] font-mono pointer-events-none transition-opacity">
                {getBlockTypeLabel(block.type)}
              </span>
            </div>
          {/if}
        {/each}

        <!-- Zona de continuación en la última página -->
        {#if pageIndex === pages.length - 1}
          <div 
            role="button"
            tabindex="0"
            onclick={appendNewBlock}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') appendNewBlock(); }}
            class="flex-1 min-h-[80px] w-full cursor-text py-4 text-xs {activeTheme.mutedClass} opacity-35 hover:opacity-75 transition-opacity flex items-start"
            title="Haz clic para continuar redactando..."
          >
            <span class="italic">Haz clic para redactar o escribe «/» para insertar secciones, ecuaciones, teoremas o tablas...</span>
          </div>
        {/if}
      </div>

      <!-- Pie de Página Canónico LaTeX \pagestyle{plain} (Número centrado en Computer Modern) -->
      <div class="pt-6 text-center text-[11pt] {activeTheme.textClass} {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} mt-auto select-none">
        <span>{page.pageNumber}</span>
      </div>
    </div>
  {/each}

  <!-- Barra de Búsqueda y Reemplazo Global (Ctrl+F / Ctrl+H) -->
  {#if showFindBar}
    <div class="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[min(680px,95vw)]">
      <div class="flex flex-col gap-2 rounded-md border border-white/10 bg-[#161b22] shadow-2xl p-2 backdrop-blur-sm">
        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <input
            class="paper-find-input flex-1 px-2.5 py-1 rounded-xs bg-[#0d1117] border border-white/10 text-slate-200 text-xs outline-none focus:border-indigo-400/60"
            placeholder="Buscar en el documento..."
            bind:value={findQuery}
            oninput={() => findMatches()}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) prevMatch(); else nextMatch();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                closeFindBar();
              }
            }}
          />
          <button type="button" class="p-1 rounded-xs bg-white/5 hover:bg-white/10 text-slate-300 transition-colors flex items-center justify-center cursor-pointer" onclick={prevMatch} title="Anterior (Shift+Enter)"><ChevronLeft size={13} /></button>
          <button type="button" class="p-1 rounded-xs bg-white/5 hover:bg-white/10 text-slate-300 transition-colors flex items-center justify-center cursor-pointer" onclick={nextMatch} title="Siguiente (Enter)"><ChevronRight size={13} /></button>
          <span class="text-[10px] text-slate-400 font-mono min-w-[75px] text-center">{matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length} (L.${currentMatchLine})` : (findQuery ? '0 / 0' : '—')}</span>
          <label class="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
            <input type="checkbox" bind:checked={matchCase} onchange={() => findMatches()} />
            Aa
          </label>
          <button type="button" class="px-2 py-1 rounded-xs bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] cursor-pointer" onclick={() => showReplace = !showReplace}>{showReplace ? 'Ocultar' : 'Reemplazar'}</button>
          <button type="button" class="p-1 rounded-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer" onclick={closeFindBar} title="Cerrar (Esc)"><X size={13} /></button>
        </div>
        {#if showReplace}
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <input
              class="flex-1 px-2.5 py-1 rounded-xs bg-[#0d1117] border border-white/10 text-slate-200 text-xs outline-none focus:border-indigo-400/60"
              placeholder="Reemplazar con..."
              bind:value={replaceQuery}
              onkeydown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  replaceCurrent();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  closeFindBar();
                }
              }}
            />
            <button type="button" class="px-2 py-1 rounded-xs bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] cursor-pointer" onclick={replaceCurrent}>Reemplazar</button>
            <button type="button" class="px-2 py-1 rounded-xs bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] cursor-pointer" onclick={replaceAll}>Reemplazar todo</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

</div>

<!-- Contenedor Oficial Autónomo para Exportación a PDF (Maquetación Canónica Idéntica a LaTeX article) -->
<div id="layratex-pdf-render-target" class="fixed -left-[9999px] top-0 pointer-events-none opacity-0 select-none" aria-hidden="true">
  {#each pages as page, pageIndex}
    <div 
      data-paper-page={pageIndex}
      class="w-[820px] min-h-[1160px] bg-white text-black px-[92px] pt-[82px] pb-[72px] flex flex-col relative box-border"
      style="font-family: {fontStyle === 'serif' ? '\'Computer Modern\', \'CMU Serif\', \'Latin Modern Roman\', \'KaTeX_Main\', serif' : '\'CMU Sans Serif\', -apple-system, sans-serif'}; hyphens: auto; -webkit-hyphens: auto;"
    >
      {#if pageIndex > 0}
        <div class="flex items-center justify-between text-[10pt] text-black/80 italic pb-2 mb-6 border-b border-black/20">
          <span>{title || 'Documento sin título'}</span>
          <span class="not-italic">{page.pageNumber}</span>
        </div>
      {/if}

      {#if pageIndex === 0}
        <div class="mb-9 text-center">
          <h1 class="text-[21pt] font-normal text-black leading-tight">
            {title || 'Documento sin título'}
          </h1>
          {#if author}
            <div class="text-[12.5pt] text-black mt-3 font-normal">
              {author}
            </div>
          {/if}
          <div class="text-[11pt] text-black/85 mt-1.5 font-normal">
            {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      {/if}

      <div class="text-black text-[11.5pt] leading-[1.58] flex-1">
        {#each page.blocks as b}
          {#if b.type === 'h1'}
            {@const heading = getHeadingDisplay(b)}
            <h2 class="text-[15.5pt] font-bold pt-5 pb-2 text-black leading-snug">
              {#if heading.number}
                <span class="mr-3.5 font-bold">{heading.number}</span>
              {/if}
              {@html renderInlineMath(heading.title)}
            </h2>
          {:else if b.type === 'h2'}
            {@const heading = getHeadingDisplay(b)}
            <h3 class="text-[13pt] font-bold pt-4 pb-1.5 text-black leading-snug">
              {#if heading.number}
                <span class="mr-3 font-bold">{heading.number}</span>
              {/if}
              {@html renderInlineMath(heading.title)}
            </h3>
          {:else if b.type === 'h3'}
            {@const heading = getHeadingDisplay(b)}
            <h4 class="text-[11.5pt] font-bold pt-3 pb-1 text-black leading-snug">
              {#if heading.number}
                <span class="mr-2.5 font-bold">{heading.number}</span>
              {/if}
              {@html renderInlineMath(heading.title)}
            </h4>
          {:else if b.type === 'callout'}
            {@const env = parseCalloutEnv(b)}
            {#if env.kind === 'abstract'}
              <div class="my-5 mx-12">
                <span class="block font-bold text-[10pt] mb-1.5 text-black text-center">{env.label}</span>
                <p class="text-[10pt] leading-[1.5] text-justify text-black" style="text-indent: 1.5em;">
                  {@html renderInlineMath(env.body)}
                </p>
              </div>
            {:else if env.kind === 'theorem'}
              <div class="my-3 text-[11.5pt] leading-[1.58] text-justify text-black">
                <span class="font-bold mr-1.5">{env.label}</span>
                <span class="italic">{@html renderInlineMath(env.body)}</span>
              </div>
            {:else if env.kind === 'definition'}
              <div class="my-3 text-[11.5pt] leading-[1.58] text-justify text-black">
                <span class="font-bold mr-1.5">{env.label}</span>
                <span>{@html renderInlineMath(env.body)}</span>
              </div>
            {:else if env.kind === 'proof'}
              <div class="my-3 text-[11.5pt] leading-[1.58] text-justify text-black">
                <span class="italic mr-1.5">{env.label}</span>
                <span>{@html renderInlineMath(env.body)}</span>
                <span class="float-right ml-3">◻</span>
              </div>
            {:else}
              <blockquote class="my-3 mx-8 text-[10.5pt] italic text-black/90 text-justify">
                {@html renderInlineMath(env.body)}
              </blockquote>
            {/if}
          {:else if b.type === 'math'}
            <div class="my-3.5 relative flex items-center justify-between w-full px-2">
              <div class="w-12 shrink-0"></div>
              <div class="text-center text-[12pt] overflow-x-auto max-w-[calc(100%-96px)] px-2 py-0.5">
                {@html renderKaTeXBlock(b.content)}
              </div>
              <div class="w-12 shrink-0 text-right select-none font-serif text-[11pt] text-black">
                {#if blockNumberMap.get(b.id)?.eqNumber}
                  ({blockNumberMap.get(b.id)?.eqNumber})
                {/if}
              </div>
            </div>
          {:else if b.type === 'table' && b.tableData}
            <div class="my-5 flex flex-col items-center">
              <div class="text-[10pt] text-black mb-1.5 text-center">
                <span class="font-bold">Cuadro {blockNumberMap.get(b.id)?.tableNumber ?? 1}:</span>
                <span class="ml-1"> Datos tabulados</span>
              </div>
              <table class="border-collapse text-[10.5pt] text-black">
                <thead>
                  <tr class="border-t-[1.8px] border-b-[1px] border-black">
                    {#each b.tableData.headers as h}
                      <th class="py-1.5 px-4 font-bold text-center">{@html renderInlineMath(h)}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody class="border-b-[1.8px] border-black">
                  {#each b.tableData.rows as row}
                    <tr>
                      {#each row as cell}
                        <td class="py-1 px-4 text-center">{@html renderInlineMath(cell)}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else if b.type === 'list'}
            <div class="flex items-baseline gap-2.5 ml-6 my-0.5 text-[11.5pt] leading-[1.58] text-black">
              <span class="font-bold min-w-[1.2em] text-right">{b.isOrdered ? `${b.listNumber ?? 1}.` : '•'}</span>
              <span class="text-justify flex-1">{@html renderInlineMath(b.content)}</span>
            </div>
          {:else if b.type === 'divider'}
            <!-- Salto de página -->
          {:else if b.type === 'empty'}
            <div class="h-2"></div>
          {:else}
            <p 
              class="text-justify text-black"
              style="text-indent: {isFirstParagraph(b.id) ? '0' : '1.75em'}; margin-bottom: 0;"
            >
              {@html renderInlineMath(b.content)}
            </p>
          {/if}
        {/each}
      </div>

      <div class="pt-6 text-center text-[11pt] text-black mt-auto font-normal">
        <span>{page.pageNumber}</span>
      </div>
    </div>
  {/each}
</div>

<!-- Menú Slash Flotante -->
{#if showSlashMenu}
  <SlashMenu 
    bind:this={slashMenuRef}
    bind:isOpen={showSlashMenu}
    filter={slashFilter}
    x={slashMenuX}
    y={slashMenuY}
    onSelect={handleSelectSlashAction}
    onClose={() => showSlashMenu = false}
  />
{/if}

<!-- Barra Flotante de Selección -->
<FloatingToolbar 
  isOpen={showToolbar}
  x={toolbarX}
  y={toolbarY}
  onFormat={handleFormat}
/>

<!-- Modal Constructor Visual de Fórmulas Matemáticas -->
<MathBuilderModal 
  bind:isOpen={showMathModal}
  initialMath={activeMathTex}
  onInsert={handleInsertFormula}
/>

<!-- Modal Asistente Visual de Tablas -->
<TableBuilderModal 
  bind:isOpen={showTableModal}
  onInsert={handleInsertTable}
/>
