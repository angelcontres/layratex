<script lang="ts">
  import { X, Table, Check } from '@lucide/svelte';

  let {
    isOpen = $bindable(false),
    onInsert = (tableMarkdown: string) => {}
  } = $props();

  let maxRows = 6;
  let maxCols = 6;
  let selectedRows = $state(3);
  let selectedCols = $state(3);
  let hoveredRows = $state(3);
  let hoveredCols = $state(3);
  let hasHeader = $state(true);

  function handleHover(r: number, c: number) {
    hoveredRows = r;
    hoveredCols = c;
  }

  function handleConfirm(r: number, c: number) {
    selectedRows = r;
    selectedCols = c;
    insertTable();
  }

  function insertTable() {
    const r = selectedRows || 3;
    const c = selectedCols || 3;

    let md = '\n';
    // Encabezado
    if (hasHeader) {
      const headers = Array.from({ length: c }, (_, i) => `Columna ${i + 1}`);
      md += `| ${headers.join(' | ')} |\n`;
      const dividers = Array.from({ length: c }, () => ':---');
      md += `| ${dividers.join(' | ')} |\n`;
    }

    // Filas
    for (let i = 0; i < (hasHeader ? r - 1 : r); i++) {
      const row = Array.from({ length: c }, (_, j) => `Dato ${i + 1}.${j + 1}`);
      md += `| ${row.join(' | ')} |\n`;
    }
    md += '\n';

    onInsert(md);
    isOpen = false;
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
    <div class="bg-white dark:bg-[#161a24] border border-slate-200 dark:border-white/10 rounded-md shadow-2xl max-w-sm w-full p-6 text-slate-900 dark:text-slate-100 space-y-4 animate-in zoom-in-95 duration-100">
      
      <!-- Encabezado -->
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xs bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Table size={16} />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Insertar Tabla</h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Selecciona filas y columnas</p>
          </div>
        </div>
        <button 
          class="p-1 rounded-xs text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          onclick={() => isOpen = false}
        >
          <X size={16} />
        </button>
      </div>

      <!-- Cuadrícula interactiva de selección de matriz -->
      <div class="flex flex-col items-center py-2">
        <div class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3 font-mono">
          {hoveredRows} × {hoveredCols} casillas
        </div>

        <div class="grid grid-cols-6 gap-1.5 p-3 rounded-sm bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/5">
          {#each Array.from({ length: maxRows }, (_, r) => r + 1) as r}
            {#each Array.from({ length: maxCols }, (_, c) => c + 1) as c}
              <button
                type="button"
                class="w-7 h-7 rounded-xs border transition-all cursor-pointer {r <= hoveredRows && c <= hoveredCols ? 'bg-indigo-500 border-indigo-600 shadow-xs' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-400'}"
                onmouseenter={() => handleHover(r, c)}
                onclick={() => handleConfirm(r, c)}
                title="{r} filas × {c} columnas"
              ></button>
            {/each}
          {/each}
        </div>
      </div>

      <!-- Opciones -->
      <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5">
        <label class="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300">
          <input 
            type="checkbox" 
            bind:checked={hasHeader}
            class="rounded-xs border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-0"
          />
          <span>Fila de Encabezado</span>
        </label>

        <button
          type="button"
          class="px-3 py-1.5 rounded-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer flex items-center gap-1"
          onclick={insertTable}
        >
          <Check size={12} />
          <span>Insertar</span>
        </button>
      </div>

    </div>
  </div>
{/if}
