<script lang="ts">
  import katex from 'katex';
  import { X, Check, Calculator, Sparkles } from '@lucide/svelte';

  let {
    isOpen = $bindable(false),
    initialMath = '',
    onInsert = (formula: string) => {}
  } = $props();

  let formula = $state('v = \\frac{\\Delta x}{\\Delta t}');
  let previewHtml = $state('');
  let renderError = $state<string | null>(null);

  $effect(() => {
    if (initialMath) {
      formula = initialMath;
    }
  });

  // Categorías de plantillas rápidas
  const templates = [
    { label: 'Fracción', tex: '\\frac{a}{b}', desc: 'a / b' },
    { label: 'Raíz Cuadrada', tex: '\\sqrt{x}', desc: '√x' },
    { label: 'Potencia', tex: 'x^{2}', desc: 'x²' },
    { label: 'Subíndice', tex: 'x_{i}', desc: 'xᵢ' },
    { label: 'Suma / Total', tex: '\\sum_{i=1}^{n} x_i', desc: 'Σ' },
    { label: 'Integral', tex: '\\int_{a}^{b} f(x) dx', desc: '∫' },
    { label: 'Límite', tex: '\\lim_{x \\to 0} f(x)', desc: 'lím' },
    { label: 'Delta / Cambio', tex: '\\Delta x', desc: 'Δx' },
  ];

  const symbols = [
    { label: 'α (alfa)', tex: '\\alpha' },
    { label: 'β (beta)', tex: '\\beta' },
    { label: 'γ (gamma)', tex: '\\gamma' },
    { label: 'θ (theta)', tex: '\\theta' },
    { label: 'λ (lambda)', tex: '\\lambda' },
    { label: 'μ (micro)', tex: '\\mu' },
    { label: 'π (pi)', tex: '\\pi' },
    { label: 'σ (sigma)', tex: '\\sigma' },
    { label: 'Δ (Delta)', tex: '\\Delta' },
    { label: 'Ω (Omega)', tex: '\\Omega' },
    { label: '± (más/menos)', tex: '\\pm' },
    { label: '× (por)', tex: '\\times' },
    { label: '÷ (div)', tex: '\\div' },
    { label: '≤ (menor/igual)', tex: '\\le' },
    { label: '≥ (mayor/igual)', tex: '\\ge' },
    { label: '≠ (distinto)', tex: '\\neq' },
    { label: '≈ (aprox)', tex: '\\approx' },
    { label: '∞ (infinito)', tex: '\\infty' },
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
        previewHtml = '<span class="text-gray-400 italic">Escribe o presiona botones abajo para armar la fórmula...</span>';
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
      previewHtml = `<span class="text-red-400 text-xs">${renderError}</span>`;
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
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl shadow-2xl max-w-xl w-full p-6 text-gray-900 dark:text-[#c9d1d9] space-y-5 animate-in fade-in zoom-in-95 duration-150">
      
      <!-- Encabezado del modal -->
      <div class="flex items-center justify-between border-b border-gray-100 dark:border-[#21262d] pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Calculator size={18} />
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Constructor Visual de Fórmulas</h3>
            <p class="text-[11px] text-gray-500 dark:text-[#8b949e]">Crea expresiones matemáticas con clics sin memorizar comandos.</p>
          </div>
        </div>
        <button 
          class="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          onclick={() => isOpen = false}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Área de Vista Previa Renderizada (KaTeX) -->
      <div class="p-4 rounded-xl bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#21262d] flex flex-col items-center justify-center min-h-[90px] text-center">
        <div class="text-[10px] uppercase font-bold text-gray-400 dark:text-[#8b949e] tracking-wider mb-1 self-start">
          Resultado Visual
        </div>
        <div class="text-lg py-2 text-indigo-700 dark:text-indigo-300 font-medium">
          {@html previewHtml}
        </div>
      </div>

      <!-- Campo de edición directa asistida -->
      <div>
        <label class="block text-[11px] font-semibold text-gray-600 dark:text-[#8b949e] mb-1.5" for="formula-input">
          Expresión (puedes editar texto o presionar los botones):
        </label>
        <input 
          id="formula-input"
          type="text" 
          bind:value={formula} 
          class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] text-gray-900 dark:text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          placeholder={"Ejemplo: v = \\frac{\\Delta x}{\\Delta t}"}
        />
      </div>

      <!-- Paleta de Estructuras Matemáticas -->
      <div>
        <div class="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-2">Estructuras Comunes:</div>
        <div class="grid grid-cols-4 gap-1.5">
          {#each templates as t}
            <button 
              type="button"
              class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-indigo-50 dark:bg-[#21262d] dark:hover:bg-indigo-500/20 border border-gray-200 dark:border-transparent text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-medium transition-all flex flex-col items-center"
              onclick={() => insertFragment(t.tex)}
            >
              <span class="font-bold text-xs">{t.desc}</span>
              <span class="text-[9px] text-gray-400">{t.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Paleta de Símbolos & Letras Griegas -->
      <div>
        <div class="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-2">Símbolos y Letras Griegas:</div>
        <div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-gray-50 dark:bg-[#0d1117] rounded-lg border border-gray-200 dark:border-[#21262d]">
          {#each symbols as s}
            <button 
              type="button"
              class="px-2 py-1 rounded bg-white hover:bg-indigo-50 dark:bg-[#161b22] dark:hover:bg-[#21262d] border border-gray-200 dark:border-[#30363d] text-gray-800 dark:text-gray-200 text-xs hover:border-indigo-400 transition-all"
              onclick={() => insertFragment(s.tex)}
              title={s.label}
            >
              {s.label.split(' ')[0]}
            </button>
          {/each}
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#21262d]">
        <button 
          type="button"
          class="px-4 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-medium transition-colors"
          onclick={() => isOpen = false}
        >
          Cancelar
        </button>
        <button 
          type="button"
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          onclick={handleSave}
        >
          <Check size={14} />
          <span>Insertar Fórmula en Documento</span>
        </button>
      </div>

    </div>
  </div>
{/if}
