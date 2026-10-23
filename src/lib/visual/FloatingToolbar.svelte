<script lang="ts">
  import { Bold, Italic, Heading1, Heading2, Calculator, Quote } from '@lucide/svelte';

  let {
    isOpen = false,
    x = 0,
    y = 0,
    onFormat = (action: string) => {}
  } = $props();
</script>

{#if isOpen}
  <div 
    class="fixed z-50 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl shadow-xl flex items-center p-1 gap-0.5 text-gray-700 dark:text-[#c9d1d9] backdrop-blur-md animate-in fade-in duration-100"
    style="left: {x}px; top: {y}px; transform: translate(-50%, -100%) translateY(-8px);"
  >
    <button 
      type="button"
      class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
      onclick={() => onFormat('bold')}
      title="Negrita (Ctrl+B)"
    >
      <Bold size={14} />
    </button>
    <button 
      type="button"
      class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
      onclick={() => onFormat('italic')}
      title="Cursiva (Ctrl+I)"
    >
      <Italic size={14} />
    </button>

    <div class="w-px h-4 bg-gray-200 dark:bg-[#30363d] mx-1"></div>

    <button 
      type="button"
      class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
      onclick={() => onFormat('h1')}
      title="Título Principal"
    >
      <Heading1 size={14} />
    </button>
    <button 
      type="button"
      class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
      onclick={() => onFormat('h2')}
      title="Subtítulo"
    >
      <Heading2 size={14} />
    </button>

    <div class="w-px h-4 bg-gray-200 dark:bg-[#30363d] mx-1"></div>

    <button 
      type="button"
      class="p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors flex items-center gap-1 font-bold text-xs"
      onclick={() => onFormat('math')}
      title="Convertir a Fórmula Matemática ($...$)"
    >
      <Calculator size={13} />
      <span>fx</span>
    </button>
    <button 
      type="button"
      class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
      onclick={() => onFormat('quote')}
      title="Convertir en Nota Destacada"
    >
      <Quote size={13} />
    </button>
  </div>
{/if}
