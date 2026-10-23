<script lang="ts">
  import { Zap, CheckCircle2, Loader2, FileCheck, AlertCircle } from '@lucide/svelte';

  let {
    lines = 0,
    words = 0,
    renderTimeMs = 0,
    isCompiling = false,
    compilationTimeMs = null as number | null,
    compilationEngine = null as string | null,
    compilationError = false,
    p2pStatus = 'Local-First (Enjambre Activo)'
  } = $props();
</script>

<footer class="h-6 bg-[#161b22] border-t border-[#21262d] px-3 flex items-center justify-between text-[11px] text-[#8b949e] font-mono select-none">
  <div class="flex items-center gap-4">
    <div class="flex items-center gap-1.5 text-[#3fb950]">
      <CheckCircle2 size={12} />
      <span>{p2pStatus}</span>
    </div>

    <!-- Indicador de Compilación LaTeX (TICKET-012) -->
    {#if isCompiling}
      <div class="flex items-center gap-1.5 text-[#e3b341]">
        <Loader2 size={12} class="animate-spin" />
        <span class="font-medium animate-pulse">Compilando LaTeX...</span>
      </div>
    {:else if compilationError}
      <div class="flex items-center gap-1.5 text-[#f85149]" title="Fallo en la compilación LaTeX">
        <AlertCircle size={12} />
        <span>LaTeX Error {compilationTimeMs !== null ? `(${compilationTimeMs} ms)` : ''}</span>
      </div>
    {:else if compilationTimeMs !== null}
      <div class="flex items-center gap-1.5 text-[#3fb950]" title="PDF generado correctamente">
        <FileCheck size={12} />
        <span>LaTeX: {compilationTimeMs} ms {#if compilationEngine}({compilationEngine}){/if}</span>
      </div>
    {/if}

    <div class="flex items-center gap-1.5 text-[#58a6ff]">
      <Zap size={12} />
      <span>Preview: {renderTimeMs} ms</span>
    </div>
  </div>

  <div class="flex items-center gap-4">
    <span>Líneas: {lines}</span>
    <span>Palabras: {words}</span>
    <span class="text-[#e6edf3]">UTF-8</span>
    <span>LaTeX</span>
  </div>
</footer>
