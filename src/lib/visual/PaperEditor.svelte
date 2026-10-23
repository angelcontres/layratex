<script lang="ts">
  import katex from 'katex';
  import { 
    Calculator, 
    Edit3,
    Eye,
    Plus,
    Maximize2,
    Minimize2,
    Type,
    FileText,
    Sparkles,
    Heading1,
    Heading2,
    Info,
    CornerDownRight
  } from '@lucide/svelte';
  import MathBuilderModal from './MathBuilderModal.svelte';
  import SlashMenu from './SlashMenu.svelte';
  import FloatingToolbar from './FloatingToolbar.svelte';

  let {
    content = $bindable(''),
    title = $bindable('Documento Sin Título'),
    author = $bindable('Autor'),
    fontStyle = $bindable<'serif' | 'sans'>('serif'),
    onStatsChange = (stats: { words: number; pages: number }) => {}
  } = $props();

  let textareaRef = $state<HTMLTextAreaElement | null>(null);
  let showMathModal = $state(false);
  let activeMathTex = $state('');
  let zenMode = $state(false);

  // Modo de interacción con la hoja:
  // 'edit': Escribir directamente sobre el papel
  // 'print': Hoja impresa final (renderizado completo KaTeX y maquetación de libro)
  let viewMode = $state<'edit' | 'print'>('edit');

  // Menú Slash Flotante
  let showSlashMenu = $state(false);
  let slashFilter = $state('');
  let slashMenuRef = $state<any>(null);

  // Floating Toolbar sobre texto seleccionado
  let showToolbar = $state(false);
  let toolbarX = $state(0);
  let toolbarY = $state(0);

  // Edición rápida en línea dentro de vista impresa
  let editingBlockId = $state<string | null>(null);

  interface SheetBlock {
    id: string;
    type: 'h1' | 'h2' | 'h3' | 'math' | 'callout' | 'list' | 'p' | 'divider';
    content: string;
  }

  // Parseo estructurado de bloques del documento
  let blocks = $derived.by(() => {
    const lines = content.split('\n');
    const result: SheetBlock[] = [];
    let inMath = false;
    let mathAcc: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

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
        // Salto de página explícito
        result.push({ pageNumber: pageNum++, blocks: currentPageBlocks });
        currentPageBlocks = [];
        currentWordCount = 0;
        continue;
      }

      const blockWords = b.content.split(/\s+/).filter(Boolean).length;
      // Una hoja A4 clásica con fuente 12pt alberga aprox 350 palabras antes de saltar
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
      return `<div class="text-rose-500 font-mono text-xs">${tex}</div>`;
    }
  }

  function openMathEditor(currentTex: string = '') {
    activeMathTex = currentTex || 'v = \\frac{\\Delta x}{\\Delta t}';
    showMathModal = true;
  }

  function handleInsertFormula(newTex: string) {
    const formulaBlock = `\n$$\n${newTex}\n$$\n`;
    content += formulaBlock;
  }

  function handleSelectSlashAction(action: string) {
    showSlashMenu = false;
    if (action === 'h1') content += '\n# Nuevo Título\n';
    else if (action === 'h2') content += '\n## Nuevo Subtítulo\n';
    else if (action === 'math') openMathEditor();
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

  function handleTextareaInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    const textBeforeCursor = target.value.substring(0, target.selectionStart);
    const matchSlash = textBeforeCursor.match(/\/([a-zA-Z0-9]*)$/);
    if (matchSlash) {
      showSlashMenu = true;
      slashFilter = matchSlash[1];
    } else {
      showSlashMenu = false;
    }
  }
</script>

<!-- Entorno de Trabajo Minimalista: Mesa de Trabajo con Textura Studio -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
  class="h-full flex flex-col items-center paper-desk dark:paper-desk-dark overflow-y-auto select-text transition-colors relative {zenMode ? 'fixed inset-0 z-50 p-6 md:p-12' : 'p-6 md:p-10'}"
  onmouseup={checkSelection}
