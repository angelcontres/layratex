<script lang="ts">
  import katex from 'katex';
  import { 
    Calculator, 
    Edit3,
    Eye,
    Plus,
    Check
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

  // Modo en la hoja: 'view' (vista impresa real de la hoja) vs 'edit' (redacción directa en la hoja)
  let sheetMode = $state<'view' | 'edit'>('view');

  // Menú Slash
  let showSlashMenu = $state(false);
  let slashFilter = $state('');
  let slashMenuRef = $state<any>(null);

  // Floating Toolbar
  let showToolbar = $state(false);
  let toolbarX = $state(0);
  let toolbarY = $state(0);

  // Parseo de bloques de la hoja
  interface SheetBlock {
    id: string;
    type: 'h1' | 'h2' | 'h3' | 'math' | 'callout' | 'list' | 'p' | 'divider';
    content: string;
  }

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

  // Métricas
  $effect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const pages = Math.max(1, Math.ceil(words / 350));
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

<!-- Entorno de Trabajo Minimalista: Mesa de Trabajo con Hoja Flotante -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
  class="h-full flex flex-col items-center bg-[#f4f5f7] dark:bg-[#0c0e14] overflow-y-auto select-text p-6 md:p-12 transition-colors relative"
  onmouseup={checkSelection}
>
  
  <!-- La Hoja de Papel Pura (A4 Minimalista) -->
  <div 
    class="w-full max-w-[800px] bg-white dark:bg-[#16181f] rounded-xs shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)] border border-slate-200/60 dark:border-white/5 min-h-[1050px] px-12 py-16 md:px-20 md:py-20 flex flex-col relative transition-all"
  >
    
    <!-- Encabezado de la Hoja Física (Estilo Paper Tradicional LaTeX) -->
    <div class="mb-10 text-center space-y-2 border-b border-slate-100 dark:border-white/5 pb-8">
      <input 
        type="text" 
        bind:value={title}
        class="w-full text-2xl md:text-3xl font-bold font-{fontStyle === 'sans' ? 'sans' : 'serif'} text-slate-900 dark:text-white bg-transparent border-none outline-hidden focus:ring-0 text-center tracking-tight placeholder:text-slate-300"
        placeholder="Título del Documento"
      />
      
      <div class="text-xs text-slate-500 dark:text-slate-400 font-{fontStyle === 'sans' ? 'sans' : 'serif'} flex items-center justify-center gap-2 pt-1">
        <span>{author || 'Autor'}</span>
        <span>•</span>
        <span>{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>

    <!-- Contenido en la Hoja: Alternador sutil Vista Impresa vs Escritura Fluida -->
    {#if sheetMode === 'view'}
      <!-- Hoja Impresa (Fórmulas renderizadas nítidas en su lugar exacto) -->
      <div class="space-y-5 font-{fontStyle === 'sans' ? 'sans' : 'serif'} text-slate-800 dark:text-slate-200 text-[15px] leading-[1.8] flex-1">
        {#each blocks as b}
          {#if b.type === 'h1'}
            <h2 class="text-xl font-bold text-slate-900 dark:text-white pt-5 pb-1 font-serif tracking-tight border-b border-slate-100 dark:border-white/5">
              {b.content}
            </h2>
          {:else if b.type === 'h2'}
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 pt-3 pb-0.5 font-serif tracking-tight">
              {b.content}
            </h3>
          {:else if b.type === 'h3'}
            <h4 class="text-base font-medium text-slate-800 dark:text-slate-200 pt-2 font-serif">
              {b.content}
            </h4>
          {:else if b.type === 'callout'}
            <div class="p-4 rounded-lg bg-slate-50 dark:bg-white/5 border-l-3 border-indigo-500 text-slate-700 dark:text-slate-300 text-sm my-3 italic">
              {@html renderInlineMath(b.content)}
            </div>
          {:else if b.type === 'math'}
            <!-- Fórmula centrada en la hoja con micro-botón sutil en hover -->
            <div class="group my-5 py-3 text-center relative hover:bg-slate-50/60 dark:hover:bg-white/5 rounded-lg transition-colors">
              <div class="text-lg md:text-xl text-slate-900 dark:text-white overflow-x-auto">
                {@html renderKaTeXBlock(b.content)}
              </div>
              <button 
                class="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-2 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                onclick={() => openMathEditor(b.content)}
                title="Editar fórmula matemática"
              >
                <Edit3 size={11} />
                <span>editar</span>
              </button>
            </div>
          {:else if b.type === 'list'}
            <li class="ml-6 list-disc text-slate-800 dark:text-slate-200">
              {@html renderInlineMath(b.content)}
            </li>
          {:else if b.type === 'divider'}
            <hr class="border-t border-slate-200/80 dark:border-white/10 my-6" />
          {:else}
            <p class="leading-[1.8] text-slate-800 dark:text-slate-200 text-justify">
              {@html renderInlineMath(b.content)}
            </p>
          {/if}
        {/each}
      </div>
    {:else}
      <!-- Modo Escritura Fluida Directa sobre la Hoja de Papel -->
      <div class="flex-1 flex flex-col">
        <textarea
          bind:this={textareaRef}
          bind:value={content}
          oninput={handleTextareaInput}
          class="w-full flex-1 bg-transparent border-none outline-hidden resize-none font-{fontStyle === 'sans' ? 'sans' : 'serif'} text-slate-800 dark:text-slate-200 text-[15px] leading-[1.8] p-0 focus:ring-0"
          placeholder="Escribe directamente en esta hoja de papel. Teclea '/' para insertar títulos o fórmulas..."
        ></textarea>
      </div>
    {/if}

    <!-- Pie de Hoja Discreto (Paginación clásica) -->
    <div class="pt-12 text-center text-xs text-slate-300 dark:text-slate-600 font-serif border-t border-slate-100 dark:border-white/5 mt-auto">
      — 1 —
    </div>

  </div>

  <!-- Switch Flotante Ultra-Discreto en Esquina Inferior: Modo Vista vs Escritura -->
  <div class="fixed bottom-6 right-8 z-30 flex items-center gap-1 p-1 rounded-full bg-white/90 dark:bg-[#16181f]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-lg text-xs">
    <button 
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer {sheetMode === 'view' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
      onclick={() => sheetMode = 'view'}
      title="Ver hoja como documento impreso"
    >
      <Eye size={12} />
      <span>Vista Hoja</span>
    </button>
    <button 
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer {sheetMode === 'edit' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
      onclick={() => sheetMode = 'edit'}
      title="Escribir texto en la hoja"
    >
      <Edit3 size={12} />
      <span>Escribir</span>
    </button>
    <div class="w-px h-4 bg-slate-200 dark:bg-white/10 mx-0.5"></div>
    <button 
      class="flex items-center gap-1 px-3 py-1.5 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/5 font-semibold transition-colors cursor-pointer"
      onclick={() => openMathEditor()}
      title="Insertar fórmula con clics"
    >
      <Calculator size={12} />
      <span>+ Fórmula</span>
    </button>
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
