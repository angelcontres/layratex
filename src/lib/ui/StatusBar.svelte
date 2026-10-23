<script lang="ts">
  import { Zap, CheckCircle2, Loader2, FileCheck, AlertCircle, AlertTriangle } from '@lucide/svelte';

  let {
    lines = 0,
    words = 0,
    renderTimeMs = 0,
    isCompiling = false,
    compilationTimeMs = null as number | null,
    compilationEngine = null as string | null,
    compilationError = false,
    errorCount = 0,
    warningCount = 0,
    p2pStatus = 'Local-First (Enjambre Activo)',
    onToggleErrorPanel = () => {}
  }: {
    lines?: number;
    words?: number;
    renderTimeMs?: number;
    isCompiling?: boolean;
    compilationTimeMs?: number | null;
    compilationEngine?: string | null;
    compilationError?: boolean;
    errorCount?: number;
    warningCount?: number;
    p2pStatus?: string;
    onToggleErrorPanel?: () => void;
  } = $props();
</script>

<footer class="h-6 bg-[#161b22] border-t border-[#21262d] px-3 flex items-center justify-between text-[11px] text-[#8b949e] font-mono select-none">
  <div class="flex items-center gap-4">
    <div class="flex items-center gap-1.5 text-[#3fb950]">
      <CheckCircle2 size={12} />
      <span>{p2pStatus}</span>
    </div>

    <!-- Indicador de Compilación LaTeX y Diagnóstico (TICKET-012, TICKET-013) -->
    {#if isCompiling}
      <div class="flex items-center gap-1.5 text-[#e3b341]">
        <Loader2 size={12} class="animate-spin" />
        <span class="font-medium animate-pulse">Compilando LaTeX...</span>
      </div>
    {:else if compilationError || errorCount > 0}
      <button 
        class="flex items-center gap-1.5 text-[#f85149] hover:text-white transition-colors cursor-pointer bg-[#da3633]/20 px-2 py-0.5 rounded border border-[#da3633]/30" 
        onclick={onToggleErrorPanel}
        title="Abrir/Cerrar panel de diagnóstico de errores"
      >
        <AlertCircle size={12} />
        <span>{errorCount > 0 ? `${errorCount} error(es)` : 'LaTeX Error'} {compilationTimeMs !== null ? `(${compilationTimeMs} ms)` : ''}</span>
      </button>
    {:else if compilationTimeMs !== null}
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5 text-[#3fb950]" title="PDF generado correctamente">
          <FileCheck size={12} />
          <span>LaTeX: {compilationTimeMs} ms {#if compilationEngine}({compilationEngine}){/if}</span>
        </div>
        {#if warningCount > 0}
          <button
            class="flex items-center gap-1 text-[#d29922] hover:text-white transition-colors cursor-pointer bg-[#d29922]/20 px-1.5 py-0.5 rounded border border-[#d29922]/30 text-[10px]"
            onclick={onToggleErrorPanel}
            title="Ver advertencias de LaTeX en el panel"
          >
            <AlertTriangle size={11} />
            <span>{warningCount} adv.</span>
          </button>
        {/if}
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
