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
    class="fixed z-50 bg-slate-900/95 dark:bg-[#161c28]/95 text-white border border-white/10 rounded-2xl shadow-2xl flex items-center p-1.5 gap-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
    style="left: {x}px; top: {y}px; transform: translate(-50%, -100%) translateY(-10px);"
  >
    <button 
      type="button"
      class="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-200 hover:text-white cursor-pointer"
      onclick={() => onFormat('bold')}
      title="Negrita (Ctrl+B)"
    >
      <Bold size={15} />
    </button>
    <button 
      type="button"
      class="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-200 hover:text-white cursor-pointer"
      onclick={() => onFormat('italic')}
      title="Cursiva (Ctrl+I)"
    >
      <Italic size={15} />
    </button>

    <div class="w-px h-4 bg-white/15 mx-1"></div>

    <button 
      type="button"
      class="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-200 hover:text-white cursor-pointer"
      onclick={() => onFormat('h1')}
      title="Título Principal"
    >
      <Heading1 size={15} />
    </button>
    <button 
      type="button"
      class="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-200 hover:text-white cursor-pointer"
      onclick={() => onFormat('h2')}
      title="Subtítulo"
    >
      <Heading2 size={15} />
    </button>

    <div class="w-px h-4 bg-white/15 mx-1"></div>

    <button 
      type="button"
      class="px-2 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-white transition-all flex items-center gap-1 font-bold text-xs cursor-pointer"
      onclick={() => onFormat('math')}
      title="Convertir a Fórmula Matemática ($...$)"
    >
      <Calculator size={13} />
      <span>fx</span>
    </button>
    <button 
      type="button"
      class="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-200 hover:text-white cursor-pointer"
      onclick={() => onFormat('quote')}
      title="Convertir en Nota Destacada"
    >
      <Quote size={14} />
    </button>
  </div>
{/if}
