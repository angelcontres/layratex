<script lang="ts">
  import { X, Keyboard, Sparkles, BookOpen } from '@lucide/svelte';

  let {
    isOpen = $bindable(false)
  } = $props();

  const shortcuts = [
    { key: 'Ctrl + F', label: 'Buscar', desc: 'Abrir panel de búsqueda en el editor' },
    { key: 'Ctrl + H', label: 'Buscar y Reemplazar', desc: 'Abrir panel de búsqueda con campos de reemplazo' },
    { key: 'Ctrl + B', label: 'Negrita', desc: 'Aplica formato en negrita al texto seleccionado' },
    { key: 'Ctrl + I', label: 'Cursiva', desc: 'Aplica formato en cursiva' },
    { key: 'Ctrl + S', label: 'Guardar', desc: 'Guarda el documento en disco (.tex)' },
    { key: 'Ctrl + Enter', label: 'Exportar PDF', desc: 'Compila a PDF con Tectonic o pdflatex' },
    { key: '/', label: 'Menú Slash', desc: 'Inserta fórmulas, tablas, títulos, notas y listas' },
    { key: '$$', label: 'Ecuación Matemática', desc: 'Escribe $$ para abrir un bloque matemático' },
  ];

  const tips = [
    { title: 'Doble clic en fórmulas', desc: 'En Vista Impresa, haz doble clic en cualquier fórmula para editarla con botones.' },
    { title: 'Salto de página físico', desc: 'Teclea --- para forzar el paso a la siguiente hoja A4.' },
    { title: 'Traducción Transparente', desc: 'Puedes alternar en cualquier momento a la pestaña LaTeX para ver el código generado.' },
  ];
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
    <div class="bg-white dark:bg-[#161a24] border border-slate-200 dark:border-white/10 rounded-md shadow-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 space-y-5 animate-in zoom-in-95 duration-100">
      
      <!-- Encabezado -->
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xs bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Keyboard size={16} />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Atajos de Teclado y Ayuda</h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Guía rápida para redactar con máxima agilidad</p>
          </div>
        </div>
        <button 
          class="p-1 rounded-xs text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          onclick={() => isOpen = false}
        >
          <X size={16} />
        </button>
      </div>

      <!-- Lista de Atajos -->
      <div class="space-y-2">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Atajos Principales</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {#each shortcuts as sc}
            <div class="p-2.5 rounded-xs bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-start gap-2">
              <kbd class="px-2 py-0.5 rounded-xs bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                {sc.key}
              </kbd>
              <div class="min-w-0">
                <div class="text-xs font-semibold text-slate-900 dark:text-white">{sc.label}</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">{sc.desc}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Consejos Prácticos -->
      <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Consejos de Uso</div>
        <div class="space-y-1.5">
          {#each tips as tip}
            <div class="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <span class="text-indigo-500 font-bold">•</span>
              <div>
                <strong class="text-slate-900 dark:text-white">{tip.title}:</strong> {tip.desc}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button
          type="button"
          class="px-4 py-1.5 rounded-xs bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-medium transition-colors cursor-pointer"
          onclick={() => isOpen = false}
        >
          Entendido
        </button>
      </div>

    </div>
  </div>
{/if}
