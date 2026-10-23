<script lang="ts">
  import katex from 'katex';
  import { X, Check, Calculator, Sparkles, Sigma, HelpCircle } from '@lucide/svelte';

  let {
    isOpen = $bindable(false),
    initialMath = '',
    onInsert = (formula: string) => {}
  } = $props();

  let formula = $state('v = \\frac{\\Delta x}{\\Delta t}');
  let previewHtml = $state('');
  let renderError = $state<string | null>(null);
  let activeTab = $state<'basics' | 'calculus' | 'symbols'>('basics');

  $effect(() => {
    if (initialMath) {
      formula = initialMath;
    }
  });

  const basicStructures = [
    { label: 'Fracción', tex: '\\frac{a}{b}', desc: 'a / b' },
    { label: 'Raíz Cuadrada', tex: '\\sqrt{x}', desc: '√x' },
    { label: 'Raíz con Índice', tex: '\\sqrt[n]{x}', desc: 'ⁿ√x' },
    { label: 'Potencia', tex: 'x^{2}', desc: 'x²' },
    { label: 'Subíndice', tex: 'x_{i}', desc: 'xᵢ' },
    { label: 'Paréntesis Grandes', tex: '\\left( x \\right)', desc: '( x )' },
    { label: 'Corchetes', tex: '\\left[ x \\right]', desc: '[ x ]' },
    { label: 'Texto en Fórmula', tex: '\\text{metros}', desc: 'Texto' },
  ];

  const calculusStructures = [
    { label: 'Sumatoria', tex: '\\sum_{i=1}^{n} x_i', desc: 'Σ' },
    { label: 'Integral Definida', tex: '\\int_{a}^{b} f(x) dx', desc: '∫' },
    { label: 'Integral Doble', tex: '\\iint_{S} f(x,y) dA', desc: '∬' },
    { label: 'Límite', tex: '\\lim_{x \\to 0} f(x)', desc: 'lím' },
    { label: 'Derivada Parcial', tex: '\\frac{\\partial f}{\\partial x}', desc: '∂f/∂x' },
    { label: 'Diferencial', tex: 'dx', desc: 'dx' },
    { label: 'Delta / Variación', tex: '\\Delta x', desc: 'Δx' },
    { label: 'Infinito', tex: '\\infty', desc: '∞' },
  ];

  const symbols = [
    { label: 'α', name: 'alfa', tex: '\\alpha' },
    { label: 'β', name: 'beta', tex: '\\beta' },
    { label: 'γ', name: 'gamma', tex: '\\gamma' },
    { label: 'θ', name: 'theta', tex: '\\theta' },
    { label: 'λ', name: 'lambda', tex: '\\lambda' },
    { label: 'μ', name: 'micro', tex: '\\mu' },
    { label: 'π', name: 'pi', tex: '\\pi' },
    { label: 'σ', name: 'sigma', tex: '\\sigma' },
    { label: 'Δ', name: 'Delta', tex: '\\Delta' },
    { label: 'Ω', name: 'Omega', tex: '\\Omega' },
    { label: '±', name: 'más/menos', tex: '\\pm' },
    { label: '×', name: 'multiplicar', tex: '\\times' },
    { label: '÷', name: 'dividir', tex: '\\div' },
    { label: '≤', name: 'menor igual', tex: '\\le' },
    { label: '≥', name: 'mayor igual', tex: '\\ge' },
    { label: '≠', name: 'distinto', tex: '\\neq' },
    { label: '≈', name: 'aproximado', tex: '\\approx' },
    { label: '∈', name: 'pertenece', tex: '\\in' },
  ];

  function insertFragment(snippet: string) {
    if (!formula.trim()) {
      formula = snippet;
    } else {
      formula += ' ' + snippet;
    }
  }

  $effect(() => {
    try {
      if (!formula.trim()) {
        previewHtml = '<span class="text-slate-400 italic">Escribe o presiona botones para armar la fórmula...</span>';
        renderError = null;
        return;
      }
      previewHtml = katex.renderToString(formula, {
        displayMode: true,
        throwOnError: true
      });
      renderError = null;
    } catch (err: any) {
      renderError = err.message || 'Error en la sintaxis de la fórmula';
      previewHtml = `<span class="text-rose-500 text-xs font-mono">${renderError}</span>`;
    }
  });

  function handleSave() {
    if (formula.trim()) {
      onInsert(formula.trim());
      isOpen = false;
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
    <div class="bg-white dark:bg-[#161c28] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl max-w-xl w-full p-7 text-slate-900 dark:text-[#c9d1d9] space-y-5 animate-in zoom-in-95 duration-150">
      
      <!-- Encabezado del modal -->
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-[#21262d] pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Calculator size={20} />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">Constructor Visual de Fórmulas</h3>
            <p class="text-[11px] text-slate-500 dark:text-[#8b949e]">Haz clic en cualquier estructura para insertarla de inmediato.</p>
          </div>
        </div>
        <button 
          class="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          onclick={() => isOpen = false}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Área de Vista Previa Renderizada (KaTeX) -->
      <div class="p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/20 dark:from-[#0d1117] dark:to-[#121620] border border-slate-200/80 dark:border-[#21262d] flex flex-col items-center justify-center min-h-[100px] text-center shadow-inner">
        <div class="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400 tracking-wider mb-1 self-start">
          Vista Previa en Vivo
        </div>
        <div class="text-xl md:text-2xl py-2 text-indigo-950 dark:text-indigo-200 font-medium">
          {@html previewHtml}
        </div>
      </div>

      <!-- Campo de edición directa asistida -->
      <div>
        <label class="block text-[11px] font-bold text-slate-600 dark:text-[#8b949e] mb-1.5" for="formula-input">
          Expresión Matemática:
        </label>
        <div class="relative">
          <input 
            id="formula-input"
            type="text" 
            bind:value={formula} 
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            placeholder={"Ejemplo: v = \\frac{\\Delta x}{\\Delta t}"}
          />
          {#if formula}
            <button 
              type="button"
              class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
              onclick={() => formula = ''}
              title="Borrar fórmula"
            >
              ✕
            </button>
          {/if}
        </div>
      </div>

      <!-- Pestañas de Categorías de Símbolos -->
      <div class="space-y-3">
        <div class="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0d1117] rounded-xl text-xs font-medium">
          <button 
            type="button"
            class="flex-1 py-1.5 rounded-lg transition-all cursor-pointer {activeTab === 'basics' ? 'bg-white dark:bg-[#1f2633] text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
            onclick={() => activeTab = 'basics'}
          >
            Estructuras Básicas
          </button>
          <button 
            type="button"
            class="flex-1 py-1.5 rounded-lg transition-all cursor-pointer {activeTab === 'calculus' ? 'bg-white dark:bg-[#1f2633] text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
            onclick={() => activeTab = 'calculus'}
          >
            Cálculo & Álgebra
          </button>
          <button 
            type="button"
            class="flex-1 py-1.5 rounded-lg transition-all cursor-pointer {activeTab === 'symbols' ? 'bg-white dark:bg-[#1f2633] text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
            onclick={() => activeTab = 'symbols'}
          >
            Símbolos & Griego
          </button>
        </div>

        <!-- Contenido de las Pestañas -->
        {#if activeTab === 'basics'}
          <div class="grid grid-cols-4 gap-2">
            {#each basicStructures as s}
              <button 
                type="button"
                class="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-[#1f2633] dark:hover:bg-indigo-500/20 border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs font-medium transition-all flex flex-col items-center cursor-pointer active:scale-95"
                onclick={() => insertFragment(s.tex)}
              >
                <span class="font-bold text-xs">{s.desc}</span>
                <span class="text-[9px] text-slate-400">{s.label}</span>
              </button>
            {/each}
          </div>
        {:else if activeTab === 'calculus'}
          <div class="grid grid-cols-4 gap-2">
            {#each calculusStructures as s}
              <button 
                type="button"
                class="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-[#1f2633] dark:hover:bg-indigo-500/20 border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs font-medium transition-all flex flex-col items-center cursor-pointer active:scale-95"
                onclick={() => insertFragment(s.tex)}
              >
                <span class="font-bold text-xs">{s.desc}</span>
                <span class="text-[9px] text-slate-400">{s.label}</span>
              </button>
            {/each}
          </div>
        {:else}
          <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-[#0d1117] rounded-xl border border-slate-200/80 dark:border-[#21262d]">
            {#each symbols as s}
              <button 
                type="button"
                class="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 dark:bg-[#161c28] dark:hover:bg-[#252f40] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs hover:border-indigo-400 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                onclick={() => insertFragment(s.tex)}
                title={s.name}
              >
                <span class="font-bold">{s.label}</span>
                <span class="text-[9px] text-slate-400">{s.name}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Botones de Acción -->
      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#21262d]">
        <button 
          type="button"
          class="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors cursor-pointer"
          onclick={() => isOpen = false}
        >
          Cancelar
        </button>
        <button 
          type="button"
          class="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
          onclick={handleSave}
        >
          <Check size={14} />
          <span>Insertar en Documento</span>
        </button>
      </div>

    </div>
  </div>
{/if}
