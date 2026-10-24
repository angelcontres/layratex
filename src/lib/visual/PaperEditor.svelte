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
    viewMode = $bindable<'edit' | 'print'>('edit'),
    paperTone = $bindable<PaperTone>('dark'),
    onStatsChange = (stats: { words: number; pages: number }) => {}
  }: {
    content?: string;
    title?: string;
    author?: string;
    fontStyle?: 'serif' | 'sans';
    viewMode?: 'edit' | 'print';
    paperTone?: PaperTone;
    onStatsChange?: (stats: { words: number; pages: number }) => void;
  } = $props();

  let textareaRef = $state<HTMLTextAreaElement | null>(null);
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
  let highlightBackdropRef = $state<HTMLDivElement | null>(null);

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Genera el sombreado visual de coincidencias sin alterar la selección ni robar el foco
  let highlightedBackdropHtml = $derived.by(() => {
    if (!showFindBar || !findQuery || matches.length === 0) return '';
    const text = content || '';
    const len = findQuery.length;
    let html = '';
    let lastIdx = 0;

    for (let i = 0; i < matches.length; i++) {
      const matchStart = matches[i];
      if (matchStart > lastIdx) {
        html += escapeHtml(text.substring(lastIdx, matchStart));
      }
      const matchText = text.substring(matchStart, matchStart + len);
      const isCurrent = i === currentMatchIndex;
      const highlightClass = isCurrent
        ? 'bg-amber-400/50 ring-2 ring-amber-400/80 rounded-[2px]'
        : 'bg-amber-400/20 rounded-[2px]';
      html += `<mark class="${highlightClass} text-transparent select-none">${escapeHtml(matchText)}</mark>`;
      lastIdx = matchStart + len;
    }

    if (lastIdx < text.length) {
      html += escapeHtml(text.substring(lastIdx));
    }
    if (text.endsWith('\n')) {
      html += ' ';
    }
    return html;
  });

  let currentMatchLine = $derived.by(() => {
    if (matches.length === 0 || !content) return 0;
    const startPos = matches[currentMatchIndex] ?? 0;
    return content.substring(0, startPos).split('\n').length;
  });

  function closeFindBar() {
    const lastPos = matches.length > 0 ? matches[currentMatchIndex] : null;
    showFindBar = false;
    showReplace = false;
    matches = [];
    currentMatchIndex = 0;
    if (textareaRef) {
      textareaRef.focus();
      if (lastPos !== null) {
        // Coloca el cursor al inicio de la coincidencia sin seleccionarla para no sobreescribir
        textareaRef.setSelectionRange(lastPos, lastPos);
      }
    }
  }

  function findMatches() {
    const text = textareaRef?.value ?? content ?? '';
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
    if (!textareaRef || matches.length === 0) return;
    const text = textareaRef.value || content || '';
    const startPos = matches[currentMatchIndex];
    const before = text.substring(0, startPos);
    const lineIndex = before.split('\n').length - 1;
    const approxLineHeight = 28;
    const targetScroll = Math.max(0, (lineIndex - 4) * approxLineHeight);
    textareaRef.scrollTop = targetScroll;
    if (highlightBackdropRef) {
      highlightBackdropRef.scrollTop = targetScroll;
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
    if (!textareaRef || matches.length === 0 || !findQuery) return;
    const startPos = matches[currentMatchIndex];
    const len = findQuery.length;
    const text = textareaRef.value || content || '';
    const newText = text.substring(0, startPos) + replaceQuery + text.substring(startPos + len);
    content = newText;
    if (textareaRef) textareaRef.value = newText;
    findMatches();
  }

  function replaceAll() {
    if (!textareaRef || !findQuery) return;
    let text = textareaRef.value || content || '';
    if (!matchCase) {
      const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      text = text.replace(regex, replaceQuery);
    } else {
      const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      text = text.replace(regex, replaceQuery);
    }
    content = text;
    if (textareaRef) textareaRef.value = text;
    findMatches();
  }

  function handleTextareaScroll() {
    if (highlightBackdropRef && textareaRef) {
      highlightBackdropRef.scrollTop = textareaRef.scrollTop;
      highlightBackdropRef.scrollLeft = textareaRef.scrollLeft;
    }
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

  interface SheetBlock {
    id: string;
    type: 'h1' | 'h2' | 'h3' | 'math' | 'callout' | 'list' | 'numbered' | 'p' | 'divider' | 'table';
    content: string;
    tableData?: { headers: string[]; rows: string[][] };
  }

  // Parseo estructurado de bloques del documento
  let blocks = $derived.by(() => {
    const lines = content.split('\n');
    const result: SheetBlock[] = [];
    let inMath = false;
    let mathAcc: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Bloque de Ecuación Matemática $$ ... $$
      if (line.trim().startsWith('$$')) {
        if (!inMath) {
          inMath = true;
          mathAcc = [line.replace('$$', '')];
          if (line.trim().endsWith('$$') && line.trim().length > 2) {
            inMath = false;
            result.push({
              id: `math-${i}`,
              type: 'math',
              content: line.replace(/\$\$/g, '').trim()
            });
            mathAcc = [];
          }
        } else {
          inMath = false;
          mathAcc.push(line.replace('$$', ''));
          result.push({
            id: `math-${i}`,
            type: 'math',
            content: mathAcc.join('\n').trim()
          });
          mathAcc = [];
        }
        continue;
      }

      if (inMath) {
        mathAcc.push(line);
        continue;
      }

      // Bloque de Tabla Markdown (| Col | Col |)
      if (line.trim().startsWith('|')) {
        const tableLines = [line];
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
          i++;
          tableLines.push(lines[i]);
        }
        if (tableLines.length >= 2) {
          const parseRow = (l: string) => l.split('|').slice(1, -1).map(c => c.trim());
          const headers = parseRow(tableLines[0]);
          const isDiv = tableLines[1].replace(/[\s|:-]/g, '') === '';
          const startIdx = isDiv ? 2 : 1;
          const rows: string[][] = [];
          for (let j = startIdx; j < tableLines.length; j++) {
            const r = parseRow(tableLines[j]);
            if (r.length > 0 && !r.every(c => !c)) {
              rows.push(r);
            }
          }
          result.push({
            id: `table-${i}`,
            type: 'table',
            content: tableLines.join('\n'),
            tableData: { headers, rows }
          });
          continue;
        }
      }

      if (line.startsWith('# ')) {
        result.push({ id: `h1-${i}`, type: 'h1', content: line.substring(2).trim() });
      } else if (line.startsWith('## ')) {
        result.push({ id: `h2-${i}`, type: 'h2', content: line.substring(3).trim() });
      } else if (line.startsWith('### ')) {
        result.push({ id: `h3-${i}`, type: 'h3', content: line.substring(4).trim() });
      } else if (line.startsWith('> ')) {
        result.push({ id: `quote-${i}`, type: 'callout', content: line.substring(2).trim() });
      } else if (line.startsWith('* ')) {
        result.push({ id: `list-${i}`, type: 'list', content: line.substring(2).trim() });
      } else if (line.trim() === '---') {
        result.push({ id: `div-${i}`, type: 'divider', content: '' });
      } else if (line.trim()) {
        result.push({ id: `p-${i}`, type: 'p', content: line.trim() });
      }
    }

    return result;
  });

  // Paginación realista de hojas A4
  interface SheetPage {
    pageNumber: number;
    blocks: SheetBlock[];
  }

  let pages = $derived.by(() => {
    const result: SheetPage[] = [];
    let currentPageBlocks: SheetBlock[] = [];
    let currentWordCount = 0;
    let pageNum = 1;

    for (const b of blocks) {
      if (b.type === 'divider') {
        result.push({ pageNumber: pageNum++, blocks: currentPageBlocks });
        currentPageBlocks = [];
        currentWordCount = 0;
        continue;
      }

      const blockWords = b.content.split(/\s+/).filter(Boolean).length;
      if (currentWordCount + blockWords > 380 && currentPageBlocks.length > 0) {
        result.push({ pageNumber: pageNum++, blocks: currentPageBlocks });
        currentPageBlocks = [b];
        currentWordCount = blockWords;
      } else {
        currentPageBlocks.push(b);
        currentWordCount += blockWords;
      }
    }

    result.push({ pageNumber: pageNum, blocks: currentPageBlocks });
    return result;
  });

  // Métricas
  $effect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    const estimatedPages = Math.max(1, pages.length);
    onStatsChange({ words, pages: estimatedPages });
  });

  function renderInlineMath(text: string): string {
    return text.replace(/\$([^\$\n]+)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `$${math}$`;
      }
    }).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
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
    const formulaBlock = `\n$$\n${newTex}\n$$\n`;
    content += formulaBlock;
  }

  function handleInsertTable(tableMd: string) {
    content += tableMd;
  }

  function handleSelectSlashAction(action: string) {
    showSlashMenu = false;
    if (action === 'h1') content += '\n# Nuevo Título\n';
    else if (action === 'h2') content += '\n## Nuevo Subtítulo\n';
    else if (action === 'math') openMathEditor();
    else if (action === 'table') showTableModal = true;
    else if (action === 'image') content += '\n![Descripción de la imagen](ruta/o/enlace.png)\n';
    else if (action === 'callout') content += '\n> Nota importante...\n';
    else if (action === 'bullet') content += '\n* Elemento de lista\n';
    else if (action === 'numbered') content += '\n1. Primer paso\n2. Segundo paso\n';
    else if (action === 'divider') content += '\n---\n';
  }

  function handleFormat(action: string) {
    if (!textareaRef) return;
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selected = content.substring(start, end);

    let replacement = '';
    if (action === 'bold') replacement = `**${selected || 'texto'}**`;
    else if (action === 'italic') replacement = `*${selected || 'texto'}*`;
    else if (action === 'math') replacement = `$${selected || 'x'}\$`;
    else if (action === 'h1') replacement = `\n# ${selected || 'Título'}\n`;
    else if (action === 'h2') replacement = `\n## ${selected || 'Subtítulo'}\n`;
    else if (action === 'quote') replacement = `\n> ${selected || 'Nota'}\n`;

    content = content.substring(0, start) + replacement + content.substring(end);
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

  function handleTextareaKeyDown(e: KeyboardEvent) {
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

    // Atajos de formato universales
    if (isMod && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      handleFormat('bold');
    } else if (isMod && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      handleFormat('italic');
    } else if (isMod && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      openMathEditor();
    }
  }

  function handleTextareaInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    const textBeforeCursor = target.value.substring(0, target.selectionStart);
    const matchSlash = textBeforeCursor.match(/\/([a-zA-Z0-9]*)$/);
    if (matchSlash) {
      showSlashMenu = true;
      slashFilter = matchSlash[1];

      // Calcular posición aproximada del cursor dentro del textarea
      const rect = target.getBoundingClientRect();
      const lines = textBeforeCursor.split('\n');
      const currentLineIndex = lines.length - 1;
      const currentLineText = lines[currentLineIndex];
      const approxLineHeight = 28;
      const approxCharWidth = 8.5;

      const calculatedY = rect.top + (currentLineIndex * approxLineHeight) + 36;
      const calculatedX = Math.min(rect.left + (currentLineText.length * approxCharWidth) + 20, window.innerWidth - 340);

      if (calculatedY > 0 && calculatedY < window.innerHeight - 300) {
        slashMenuX = Math.max(20, calculatedX);
        slashMenuY = calculatedY;
      } else {
        slashMenuX = null;
        slashMenuY = null;
      }
    } else {
      showSlashMenu = false;
    }
  }
