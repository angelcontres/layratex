<script lang="ts">
  import { onMount } from 'svelte';
  import katex from 'katex';
  import { 
    Calculator, 
    Sparkles, 
    Plus, 
    FileText, 
    Info, 
    HelpCircle,
    Edit3
  } from '@lucide/svelte';
  import MathBuilderModal from './MathBuilderModal.svelte';
  import SlashMenu from './SlashMenu.svelte';
  import FloatingToolbar from './FloatingToolbar.svelte';

  let {
    content = $bindable(''),
    title = $bindable('Documento Sin Título'),
    author = $bindable(''),
    fontStyle = $bindable<'serif' | 'sans'>('serif'),
    onStatsChange = (stats: { words: number; pages: number }) => {}
  } = $props();

  let textareaRef: HTMLTextAreaElement;
  let showMathModal = $state(false);
  let activeMathIndex = $state<number | null>(null);
  let activeMathTex = $state('');

  // Menú Slash
  let showSlashMenu = $state(false);
  let slashFilter = $state('');
  let slashMenuRef = $state<any>(null);

  // Floating Toolbar
  let showToolbar = $state(false);
  let toolbarX = $state(0);
  let toolbarY = $state(0);

  // Renderizador de bloques visuales (párrafos, títulos, fórmulas interactivas)
  interface RenderedBlock {
    type: 'h1' | 'h2' | 'h3' | 'math' | 'callout' | 'list' | 'p';
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
        result.push({ type: 'h1', raw: line, content: line.substring(2).trim() });
      } else if (line.startsWith('## ')) {
        result.push({ type: 'h2', raw: line, content: line.substring(3).trim() });
      } else if (line.startsWith('### ')) {
        result.push({ type: 'h3', raw: line, content: line.substring(4).trim() });
      } else if (line.startsWith('> ')) {
        result.push({ type: 'callout', raw: line, content: line.substring(2).trim() });
      } else if (line.startsWith('* ')) {
        result.push({ type: 'list', raw: line, content: line.substring(2).trim() });
      } else if (line.trim()) {
        result.push({ type: 'p', raw: line, content: line.trim() });
      }
    }

    return result;
  });

  // Métricas
  $effect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const pages = Math.max(1, Math.ceil(words / 320));
    onStatsChange({ words, pages });
  });

  function renderInlineMath(text: string): string {
    // Reemplaza $...$ con KaTeX inline
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
      return `<div class="text-red-400 font-mono text-xs">${tex}</div>`;
    }
  }

  function openMathEditor(currentTex: string = '') {
    activeMathTex = currentTex || 'v = \\frac{\\Delta [C]}{\\Delta t}';
    showMathModal = true;
  }

  function handleInsertFormula(newTex: string) {
    // Si estábamos editando o agregando
    const formulaBlock = `\n$$\n${newTex}\n$$\n`;
    content += formulaBlock;
  }

  function handleSelectSlashAction(action: string) {
    showSlashMenu = false;
    if (action === 'h1') {
      content += '\n# Nuevo Título Principal\n';
    } else if (action === 'h2') {
      content += '\n## Nuevo Subtítulo\n';
    } else if (action === 'math') {
      openMathEditor();
    } else if (action === 'callout') {
      content += '\n> **Nota:** Escribe tu recordatorio o aviso aquí...\n';
    } else if (action === 'bullet') {
      content += '\n* Elemento de lista con viñeta\n';
    } else if (action === 'numbered') {
      content += '\n1. Primer paso\n2. Segundo paso\n';
    } else if (action === 'divider') {
      content += '\n---\n';
    }
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
    else if (action === 'quote') replacement = `\n> **Nota:** ${selected || 'Aviso'}\n`;

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
    
    // Si la última palabra escrita empieza con /
    const matchSlash = textBeforeCursor.match(/\/([a-zA-Z0-9]*)$/);
    if (matchSlash) {
      showSlashMenu = true;
      slashFilter = matchSlash[1];
    } else {
      showSlashMenu = false;
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="h-full flex flex-col bg-[#f0f2f5] dark:bg-[#090d16] overflow-y-auto select-text p-6 md:p-10 transition-colors" onmouseup={checkSelection}>
  
  <!-- Lienzo de Hoja de Papel A4 (PaperCraft) -->
  <div class="w-full max-w-3xl mx-auto bg-white dark:bg-[#12161f] rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/80 dark:border-white/5 min-h-[95vh] p-8 md:p-14 flex flex-col space-y-6 relative transition-all">
    
    <!-- Encabezado de Página Limpio -->
    <div class="border-b border-gray-100 dark:border-[#21262d] pb-6 space-y-3">
      <input 
        type="text" 
        bind:value={title}
        class="w-full text-3xl md:text-4xl font-bold font-serif text-gray-900 dark:text-white bg-transparent border-none outline-hidden focus:ring-0 p-0 tracking-tight"
        placeholder="Título del Documento..."
      />
      
      <div class="flex items-center justify-between text-xs text-gray-400 dark:text-[#8b949e]">
        <div class="flex items-center gap-3">
          <span>Autor: <strong class="text-gray-700 dark:text-gray-200">{author || 'Estudiante / Redactor'}</strong></span>
          <span>•</span>
          <span>Formato: <strong class="text-indigo-600 dark:text-indigo-400">LaTeX Tipográfico</strong></span>
        </div>
        <div class="text-[11px] font-mono text-gray-400">
          Modo PaperCraft
        </div>
      </div>
    </div>

    <!-- Barra de Inserción Rápida Integrada -->
    <div class="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#21262d] text-xs">
      <div class="flex items-center gap-1.5 text-gray-600 dark:text-[#8b949e]">
        <button 
          class="px-2.5 py-1 rounded-md hover:bg-white dark:hover:bg-[#21262d] font-bold text-gray-800 dark:text-white transition-colors"
          onclick={() => handleFormat('bold')}
          title="Negrita"
        >
          B
        </button>
        <button 
          class="px-2.5 py-1 rounded-md hover:bg-white dark:hover:bg-[#21262d] italic text-gray-800 dark:text-white transition-colors"
          onclick={() => handleFormat('italic')}
          title="Cursiva"
        >
          I
        </button>
        <button 
          class="px-2.5 py-1 rounded-md hover:bg-white dark:hover:bg-[#21262d] font-semibold text-gray-800 dark:text-white transition-colors"
          onclick={() => handleFormat('h1')}
          title="Título Principal"
        >
          H1
        </button>
        <button 
          class="px-2.5 py-1 rounded-md hover:bg-white dark:hover:bg-[#21262d] font-semibold text-gray-800 dark:text-white transition-colors"
          onclick={() => handleFormat('h2')}
          title="Subtítulo"
        >
          H2
        </button>
      </div>

      <!-- Botón de Constructor de Fórmulas -->
      <button 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-semibold transition-all cursor-pointer shadow-2xs"
        onclick={() => openMathEditor()}
        title="Crear o editar fórmula matemática con clics"
      >
        <Calculator size={13} />
        <span>Insertar Fórmula (Math)</span>
      </button>
    </div>

    <!-- Vista Híbrida Interactiva: Renderizado Visual en Vivo -->
    <div class="space-y-4 font-{fontStyle === 'sans' ? 'sans' : 'serif'} text-gray-800 dark:text-gray-200 leading-relaxed text-[16px]">
      {#each blocks as b, idx}
        {#if b.type === 'h1'}
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white pt-4 pb-1 border-b border-gray-100 dark:border-[#21262d] font-serif">
            {b.content}
          </h1>
        {:else if b.type === 'h2'}
          <h2 class="text-xl font-semibold text-indigo-900 dark:text-indigo-300 pt-3 pb-0.5 font-serif">
            {b.content}
          </h2>
        {:else if b.type === 'h3'}
          <h3 class="text-lg font-medium text-purple-900 dark:text-purple-300 pt-2 font-serif">
            {b.content}
          </h3>
        {:else if b.type === 'callout'}
          <div class="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border-l-4 border-indigo-500 text-indigo-900 dark:text-indigo-200 text-sm space-y-1 my-3 shadow-2xs">
            <div class="flex items-center gap-2 font-semibold">
              <Info size={15} class="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{@html renderInlineMath(b.content)}</span>
            </div>
          </div>
        {:else if b.type === 'math'}
          <!-- Tarjeta de Fórmula Matemática Renderizada con Botón de Edición Asistida -->
          <div class="group my-5 p-4 rounded-xl bg-gray-50/80 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col items-center justify-center relative">
            <div class="text-lg md:text-xl py-2 text-gray-900 dark:text-white overflow-x-auto max-w-full text-center">
              {@html renderKaTeXBlock(b.content)}
            </div>

            <!-- Botón de Editar Fórmula con 1 Clic -->
            <button 
              class="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] text-indigo-600 dark:text-indigo-400 text-xs font-semibold shadow-xs hover:bg-indigo-50"
              onclick={() => openMathEditor(b.content)}
              title="Modificar esta fórmula con casillas y botones"
            >
              <Edit3 size={12} />
              <span>Editar con clics</span>
            </button>
          </div>
        {:else if b.type === 'list'}
          <li class="ml-6 list-disc text-gray-800 dark:text-gray-200">
            {@html renderInlineMath(b.content)}
          </li>
        {:else}
          <p class="leading-relaxed text-gray-800 dark:text-gray-200">
            {@html renderInlineMath(b.content)}
          </p>
        {/if}
      {/each}
    </div>

    <!-- Editor de Texto Limpio (Notion-Like Textarea) -->
    <div class="pt-6 border-t border-gray-100 dark:border-[#21262d]">
      <div class="flex items-center justify-between text-[11px] font-semibold text-gray-400 dark:text-[#8b949e] mb-2 uppercase tracking-wider">
        <span>Área de Redacción Rápida</span>
        <span class="text-indigo-600 dark:text-indigo-400 font-normal lowercase">teclea '/' para insertar bloques</span>
      </div>

      <textarea
        bind:this={textareaRef}
        bind:value={content}
        oninput={handleTextareaInput}
        rows={10}
        class="w-full p-4 rounded-xl bg-gray-50/50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#21262d] text-gray-800 dark:text-gray-200 text-sm font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y transition-all"
        placeholder="Escribe tu texto libremente aquí. No requieres código. Teclea '/' para insertar títulos, fórmulas o listas..."
      ></textarea>
    </div>

  </div>

</div>

<!-- Menú Slash Flotante -->
{#if showSlashMenu}
  <div class="fixed bottom-16 left-1/2 -translate-x-1/2 z-50">
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