>
  
  <!-- Barra de Herramientas Minimalista Flotante sobre la Mesa (Paper Ribbon) -->
  <div class="sticky top-2 z-30 mb-8 flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-white/90 dark:bg-[#161922]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-lg text-xs max-w-[820px] w-full transition-all">
    
    <!-- Grupo Izquierda: Modo de la Hoja -->
    <div class="flex items-center gap-1">
      <button 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer {viewMode === 'edit' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}"
        onclick={() => viewMode = 'edit'}
        title="Redacción directa sobre la hoja"
      >
        <Edit3 size={13} />
        <span>Redactar</span>
      </button>
      <button 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer {viewMode === 'print' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}"
        onclick={() => viewMode = 'print'}
        title="Ver hoja maquetada como documento impreso con KaTeX"
      >
        <Eye size={13} />
        <span>Vista Impresa</span>
      </button>
    </div>

    <!-- Divisor -->
    <div class="w-px h-4 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

    <!-- Grupo Centro: Inserción Rápida con 1 Clic -->
    <div class="flex items-center gap-1">
      <button 
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold transition-all cursor-pointer"
        onclick={() => openMathEditor()}
        title="Insertar ecuación matemática con clics"
      >
        <Calculator size={13} />
        <span>+ Fórmula fx</span>
      </button>

      <button 
        class="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 transition-colors cursor-pointer"
        onclick={() => content += '\n# Nuevo Título\n'}
        title="Insertar Título"
      >
        <Heading1 size={13} />
        <span>Título</span>
      </button>

      <button 
        class="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 transition-colors cursor-pointer"
        onclick={() => content += '\n> Nota o aviso importante...\n'}
        title="Insertar Nota"
      >
        <Info size={13} />
        <span>Nota</span>
      </button>

      <button 
        class="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 transition-colors cursor-pointer"
        onclick={() => content += '\n---\n'}
        title="Insertar Salto a Nueva Hoja A4"
      >
        <FileText size={13} />
        <span>+ Salto Hoja</span>
      </button>
    </div>

    <!-- Divisor -->
    <div class="w-px h-4 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

    <!-- Grupo Derecha: Tipografía & Zen -->
    <div class="flex items-center gap-1.5">
      <button 
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        onclick={() => fontStyle = fontStyle === 'serif' ? 'sans' : 'serif'}
        title="Cambiar tipografía de la hoja"
      >
        <Type size={13} />
        <span class="font-medium">{fontStyle === 'serif' ? 'Serif Clásica' : 'Sans Moderna'}</span>
      </button>

      <button 
        class="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        onclick={() => zenMode = !zenMode}
        title={zenMode ? 'Salir del Modo Concentración' : 'Modo Concentración (Zen)'}
      >
        {#if zenMode}
          <Minimize2 size={14} />
        {:else}
          <Maximize2 size={14} />
        {/if}
      </button>
    </div>

  </div>

  <!-- VISTA DE LAS HOJAS FÍSICAS (A4 CON DIMENSIONES REALES Y MARCAS DE CORTE) -->
  {#if viewMode === 'print'}
    
    <!-- Mapeo de Cada Hoja A4 Separada Físicamente -->
    <div class="flex flex-col items-center gap-10 w-full pb-16">
      {#each pages as page, pageIndex}
        <div 
          class="w-full max-w-[820px] min-h-[1154px] bg-white dark:bg-[#161821] rounded-[2px] paper-shadow dark:paper-shadow-dark px-16 py-20 flex flex-col relative transition-all"
        >
          <!-- Marcas de Corte en las 4 Esquinas (Crop Marks de Imprenta Profesional) -->
          <div class="absolute top-6 left-6 w-3 h-3 border-t border-l border-slate-300 dark:border-white/10 pointer-events-none"></div>
          <div class="absolute top-6 right-6 w-3 h-3 border-t border-r border-slate-300 dark:border-white/10 pointer-events-none"></div>
          <div class="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-slate-300 dark:border-white/10 pointer-events-none"></div>
          <div class="absolute bottom-6 right-6 w-3 h-3 border-b border-r border-slate-300 dark:border-white/10 pointer-events-none"></div>

          <!-- Running Header Superior de la Hoja -->
          <div class="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono pb-4 mb-8 border-b border-slate-100 dark:border-white/5">
            <span class="truncate max-w-sm">{title || 'Documento Técnico'}</span>
            <span>Hoja {page.pageNumber} de {pages.length}</span>
          </div>

          <!-- En la primera hoja se muestra el título institucional -->
          {#if pageIndex === 0}
            <div class="mb-10 text-center space-y-2 border-b border-slate-100 dark:border-white/5 pb-8">
              <input 
                type="text" 
                bind:value={title}
                class="w-full text-2xl md:text-3xl font-bold {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} text-slate-900 dark:text-white bg-transparent border-none outline-hidden focus:ring-0 text-center tracking-tight placeholder:text-slate-300"
                placeholder="Título del Documento"
              />
              <div class="text-xs text-slate-500 dark:text-slate-400 {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} flex items-center justify-center gap-2 pt-1">
                <span>{author || 'Autor'}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          {/if}

          <!-- Contenido Maquetado de la Hoja -->
          <div class="space-y-5 {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} text-slate-800 dark:text-slate-200 text-[15px] leading-[1.85] flex-1">
            {#each page.blocks as b}
              {#if b.type === 'h1'}
                <h2 class="text-xl font-bold text-slate-900 dark:text-white pt-5 pb-1 tracking-tight border-b border-slate-100 dark:border-white/5 {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'}">
                  {b.content}
                </h2>
              {:else if b.type === 'h2'}
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 pt-3 pb-0.5 tracking-tight {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'}">
                  {b.content}
                </h3>
              {:else if b.type === 'h3'}
                <h4 class="text-base font-medium text-slate-800 dark:text-slate-200 pt-2 {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'}">
                  {b.content}
                </h4>
              {:else if b.type === 'callout'}
                <div class="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border-l-4 border-indigo-500 text-slate-700 dark:text-slate-300 text-sm my-3 italic">
                  {@html renderInlineMath(b.content)}
                </div>
              {:else if b.type === 'math'}
                <div class="group my-5 py-3 text-center relative hover:bg-slate-50/70 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <div class="text-lg md:text-xl text-slate-900 dark:text-white overflow-x-auto">
                    {@html renderKaTeXBlock(b.content)}
                  </div>
                  <button 
                    class="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-2 text-[11px] text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#1a1d28] border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded-md shadow-xs hover:underline flex items-center gap-1 cursor-pointer"
                    onclick={() => openMathEditor(b.content)}
                    title="Editar fórmula matemática"
                  >
                    <Edit3 size={11} />
                    <span>editar fórmula</span>
                  </button>
                </div>
              {:else if b.type === 'list'}
                <li class="ml-6 list-disc text-slate-800 dark:text-slate-200">
                  {@html renderInlineMath(b.content)}
                </li>
              {:else if b.type === 'divider'}
                <hr class="border-t border-slate-200/80 dark:border-white/10 my-6" />
              {:else}
                <p class="leading-[1.85] text-slate-800 dark:text-slate-200 text-justify">
                  {@html renderInlineMath(b.content)}
                </p>
              {/if}
            {/each}
          </div>

          <!-- Running Footer Inferior Clásico de la Hoja -->
          <div class="pt-10 text-center text-xs text-slate-400 dark:text-slate-500 {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} border-t border-slate-100 dark:border-white/5 mt-auto flex items-center justify-between">
            <span class="text-[10px] text-slate-300 dark:text-slate-600 font-mono">Layratex • A4</span>
            <span class="font-bold tracking-wider">— {page.pageNumber} —</span>
            <span class="text-[10px] text-slate-300 dark:text-slate-600 font-mono">210 × 297 mm</span>
          </div>

        </div>

        <!-- Indicador de Salto de Hoja en la Mesa de Trabajo -->
        {#if pageIndex < pages.length - 1}
          <div class="flex items-center gap-3 text-slate-400 dark:text-slate-600 text-[10px] font-mono uppercase tracking-widest">
            <span class="w-12 h-px bg-slate-200 dark:bg-white/10"></span>
            <span>Fin de Hoja {page.pageNumber} • Inicio de Hoja {page.pageNumber + 1}</span>
            <span class="w-12 h-px bg-slate-200 dark:bg-white/10"></span>
          </div>
        {/if}
      {/each}
    </div>

  {:else}

    <!-- MODO REDACCIÓN DIRECTA EN LA HOJA DE PAPEL FÍSICA -->
    <div class="w-full max-w-[820px] min-h-[1154px] bg-white dark:bg-[#161821] rounded-[2px] paper-shadow dark:paper-shadow-dark px-16 py-20 flex flex-col relative transition-all mb-16">
      
      <!-- Marcas de Corte en las 4 Esquinas -->
      <div class="absolute top-6 left-6 w-3 h-3 border-t border-l border-slate-300 dark:border-white/10 pointer-events-none"></div>
      <div class="absolute top-6 right-6 w-3 h-3 border-t border-r border-slate-300 dark:border-white/10 pointer-events-none"></div>
      <div class="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-slate-300 dark:border-white/10 pointer-events-none"></div>
      <div class="absolute bottom-6 right-6 w-3 h-3 border-b border-r border-slate-300 dark:border-white/10 pointer-events-none"></div>

      <!-- Running Header Superior -->
      <div class="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono pb-4 mb-8 border-b border-slate-100 dark:border-white/5">
        <span class="truncate max-w-sm">{title || 'Documento Técnico'}</span>
        <span>Redacción en Vivo • Hoja A4</span>
      </div>

      <!-- Título de la Hoja -->
      <div class="mb-10 text-center space-y-2 border-b border-slate-100 dark:border-white/5 pb-8">
        <input 
          type="text" 
          bind:value={title}
          class="w-full text-2xl md:text-3xl font-bold {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} text-slate-900 dark:text-white bg-transparent border-none outline-hidden focus:ring-0 text-center tracking-tight placeholder:text-slate-300"
          placeholder="Título del Documento"
        />
        <div class="text-xs text-slate-500 dark:text-slate-400 {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} flex items-center justify-center gap-2 pt-1">
          <span>{author || 'Autor'}</span>
          <span>•</span>
          <span>{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <!-- Textarea de Redacción que Fluye Idéntico al Documento Impreso -->
      <div class="flex-1 flex flex-col">
        <textarea
          bind:this={textareaRef}
          bind:value={content}
          oninput={handleTextareaInput}
          class="w-full flex-1 bg-transparent border-none outline-hidden resize-none {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} text-slate-800 dark:text-slate-200 text-[15px] leading-[1.85] p-0 focus:ring-0 min-h-[700px]"
          placeholder="Escribe directamente en esta hoja de papel...&#10;&#10;• Teclea '/' para desplegar el menú de inserción de fórmulas, títulos y citas.&#10;• Selecciona cualquier texto para aplicar formato flotante (Negrita, Cursiva, fx)."
        ></textarea>
      </div>

      <!-- Running Footer Inferior -->
      <div class="pt-10 text-center text-xs text-slate-400 dark:text-slate-500 {fontStyle === 'serif' ? 'font-paper-serif' : 'font-paper-sans'} border-t border-slate-100 dark:border-white/5 mt-auto flex items-center justify-between">
        <span class="text-[10px] text-slate-300 dark:text-slate-600 font-mono">Layratex • A4</span>
        <span class="font-bold tracking-wider">— 1 —</span>
        <span class="text-[10px] text-slate-300 dark:text-slate-600 font-mono">210 × 297 mm</span>
      </div>

    </div>

  {/if}

</div>

<!-- Menú Slash Flotante -->
{#if showSlashMenu}
  <div class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
    <SlashMenu 
      bind:this={slashMenuRef}
      bind:isOpen={showSlashMenu}
      filter={slashFilter}
      onSelect={handleSelectSlashAction}
      onClose={() => showSlashMenu = false}
    />
  </div>
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