</script>

<!-- Entorno de Trabajo: Mesa de Trabajo Limpia Sin Barras Flotantes que Tapen la Hoja -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
  class="h-full w-full flex flex-col items-center {activeTheme.deskClass} overflow-y-auto select-text transition-colors duration-200 py-10 px-4 md:px-12"
  onmouseup={checkSelection}
>

  <!-- VISTA DE LAS HOJAS FÍSICAS (A4 CON DIMENSIONES REALES Y MARCAS DE CORTE) -->
  {#if viewMode === 'print'}
    
    <!-- Mapeo de Cada Hoja A4 Separada Físicamente -->
    <div class="flex flex-col items-center gap-10 w-full pb-16">
      {#each pages as page, pageIndex}
        <div 
          data-paper-page={pageIndex}
          class="w-full max-w-[820px] min-h-[1154px] rounded-[3px] {activeTheme.sheetClass} px-16 py-20 flex flex-col relative transition-all duration-200"
        >
          <!-- Marcas de Corte en las 4 Esquinas (Crop Marks de Imprenta Profesional) -->
          <div class="absolute top-6 left-6 w-3 h-3 border-t border-l {activeTheme.cropClass} pointer-events-none"></div>
          <div class="absolute top-6 right-6 w-3 h-3 border-t border-r {activeTheme.cropClass} pointer-events-none"></div>
          <div class="absolute bottom-6 left-6 w-3 h-3 border-b border-l {activeTheme.cropClass} pointer-events-none"></div>
          <div class="absolute bottom-6 right-6 w-3 h-3 border-b border-r {activeTheme.cropClass} pointer-events-none"></div>

          <!-- Running Header Superior de la Hoja -->
          <div class="flex items-center justify-between text-[11px] {activeTheme.mutedClass} uppercase tracking-widest font-mono pb-4 mb-8 border-b {activeTheme.borderClass}">
            <span class="truncate max-w-sm">{title || 'Documento Técnico'}</span>
            <span>Hoja {page.pageNumber} de {pages.length}</span>
          </div>

          <!-- En la primera hoja se muestra el título institucional -->
          {#if pageIndex === 0}
            <div class="mb-10 text-center space-y-2 border-b {activeTheme.borderClass} pb-8">
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

          <!-- Contenido Maquetado de la Hoja -->
          <div class="space-y-5 {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} {activeTheme.textClass} text-[15px] leading-[1.85] flex-1">
            {#each page.blocks as b}
              {#if b.type === 'h1'}
                <h2 class="text-xl font-bold pt-5 pb-1 tracking-tight border-b {activeTheme.borderClass} {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'}">
                  {b.content}
                </h2>
              {:else if b.type === 'h2'}
                <h3 class="text-lg font-semibold pt-3 pb-0.5 tracking-tight {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'}">
                  {b.content}
                </h3>
              {:else if b.type === 'h3'}
                <h4 class="text-base font-medium pt-2 {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'}">
                  {b.content}
                </h4>
              {:else if b.type === 'callout'}
                <div class="p-4 rounded-xl {activeTheme.calloutClass} border-l-4 text-sm my-3 italic">
                  {@html renderInlineMath(b.content)}
                </div>
              {:else if b.type === 'math'}
                <!-- Ecuación KaTeX con soporte de doble clic para editar -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div 
                  class="group my-5 py-3 text-center relative {activeTheme.hoverMathClass} rounded-xl transition-colors cursor-pointer"
                  ondblclick={() => openMathEditor(b.content)}
                  title="Doble clic para editar esta fórmula con botones"
                >
                  <div class="text-lg md:text-xl overflow-x-auto">
                    {@html renderKaTeXBlock(b.content)}
                  </div>
                  <button 
                    class="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-2 text-[11px] text-indigo-400 bg-black/40 border border-indigo-400/30 px-2 py-0.5 rounded-md shadow-xs hover:underline flex items-center gap-1 cursor-pointer"
                    onclick={(e) => { e.stopPropagation(); openMathEditor(b.content); }}
                    title="Editar fórmula matemática"
                  >
                    <Edit3 size={11} />
                    <span>editar</span>
                  </button>
                </div>
              {:else if b.type === 'table' && b.tableData}
                <!-- Renderizado de Tabla Elegante -->
                <div class="my-6 overflow-x-auto rounded-xl border {activeTheme.borderClass}">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="bg-black/5 dark:bg-white/5 font-semibold">
                      <tr>
                        {#each b.tableData.headers as h}
                          <th class="p-3 border-b {activeTheme.borderClass}">
                            {@html renderInlineMath(h)}
                          </th>
                        {/each}
                      </tr>
                    </thead>
                    <tbody>
                      {#each b.tableData.rows as row, rIdx}
                        <tr class="{rIdx % 2 === 1 ? 'bg-black/[0.02] dark:bg-white/[0.02]' : ''}">
                          {#each row as cell}
                            <td class="p-3 border-b {activeTheme.borderClass} border-dashed">
                              {@html renderInlineMath(cell)}
                            </td>
                          {/each}
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {:else if b.type === 'list'}
                <li class="ml-6 list-disc">
                  {@html renderInlineMath(b.content)}
                </li>
              {:else if b.type === 'divider'}
                <hr class="border-t {activeTheme.borderClass} my-6" />
              {:else}
                <p class="leading-[1.85] text-justify">
                  {@html renderInlineMath(b.content)}
                </p>
              {/if}
            {/each}
          </div>

          <!-- Running Footer Inferior Clásico de la Hoja -->
          <div class="pt-10 text-center text-xs {activeTheme.mutedClass} {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} border-t {activeTheme.borderClass} mt-auto flex items-center justify-between">
            <span class="text-[10px] font-mono opacity-60">Layratex • A4</span>
            <span class="font-bold tracking-wider">— {page.pageNumber} —</span>
            <span class="text-[10px] font-mono opacity-60">210 × 297 mm</span>
          </div>

        </div>

        <!-- Indicador de Salto de Hoja en la Mesa de Trabajo -->
        {#if pageIndex < pages.length - 1}
          <div class="flex items-center gap-3 {activeTheme.mutedClass} text-[10px] font-mono uppercase tracking-widest opacity-60">
            <span class="w-12 h-px bg-current opacity-20"></span>
            <span>Fin de Hoja {page.pageNumber} • Inicio de Hoja {page.pageNumber + 1}</span>
            <span class="w-12 h-px bg-current opacity-20"></span>
          </div>
        {/if}
      {/each}
    </div>

  {:else}

    <!-- MODO REDACCIÓN DIRECTA EN LA HOJA DE PAPEL FÍSICA -->
    <div class="w-full max-w-[820px] min-h-[1154px] rounded-[3px] {activeTheme.sheetClass} px-16 py-20 flex flex-col relative transition-all duration-200 mb-16">
      
      <!-- Marcas de Corte en las 4 Esquinas -->
      <div class="absolute top-6 left-6 w-3 h-3 border-t border-l {activeTheme.cropClass} pointer-events-none"></div>
      <div class="absolute top-6 right-6 w-3 h-3 border-t border-r {activeTheme.cropClass} pointer-events-none"></div>
      <div class="absolute bottom-6 left-6 w-3 h-3 border-b border-l {activeTheme.cropClass} pointer-events-none"></div>
      <div class="absolute bottom-6 right-6 w-3 h-3 border-b border-r {activeTheme.cropClass} pointer-events-none"></div>

      <!-- Running Header Superior -->
      <div class="flex items-center justify-between text-[11px] {activeTheme.mutedClass} uppercase tracking-widest font-mono pb-4 mb-8 border-b {activeTheme.borderClass}">
        <span class="truncate max-w-sm">{title || 'Documento Técnico'}</span>
        <span>Redacción en Vivo • {activeTheme.name}</span>
      </div>

      <!-- Título de la Hoja -->
      <div class="mb-10 text-center space-y-2 border-b {activeTheme.borderClass} pb-8">
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

      <!-- Textarea de Redacción con Soporte de Atajos de Teclado y Sombreado de Coincidencias -->
      <div class="flex-1 flex flex-col relative min-h-[700px]">
        {#if showFindBar && findQuery && matches.length > 0}
          <div
            bind:this={highlightBackdropRef}
            aria-hidden="true"
            class="absolute inset-0 pointer-events-none overflow-hidden select-none whitespace-pre-wrap break-words {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} text-[15px] leading-[1.85] p-0 text-transparent"
          >
            {@html highlightedBackdropHtml}
          </div>
        {/if}
        <textarea
          bind:this={textareaRef}
          bind:value={content}
          onscroll={handleTextareaScroll}
          oninput={handleTextareaInput}
          onkeydown={handleTextareaKeyDown}
          class="w-full flex-1 bg-transparent border-none outline-hidden resize-none {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} {activeTheme.textClass} text-[15px] leading-[1.85] p-0 focus:ring-0 min-h-[700px] placeholder:opacity-40 relative z-10"
          placeholder="Escribe directamente en esta hoja de papel...&#10;&#10;Consejos rápidos:&#10;• Teclea '/' para desplegar el menú de inserción de fórmulas, tablas, títulos y notas.&#10;• Selecciona texto para aplicar negrita, cursiva o formato matemático.&#10;• Usa atajos rápidos: Ctrl+B (Negrita), Ctrl+I (Cursiva), Ctrl+E (Fórmula fx)."
        ></textarea>
      </div>
      <!-- Running Footer Inferior -->
      <div class="pt-10 text-center text-xs {activeTheme.mutedClass} {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} border-t {activeTheme.borderClass} mt-auto flex items-center justify-between">
        <span class="text-[10px] font-mono opacity-60">Layratex • A4</span>
        <span class="font-bold tracking-wider">— 1 —</span>
        <span class="text-[10px] font-mono opacity-60">210 × 297 mm</span>
      </div>

      <!-- Barra de Búsqueda y Reemplazo Global (reutilizable, siempre accesible) -->
      {#if showFindBar}
        <div class="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[min(680px,95vw)]">
          <div class="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#161b22] shadow-2xl p-2 backdrop-blur-sm">
            <div class="flex items-center gap-2">
              <input
                class="paper-find-input flex-1 px-2 py-1 rounded-lg bg-[#0d1117] border border-white/10 text-slate-200 text-xs outline-none focus:border-indigo-400/60"
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
              <button type="button" class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors flex items-center justify-center" onclick={prevMatch} title="Anterior (Shift+Enter)"><ChevronLeft size={13} /></button>
              <button type="button" class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors flex items-center justify-center" onclick={nextMatch} title="Siguiente (Enter)"><ChevronRight size={13} /></button>
              <span class="text-[10px] text-slate-400 font-mono min-w-[75px] text-center">{matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length} (L.${currentMatchLine})` : (findQuery ? '0 / 0' : '—')}</span>
              <label class="flex items-center gap-1 text-[10px] text-slate-400">
                <input type="checkbox" bind:checked={matchCase} onchange={() => findMatches()} />
                Aa
              </label>
              <button class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]" onclick={() => showReplace = !showReplace}>{showReplace ? 'Ocultar' : 'Reemplazar'}</button>
              <button type="button" class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center" onclick={closeFindBar} title="Cerrar (Esc)"><X size={13} /></button>
            </div>
            {#if showReplace}
              <div class="flex items-center gap-2">
                <input
                  class="flex-1 px-2 py-1 rounded-lg bg-[#0d1117] border border-white/10 text-slate-200 text-xs outline-none focus:border-indigo-400/60"
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
                <button class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]" onclick={replaceCurrent}>Reemplazar</button>
                <button class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]" onclick={replaceAll}>Reemplazar todo</button>
              </div>
            {/if}
          </div>
        </div>
      {/if}

    </div>

  {/if}

</div>

<!-- Contenedor Oficial Autónomo para Exportación a PDF (Fondo blanco editorial puro y alta definición) -->
<div id="layratex-pdf-render-target" class="fixed -left-[9999px] top-0 pointer-events-none opacity-0 select-none" aria-hidden="true">
  {#each pages as page, pageIndex}
    <div 
      data-paper-page={pageIndex}
      class="w-[820px] min-h-[1154px] bg-white text-slate-900 px-16 py-20 flex flex-col relative"
      style="font-family: {fontStyle === 'serif' ? 'serif' : 'sans-serif'};"
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
            <div class="p-4 rounded-xl bg-slate-50 border-l-4 border-indigo-500 text-slate-700 text-sm my-3 italic">
              {@html renderInlineMath(b.content)}
            </div>
          {:else if b.type === 'math'}
            <div class="my-5 py-3 text-center text-lg">
              {@html renderKaTeXBlock(b.content)}
            </div>
          {:else if b.type === 'table' && b.tableData}
            <div class="my-6 overflow-x-auto rounded-xl border border-slate-200">
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
          {:else}
            <p class="leading-[1.85] text-justify text-slate-800">{@html renderInlineMath(b.content)}</p>
          {/if}
        {/each}
      </div>

      <div class="pt-10 text-center text-xs text-slate-400 border-t border-slate-200 mt-auto flex items-center justify-between">
        <span class="text-[10px] font-mono opacity-60">Layratex • A4</span>
        <span class="font-bold tracking-wider">— {page.pageNumber} —</span>
        <span class="text-[10px] font-mono opacity-60">210 × 297 mm</span>
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
