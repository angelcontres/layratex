<script lang="ts">
  import katex from 'katex';
  import { 
    Calculator, 
    Sparkles, 
    Plus, 
    FileText, 
    Info, 
    HelpCircle,
    Edit3,
    Bold,
    Italic,
    Underline,
    Heading1,
    Heading2,
    Heading3,
    List,
    Quote,
    Check,
    GraduationCap,
    Briefcase,
    Mail,
    SlidersHorizontal
  } from '@lucide/svelte';
  import MathBuilderModal from './MathBuilderModal.svelte';
  import SlashMenu from './SlashMenu.svelte';
  import FloatingToolbar from './FloatingToolbar.svelte';

  let {
    content = $bindable(''),
    title = $bindable('Documento Sin Título'),
    author = $bindable('Estudiante / Redactor'),
    fontStyle = $bindable<'serif' | 'sans'>('serif'),
    onStatsChange = (stats: { words: number; pages: number }) => {}
  } = $props();

  let textareaRef: HTMLTextAreaElement;
  let showMathModal = $state(false);
  let activeMathTex = $state('');

  // Modo de edición en el papel: 'preview' (vista de lectura interactiva) vs 'edit' (redacción directa)
  let paperMode = $state<'split_view' | 'zen_edit'>('split_view');

  // Menú Slash
  let showSlashMenu = $state(false);
  let slashFilter = $state('');
  let slashMenuRef = $state<any>(null);

  // Floating Toolbar
  let showToolbar = $state(false);
  let toolbarX = $state(0);
  let toolbarY = $state(0);

  // Renderizador de bloques visuales
  interface RenderedBlock {
    id: string;
    type: 'h1' | 'h2' | 'h3' | 'math' | 'callout' | 'list' | 'p' | 'divider';
    raw: string;
    content: string;
  }

  let blocks = $derived.by(() => {
    const rawLines = content.split('\n');
    const result: RenderedBlock[] = [];
    let inMath = false;
    let mathAccumulator: string[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];

      if (line.trim().startsWith('$$')) {
        if (!inMath) {
          inMath = true;
          mathAccumulator = [line.replace('$$', '')];
          if (line.trim().endsWith('$$') && line.trim().length > 2) {
            inMath = false;
            result.push({
              id: `math-${i}`,
              type: 'math',
              raw: line,
              content: line.replace(/\$\$/g, '').trim()
            });
            mathAccumulator = [];
          }
        } else {
          inMath = false;
          mathAccumulator.push(line.replace('$$', ''));
          result.push({
            id: `math-${i}`,
            type: 'math',
            raw: '$$\n' + mathAccumulator.join('\n') + '\n$$',
            content: mathAccumulator.join('\n').trim()
          });
          mathAccumulator = [];
        }
        continue;
      }

      if (inMath) {
        mathAccumulator.push(line);
        continue;
      }

      if (line.startsWith('# ')) {
        result.push({ id: `h1-${i}`, type: 'h1', raw: line, content: line.substring(2).trim() });
      } else if (line.startsWith('## ')) {
        result.push({ id: `h2-${i}`, type: 'h2', raw: line, content: line.substring(3).trim() });
      } else if (line.startsWith('### ')) {
        result.push({ id: `h3-${i}`, type: 'h3', raw: line, content: line.substring(4).trim() });
      } else if (line.startsWith('> ')) {
        result.push({ id: `quote-${i}`, type: 'callout', raw: line, content: line.substring(2).trim() });
      } else if (line.startsWith('* ')) {
        result.push({ id: `list-${i}`, type: 'list', raw: line, content: line.substring(2).trim() });
      } else if (line.trim() === '---') {
        result.push({ id: `div-${i}`, type: 'divider', raw: line, content: '' });
      } else if (line.trim()) {
        result.push({ id: `p-${i}`, type: 'p', raw: line, content: line.trim() });
      }
    }

    return result;
  });

  // Cálculo de estadísticas
  $effect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const pages = Math.max(1, Math.ceil(words / 320));
    onStatsChange({ words, pages });
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
    activeMathTex = currentTex || 'v = \\frac{\\Delta [C]}{\\Delta t}';
    showMathModal = true;
  }

  function handleInsertFormula(newTex: string) {
    const formulaBlock = `\n$$\n${newTex}\n$$\n`;
    content += formulaBlock;
  }

  function handleSelectSlashAction(action: string) {
    showSlashMenu = false;
    if (action === 'h1') content += '\n# Nuevo Título Principal\n';
    else if (action === 'h2') content += '\n## Nuevo Subtítulo\n';
    else if (action === 'math') openMathEditor();
    else if (action === 'callout') content += '\n> **Nota:** Escribe tu recordatorio o aviso importante aquí...\n';
    else if (action === 'bullet') content += '\n* Elemento de lista con viñeta\n';
    else if (action === 'numbered') content += '\n1. Primer paso importante\n2. Segundo paso\n';
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
    else if (action === 'h1') replacement = `\n# ${selected || 'Título Principal'}\n`;
    else if (action === 'h2') replacement = `\n## ${selected || 'Subtítulo'}\n`;
    else if (action === 'quote') replacement = `\n> **Nota:** ${selected || 'Aviso destacado'}\n`;

    content = content.substring(0, start) + replacement + content.substring(end);
    showToolbar = false;
  }

  function checkSelection(e: MouseEvent) {
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

<!-- Contenedor Maestro de Mesa de Trabajo (Workspace) -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
  class="h-full flex flex-col bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] dark:from-[#090d16] dark:via-[#0c101b] dark:to-[#080b12] overflow-y-auto select-text p-4 md:p-8 transition-colors relative"
  onmouseup={checkSelection}
>
  
  <!-- Barra de Herramientas Flotante Suspendida (Pill Toolbar) -->
  <div class="sticky top-0 z-30 flex items-center justify-center mb-6">
    <div class="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-lg shadow-black/5 text-slate-700 dark:text-[#c9d1d9] text-xs">
      
      <div class="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-[#30363d]">
        <button 
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#21262d] font-bold transition-colors cursor-pointer"
          onclick={() => handleFormat('bold')}
          title="Negrita (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button 
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#21262d] italic transition-colors cursor-pointer"
          onclick={() => handleFormat('italic')}
          title="Cursiva (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
      </div>

      <div class="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-[#30363d]">
        <button 
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#21262d] transition-colors cursor-pointer"
          onclick={() => handleFormat('h1')}
          title="Título Principal"
        >
          <Heading1 size={14} />
        </button>
        <button 
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#21262d] transition-colors cursor-pointer"
          onclick={() => handleFormat('h2')}
          title="Subtítulo"
        >
          <Heading2 size={14} />
        </button>
        <button 
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#21262d] transition-colors cursor-pointer"
          onclick={() => handleFormat('quote')}
          title="Nota Destacada (Callout)"
        >
          <Quote size={14} />
        </button>
      </div>

      <!-- Botón de Acción Especial: Insertar Fórmula Asistida -->
      <button 
        class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold text-xs shadow-sm hover:shadow-indigo-500/20 transition-all cursor-pointer"
        onclick={() => openMathEditor()}
        title="Crear o editar fórmula matemática con botones y clics"
      >
        <Calculator size={13} />
        <span>Fórmula</span>
      </button>

      <!-- Alternador de modo de vista -->
      <div class="pl-2 border-l border-slate-200 dark:border-[#30363d] flex items-center">
        <button
          class="px-2 py-1 rounded-lg text-[11px] font-medium transition-colors {paperMode === 'split_view' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-600'}"
          onclick={() => paperMode = paperMode === 'split_view' ? 'zen_edit' : 'split_view'}
          title="Alternar entre vista de lectura interactiva o redactor continuo"
        >
          {paperMode === 'split_view' ? 'Lienzo Completo' : 'Modo Redacción'}
        </button>
      </div>
    </div>
  </div>

  <!-- La Hoja de Papel Físico (Craft Paper Sheet) -->
  <div class="w-full max-w-3xl mx-auto bg-white dark:bg-[#141a26] rounded-3xl paper-shadow dark:paper-shadow-dark border border-slate-200/80 dark:border-white/5 min-h-[92vh] p-8 md:p-16 flex flex-col space-y-8 relative transition-all">
    
    <!-- Encabezado de Documento Editorial -->
    <div class="border-b border-slate-100 dark:border-[#21262d] pb-8 space-y-4">
      
      <!-- Icono de Portada Decorativo -->
      <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-sky-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/40 dark:border-indigo-400/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
        <GraduationCap size={24} />
      </div>

      <!-- Título de Documento Tipo Editorial -->
      <input 
        type="text" 
        bind:value={title}
        class="w-full text-3xl md:text-5xl font-extrabold font-{fontStyle === 'sans' ? 'sans' : 'serif'} text-slate-900 dark:text-white bg-transparent border-none outline-hidden focus:ring-0 p-0 tracking-tight placeholder:text-slate-300 dark:placeholder:text-[#484f58]"
        placeholder="Título del Documento..."
      />
      
      <!-- Metadatos de Publicación Sutiles -->
      <div class="flex flex-wrap items-center justify-between text-xs text-slate-400 dark:text-[#8b949e] pt-1">
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Autor: <strong class="text-slate-700 dark:text-slate-200">{author || 'Usuario'}</strong></span>
          </span>
          <span>•</span>
          <span>Formato: <strong class="text-indigo-600 dark:text-indigo-400">LaTeX Tipográfico Profesional</strong></span>
        </div>
        <div class="text-[11px] font-mono text-slate-400">
          PaperCraft v0.2
        </div>
      </div>
    </div>

    <!-- Contenido del Documento Renderizado en Vivo (True WYSIWYG) -->
    <div class="space-y-6 font-{fontStyle === 'sans' ? 'sans' : 'serif'} text-slate-800 dark:text-slate-200 text-[16px] leading-[1.8]">
      {#each blocks as b}
        {#if b.type === 'h1'}
          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white pt-6 pb-2 border-b border-slate-100 dark:border-[#21262d] font-serif tracking-tight">
            {b.content}
          </h1>
        {:else if b.type === 'h2'}
          <h2 class="text-xl md:text-2xl font-bold text-indigo-950 dark:text-indigo-300 pt-4 pb-1 font-serif tracking-tight">
            {b.content}
          </h2>
        {:else if b.type === 'h3'}
          <h3 class="text-lg md:text-xl font-semibold text-purple-900 dark:text-purple-300 pt-2 font-serif">
            {b.content}
          </h3>
        {:else if b.type === 'callout'}
          <!-- Caja de Aviso / Callout Elegante con Borde Degradado -->
          <div class="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50/50 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-slate-900/40 border-l-4 border-indigo-500 text-slate-800 dark:text-slate-200 text-sm space-y-1.5 my-4 shadow-xs">
            <div class="flex items-start gap-2.5">
              <Info size={18} class="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div class="leading-relaxed">{@html renderInlineMath(b.content)}</div>
            </div>
          </div>
        {:else if b.type === 'math'}
          <!-- Tarjeta de Fórmula Matemática Hiper-Estética -->
          <div class="group my-6 p-6 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 dark:from-[#182030] dark:via-[#1c2438] dark:to-[#182030] border border-slate-200/80 dark:border-indigo-500/20 hover:border-indigo-400 dark:hover:border-indigo-400 shadow-xs hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col items-center justify-center relative">
            
            <div class="text-[10px] uppercase font-bold tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">
              Expresión Matemática (KaTeX)
            </div>

            <div class="text-xl md:text-2xl py-2 text-slate-900 dark:text-white overflow-x-auto max-w-full text-center">
              {@html renderKaTeXBlock(b.content)}
            </div>

            <!-- Botón de Edición Asistida con Clics -->
            <button 
              class="opacity-0 group-hover:opacity-100 transition-all absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#21262d] border border-slate-200 dark:border-[#30363d] text-indigo-600 dark:text-indigo-400 text-xs font-semibold shadow-md hover:bg-indigo-50 dark:hover:bg-[#283140] cursor-pointer hover:scale-105"
              onclick={() => openMathEditor(b.content)}
              title="Modificar esta fórmula con casillas y botones visuales"
            >
              <Edit3 size={13} />
              <span>Editar con clics</span>
            </button>
          </div>
        {:else if b.type === 'list'}
          <li class="ml-6 list-disc text-slate-800 dark:text-slate-200 marker:text-indigo-500">
            {@html renderInlineMath(b.content)}
          </li>
        {:else if b.type === 'divider'}
          <hr class="border-t border-slate-200/60 dark:border-[#21262d] my-6" />
        {:else}
          <p class="leading-[1.8] text-slate-800 dark:text-slate-200">
            {@html renderInlineMath(b.content)}
          </p>
        {/if}
      {/each}
    </div>

    <!-- Área de Redacción Fluida (Textarea con diseño minimalista) -->
    <div class="pt-8 border-t border-slate-100 dark:border-[#21262d]">
      <div class="flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-[#8b949e] mb-3 uppercase tracking-wider">
        <span class="flex items-center gap-1.5">
          <Edit3 size={12} class="text-indigo-500" />
          <span>Editor de Texto Continuo</span>
        </span>
        <span class="text-indigo-600 dark:text-indigo-400 font-normal lowercase bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
          teclea '/' para insertar bloques
        </span>
      </div>

      <textarea
        bind:this={textareaRef}
        bind:value={content}
        oninput={handleTextareaInput}
        rows={9}
        class="w-full p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0d1117] border border-slate-200/80 dark:border-[#21262d] text-slate-800 dark:text-slate-200 text-sm font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 leading-relaxed resize-y transition-all shadow-inner"
        placeholder="Escribe tu contenido aquí con total libertad. Teclea '/' para insertar títulos, fórmulas o listas..."
      ></textarea>
    </div>

  </div>

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
