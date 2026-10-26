<script lang="ts">
  import katex from 'katex';
  import { 
    Calculator, 
    Edit3, 
    Eye, 
    Plus, 
    Type, 
    FileText, 
    Sparkles, 
    Heading1, 
    Heading2, 
    Info, 
    Table as TableIcon,
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
    paperTone = $bindable<PaperTone>('dark'),
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
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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
    cropClass: string;
    calloutClass: string;
    hoverMathClass: string;
  }> = {
    dark: {
      name: 'Noche / Grafito',
      deskClass: 'bg-[#090b10] text-[#c9d1d9]',
      sheetClass: 'bg-[#151922] text-[#e6edf3] border border-white/10 shadow-[0_12px_44px_rgba(0,0,0,0.7)]',
      textClass: 'text-[#d0d7de]',
      titleClass: 'text-white placeholder:text-slate-600',
      mutedClass: 'text-slate-400',
      borderClass: 'border-white/10',
      cropClass: 'border-white/20',
      calloutClass: 'bg-white/5 border-indigo-400 text-slate-300',
      hoverMathClass: 'hover:bg-white/5'
    },
    cream: {
      name: 'Marfil / Libro Cálido',
      deskClass: 'bg-[#e8e2d4] text-[#2c2825]',
      sheetClass: 'bg-[#faf6ed] text-[#2c2825] border border-[#ded5c2] shadow-[0_8px_32px_rgba(60,45,30,0.12)]',
      textClass: 'text-[#38332e]',
      titleClass: 'text-[#24201c] placeholder:text-[#a89d8f]',
      mutedClass: 'text-[#7d7265]',
      borderClass: 'border-[#e8dfcf]',
      cropClass: 'border-[#c2b69f]',
      calloutClass: 'bg-[#f2ecdf] border-[#9c783e] text-[#4a4237]',
      hoverMathClass: 'hover:bg-[#f2ecdf]'
    },
    sepia: {
      name: 'Sepia Pergamino',
      deskClass: 'bg-[#ded0b9] text-[#362b20]',
      sheetClass: 'bg-[#f5ecda] text-[#362b20] border border-[#d6c4a6] shadow-[0_8px_32px_rgba(60,45,30,0.14)]',
      textClass: 'text-[#3f3327]',
      titleClass: 'text-[#261e16] placeholder:text-[#a6957c]',
      mutedClass: 'text-[#84725b]',
      borderClass: 'border-[#decbb0]',
      cropClass: 'border-[#baa688]',
      calloutClass: 'bg-[#ece0c7] border-[#8c6b42] text-[#4d3f31]',
      hoverMathClass: 'hover:bg-[#ece0c7]'
    },
    white: {
      name: 'Blanco Suave',
      deskClass: 'bg-[#eef1f5] text-slate-800',
      sheetClass: 'bg-[#ffffff] text-slate-800 border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
      textClass: 'text-slate-800',
      titleClass: 'text-slate-900 placeholder:text-slate-300',
      mutedClass: 'text-slate-400',
      borderClass: 'border-slate-100',
      cropClass: 'border-slate-300',
      calloutClass: 'bg-slate-50 border-indigo-500 text-slate-700',
      hoverMathClass: 'hover:bg-slate-50'
    }
  };

  let activeTheme = $derived(toneThemes[paperTone as PaperTone] || toneThemes.dark);

  interface LiveBlock {
    id: string;
    type: 'h1' | 'h2' | 'h3' | 'math' | 'callout' | 'list' | 'table' | 'divider' | 'empty' | 'p';
    rawText: string;
    content: string;
    lineStart: number;
    lineEnd: number;
    isOrdered?: boolean;
    tableData?: { headers: string[]; rows: string[][] };
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

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

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

      // 3. Bloque de Cita / Callout (> ...)
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

      // 5. Separador
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
        const match = line.match(/^(\d+\.)\s+(.*)/);
        result.push({
          id: `block-${result.length}`,
          type: 'list',
          rawText: line,
          content: match ? match[2] : line,
          isOrdered: true,
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

  // Parseo estructurado en bloques interactivos Live Preview
  let liveBlocks = $derived.by(() => parseDocumentToLiveBlocks(content));

  // Estimación de altura en píxeles de cada bloque para paginación A4 precisa
  function estimateBlockHeight(b: LiveBlock): number {
    if (b.type === 'h1') return 72;
    if (b.type === 'h2') return 58;
    if (b.type === 'h3') return 48;
    if (b.type === 'divider') return 0; // Provoca salto de página
    if (b.type === 'empty') return 24;
    if (b.type === 'list') {
      const lines = Math.max(1, Math.ceil((b.content || '').length / 70));
      return lines * 28 + 6;
    }
    if (b.type === 'math') {
      const lineCount = (b.content || '').split('\n').length;
      return Math.max(90, 60 + lineCount * 26);
    }
    if (b.type === 'table') {
      const rows = b.tableData?.rows.length ?? 2;
      return 45 + rows * 36 + 20;
    }
    if (b.type === 'callout') {
      const lines = Math.max(1, Math.ceil((b.content || '').length / 70));
      return 36 + lines * 26;
    }
    // Párrafo normal (p)
    const textLen = (b.content || '').length;
    const lines = Math.max(1, Math.ceil(textLen / 70));
    return lines * 28 + 10;
  }

  // Paginación realista de hojas A4
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
      // La hoja 1 incluye el banner de título y autor (~150px), por lo que tiene ~720px útiles frente a ~870px en hojas posteriores
      const maxPageHeight = pageNum === 1 ? 720 : 870;

      if (currentHeight + h > maxPageHeight && currentPageBlocks.length > 0) {
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
    let rendered = text
      .replace(/\$([^\$\n]+)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `$${math}$`;
        }
      })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-sm bg-black/10 dark:bg-white/10 font-mono text-[13px]">$1</code>');

    if (showFindBar && findQuery.trim()) {
      const q = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flags = matchCase ? 'g' : 'gi';
      rendered = rendered.replace(new RegExp(`(?![^<]*>)(${q})`, flags), '<mark class="bg-amber-400/50 text-inherit rounded-[2px] px-0.5">$1</mark>');
    }

    return rendered;
  }

  function renderKaTeXBlock(tex: string): string {
    try {
      return katex.renderToString(tex, { displayMode: true, throwOnError: false });
    } catch {
      return `<div class="text-rose-400 font-mono text-xs">${tex}</div>`;
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
      if (action === 'h1') content += (content.endsWith('\n') ? '' : '\n') + '# Nuevo Título\n';
      else if (action === 'h2') content += (content.endsWith('\n') ? '' : '\n') + '## Nuevo Subtítulo\n';
      else if (action === 'math') openMathEditor();
      else if (action === 'table') showTableModal = true;
      else if (action === 'image') content += (content.endsWith('\n') ? '' : '\n') + '![Descripción de la imagen](ruta/o/enlace.png)\n';
      else if (action === 'callout') content += (content.endsWith('\n') ? '' : '\n') + '> Nota importante...\n';
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
    else if (action === 'math') { openMathEditor(); return; }
    else if (action === 'table') { showTableModal = true; return; }
    else if (action === 'image') inserted = '![Descripción](imagen.png)';
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
      else if (action === 'quote') content += '\n> Nota\n';
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
      slashMenuX = Math.min(Math.max(20, rect.left + 30), window.innerWidth - 340);
      slashMenuY = Math.min(rect.bottom + 10, window.innerHeight - 300);
    } else {
      showSlashMenu = false;
    }
  }

  function getBlockEditorClass(type: LiveBlock['type']): string {
    switch (type) {
      case 'h1':
        return `text-2xl md:text-3xl font-bold tracking-tight ${activeTheme.titleClass}`;
      case 'h2':
        return `text-xl md:text-2xl font-bold tracking-tight ${activeTheme.titleClass}`;
      case 'h3':
        return `text-lg md:text-xl font-semibold tracking-tight ${activeTheme.titleClass}`;
      case 'math':
        return 'font-mono text-sm leading-relaxed text-indigo-300';
      case 'table':
        return 'font-mono text-xs leading-relaxed text-slate-200';
      case 'callout':
        return 'text-sm italic pl-2 border-l-2 border-indigo-400 text-slate-300';
      case 'divider':
        return 'text-xs font-mono text-center opacity-60';
      default:
        return `text-[15px] leading-[1.85] ${activeTheme.textClass}`;
    }
  }

  function getBlockTypeLabel(type: LiveBlock['type']): string {
    switch (type) {
      case 'h1': return 'Título H1';
      case 'h2': return 'Subtítulo H2';
      case 'h3': return 'Sección H3';
      case 'math': return 'Ecuación KaTeX';
      case 'table': return 'Tabla Markdown';
      case 'callout': return 'Nota / Callout';
      case 'list': return 'Elemento de lista';
      case 'divider': return 'Separador';
      case 'empty': return 'Línea en blanco';
      default: return 'Párrafo';
    }
  }
</script>

<!-- Entorno de Trabajo: Mesa de Trabajo Limpia Estilo Microsoft Word -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
  class="h-full w-full flex flex-col items-center {activeTheme.deskClass} overflow-y-auto select-text transition-colors duration-200 py-10 px-4 md:px-12 relative"
  onmouseup={checkSelection}
>

  <!-- HOJAS FÍSICAS A4 PAGINADAS (ESTILO MICROSOFT WORD / GOOGLE DOCS) -->
  {#each pages as page, pageIndex (page.pageNumber)}
    <div 
      data-paper-page={pageIndex}
      class="w-full max-w-[820px] min-h-[1154px] rounded-[2px] {activeTheme.sheetClass} px-14 py-16 flex flex-col relative transition-all duration-200 mb-12 shadow-2xl"
    >
      {#if showCropMarks}
        <div class="absolute top-5 left-5 w-3 h-3 border-t border-l {activeTheme.cropClass} pointer-events-none"></div>
        <div class="absolute top-5 right-5 w-3 h-3 border-t border-r {activeTheme.cropClass} pointer-events-none"></div>
        <div class="absolute bottom-5 left-5 w-3 h-3 border-b border-l {activeTheme.cropClass} pointer-events-none"></div>
        <div class="absolute bottom-5 right-5 w-3 h-3 border-b border-r {activeTheme.cropClass} pointer-events-none"></div>
      {/if}

      <!-- Running Header Superior de la Hoja -->
      <div class="flex items-center justify-between text-[11px] {activeTheme.mutedClass} uppercase tracking-widest font-mono pb-3 mb-6 border-b {activeTheme.borderClass}">
        <span class="truncate max-w-sm font-medium">{title || 'Documento Sin Título'}</span>
        <span class="text-[10px] opacity-60 font-mono">{pageIndex === 0 ? '' : `Hoja ${page.pageNumber} de ${pages.length}`}</span>
      </div>

      <!-- Título de la Hoja (sólo en la Página 1) -->
      {#if pageIndex === 0}
        <div class="mb-8 text-center space-y-2 border-b {activeTheme.borderClass} pb-6">
          <input 
            type="text" 
            bind:value={title}
            class="w-full text-2xl md:text-3xl font-bold {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} {activeTheme.titleClass} bg-transparent border-none outline-hidden focus:ring-0 text-center tracking-tight"
            placeholder="Título del Documento"
          />
          <div class="text-xs {activeTheme.mutedClass} {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} flex items-center justify-center gap-2 pt-1">
            <span>{author || 'Autor'}</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      {/if}

      <!-- Bloques Interactivos Live Preview de esta Hoja -->
      <div class="flex-1 flex flex-col space-y-2 {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'}">
        {#each page.blocks as block (block.id)}
          {#if activeBlockId === block.id}
            <!-- MODO EDICIÓN EN VIVO: Campo autoexpandible con markdown crudo (# Titulo, $$formula$$, etc.) -->
            <div class="relative w-full rounded-xs bg-indigo-500/5 ring-1 ring-indigo-500/30 p-2 transition-all">
              <textarea
                bind:this={activeTextareaRef}
                bind:value={blockDraftText}
                oninput={handleActiveInput}
                onkeydown={(e) => handleActiveKeyDown(e, block)}
                onblur={() => commitBlock(block)}
                rows={1}
                class="w-full bg-transparent border-none outline-hidden resize-none p-0 focus:ring-0 {getBlockEditorClass(block.type)} overflow-hidden"
                placeholder="Escribe en este bloque..."
              ></textarea>
              <div class="flex items-center justify-between text-[10px] {activeTheme.mutedClass} pt-1 select-none font-mono opacity-60">
                <span>{getBlockTypeLabel(block.type)}</span>
                <span>Esc / clic fuera para previsualizar • Enter para siguiente línea</span>
              </div>
            </div>
          {:else}
            <!-- MODO PREVISUALIZACIÓN EN VIVO: Renderizado visual formateado (sin #, KaTeX renderizado, etc.) -->
            <div 
              id={block.id}
              role="button"
              tabindex="0"
              onclick={() => startEditing(block)}
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEditing(block); }}
              class="group relative py-1 px-1.5 -mx-1.5 rounded-xs hover:ring-1 hover:ring-indigo-400/30 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-all cursor-text"
              title="Haz clic para editar este bloque"
            >
              {#if block.type === 'h1'}
                <h2 class="text-2xl md:text-3xl font-bold tracking-tight {activeTheme.titleClass} border-b {activeTheme.borderClass} pb-2 pt-2">
                  {@html renderInlineMath(block.content)}
                </h2>
              {:else if block.type === 'h2'}
                <h3 class="text-xl md:text-2xl font-bold tracking-tight {activeTheme.titleClass} pb-1 pt-2">
                  {@html renderInlineMath(block.content)}
                </h3>
              {:else if block.type === 'h3'}
                <h4 class="text-lg md:text-xl font-semibold tracking-tight {activeTheme.titleClass} pb-0.5 pt-1">
                  {@html renderInlineMath(block.content)}
                </h4>
              {:else if block.type === 'callout'}
                <div class="p-4 rounded-xs border-l-4 {activeTheme.calloutClass} text-sm my-2 italic">
                  {@html renderInlineMath(block.content)}
                </div>
              {:else if block.type === 'math'}
                <div class="my-4 py-3 text-center text-lg rounded-xs transition-colors {activeTheme.hoverMathClass}">
                  {@html renderKaTeXBlock(block.content)}
                </div>
              {:else if block.type === 'table' && block.tableData}
                <div class="my-4 overflow-x-auto rounded-xs border {activeTheme.borderClass}">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="bg-black/5 dark:bg-white/5 font-semibold {activeTheme.titleClass}">
                      <tr>
                        {#each block.tableData.headers as h}
                          <th class="p-3 border-b {activeTheme.borderClass}">{@html renderInlineMath(h)}</th>
                        {/each}
                      </tr>
                    </thead>
                    <tbody>
                      {#each block.tableData.rows as row, rIdx}
                        <tr class="{rIdx % 2 === 1 ? 'bg-black/[0.02] dark:bg-white/[0.02]' : ''}">
                          {#each row as cell}
                            <td class="p-3 border-b {activeTheme.borderClass} border-dashed {activeTheme.textClass}">{@html renderInlineMath(cell)}</td>
                          {/each}
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {:else if block.type === 'list'}
                <div class="flex items-start gap-2.5 ml-3 my-1">
                  <span class="text-indigo-400 select-none text-base leading-[1.85]">{block.isOrdered ? `${block.id.split('-')[1] || '1'}.` : '•'}</span>
                  <span class="leading-[1.85] {activeTheme.textClass}">{@html renderInlineMath(block.content)}</span>
                </div>
              {:else if block.type === 'divider'}
                <div class="py-4 flex items-center justify-center">
                  <hr class="w-full border-t {activeTheme.borderClass}" />
                </div>
              {:else if block.type === 'empty'}
                <div class="h-6 w-full cursor-text hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-xs transition-colors"></div>
              {:else}
                <p class="leading-[1.85] text-justify {activeTheme.textClass}">
                  {@html renderInlineMath(block.content)}
                </p>
              {/if}

              <!-- Indicador sutil al pasar el mouse por encima -->
              <span class="absolute right-2 top-2 opacity-0 group-hover:opacity-40 text-[10px] uppercase font-mono pointer-events-none transition-opacity">
                {getBlockTypeLabel(block.type)} • Clic para editar
              </span>
            </div>
          {/if}
        {/each}

        <!-- Zona de continuación sólo en la última página -->
        {#if pageIndex === pages.length - 1}
          <div 
            role="button"
            tabindex="0"
            onclick={appendNewBlock}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') appendNewBlock(); }}
            class="flex-1 min-h-[100px] w-full cursor-text py-4 text-xs {activeTheme.mutedClass} opacity-40 hover:opacity-80 transition-opacity flex items-start"
            title="Haz clic para continuar redactando..."
          >
            <span>Haz clic aquí para añadir contenido... (teclea '/' para comandos rápidos)</span>
          </div>
        {/if}
      </div>

      <!-- Running Footer Inferior de cada Hoja -->
      <div class="pt-8 text-center text-xs {activeTheme.mutedClass} {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} border-t {activeTheme.borderClass} mt-auto flex items-center justify-between">
        <span class="text-[10px] font-mono opacity-50 truncate max-w-[200px]">{author || ''}</span>
        <span class="font-bold tracking-wider font-mono text-[11px]">— {page.pageNumber} —</span>
        <span class="text-[10px] font-mono opacity-50">{pages.length > 1 ? `${page.pageNumber}/${pages.length}` : ''}</span>
      </div>
    </div>
  {/each}

  <!-- Barra de Búsqueda y Reemplazo Global (siempre accesible) -->
  {#if showFindBar}
    <div class="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[min(680px,95vw)]">
      <div class="flex flex-col gap-2 rounded-md border border-white/10 bg-[#161b22] shadow-2xl p-2 backdrop-blur-sm">
        <div class="flex items-center gap-2">
          <input
            class="paper-find-input flex-1 px-2.5 py-1 rounded-xs bg-[#0d1117] border border-white/10 text-slate-200 text-xs outline-none focus:border-indigo-400/60"
            placeholder="Buscar..."
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
          <div class="flex items-center gap-2">
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

<!-- Contenedor Oficial Autónomo para Exportación a PDF (Fondo blanco editorial puro y alta definición) -->
<div id="layratex-pdf-render-target" class="fixed -left-[9999px] top-0 pointer-events-none opacity-0 select-none" aria-hidden="true">
  {#each pages as page, pageIndex}
    <div 
      data-paper-page={pageIndex}
      class="w-[820px] min-h-[1154px] bg-white text-slate-900 px-16 py-20 flex flex-col relative"
      style="font-family: {fontStyle === 'serif' ? '\'Computer Modern\', \'CMU Serif\', \'Latin Modern Roman\', \'KaTeX_Main\', serif' : '\'CMU Sans Serif\', -apple-system, sans-serif'};"
    >
      <!-- Running Header Superior -->
      <div class="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-widest font-mono pb-4 mb-8 border-b border-slate-200">
        <span class="truncate max-w-sm">{title || 'Documento Técnico'}</span>
        <span>Hoja {page.pageNumber} de {pages.length}</span>
      </div>

      {#if pageIndex === 0}
        <div class="mb-10 text-center space-y-2 border-b border-slate-200 pb-8">
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">{title || 'Documento Sin Título'}</h1>
          <div class="text-xs text-slate-500 flex items-center justify-center gap-2 pt-1">
            <span>{author || 'Autor'}</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      {/if}

      <div class="space-y-5 text-slate-800 text-[15px] leading-[1.85] flex-1">
        {#each page.blocks as b}
          {#if b.type === 'h1'}
            <h2 class="text-xl font-bold pt-5 pb-1 tracking-tight border-b border-slate-200 text-slate-900">{b.content}</h2>
          {:else if b.type === 'h2'}
            <h3 class="text-lg font-semibold pt-3 pb-0.5 tracking-tight text-slate-900">{b.content}</h3>
          {:else if b.type === 'h3'}
            <h4 class="text-base font-medium pt-2 text-slate-900">{b.content}</h4>
          {:else if b.type === 'callout'}
            <div class="p-4 rounded-xs bg-slate-50 border-l-4 border-indigo-500 text-slate-700 text-sm my-3 italic">
              {@html renderInlineMath(b.content)}
            </div>
          {:else if b.type === 'math'}
            <div class="my-5 py-3 text-center text-lg">
              {@html renderKaTeXBlock(b.content)}
            </div>
          {:else if b.type === 'table' && b.tableData}
            <div class="my-6 overflow-x-auto rounded-xs border border-slate-200">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-50 font-semibold text-slate-900">
                  <tr>
                    {#each b.tableData.headers as h}
                      <th class="p-3 border-b border-slate-200">{@html renderInlineMath(h)}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each b.tableData.rows as row, rIdx}
                    <tr class="{rIdx % 2 === 1 ? 'bg-slate-50/50' : ''}">
                      {#each row as cell}
                        <td class="p-3 border-b border-slate-200 border-dashed text-slate-700">{@html renderInlineMath(cell)}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else if b.type === 'list'}
            <li class="ml-6 list-disc text-slate-800">{@html renderInlineMath(b.content)}</li>
          {:else if b.type === 'divider'}
            <hr class="border-t border-slate-200 my-6" />
          {:else if b.type === 'empty'}
            <div class="h-3"></div>
          {:else}
            <p class="leading-[1.85] text-justify text-slate-800">{@html renderInlineMath(b.content)}</p>
          {/if}
        {/each}
      </div>

      <div class="pt-10 text-center text-xs text-slate-400 border-t border-slate-200 mt-auto flex items-center justify-between">
        <span class="text-[10px] font-mono opacity-50 truncate max-w-[200px]">{author || ''}</span>
        <span class="font-bold tracking-wider font-mono text-[11px]">— {page.pageNumber} —</span>
        <span class="text-[10px] font-mono opacity-50">{pages.length > 1 ? `${page.pageNumber}/${pages.length}` : ''}</span>
      </div>
    </div>
  {/each}
</div>

<!-- Menú Slash Flotante con Posicionamiento Inteligente -->
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
