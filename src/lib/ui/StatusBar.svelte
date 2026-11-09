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
    isLight = false,
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
    isLight?: boolean;
    onToggleErrorPanel?: () => void;
  } = $props();
</script>

<footer class="h-6 {isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#161b22] border-[#21262d] text-[#8b949e]'} border-t px-3 flex items-center justify-between text-[11px] font-mono select-none transition-colors duration-150 overflow-hidden shrink-0">
  <div class="flex items-center gap-3 min-w-0 overflow-hidden">
    <div class="flex items-center gap-1.5 shrink-0 {isLight ? 'text-emerald-600' : 'text-[#3fb950]'}">
      <CheckCircle2 size={12} />
      <span class="truncate max-w-[180px]">{p2pStatus}</span>
    </div>

    <!-- Indicador de Compilación LaTeX y Diagnóstico (TICKET-012, TICKET-013) -->
    {#if isCompiling}
      <div class="flex items-center gap-1.5 shrink-0 {isLight ? 'text-amber-600' : 'text-[#e3b341]'}">
        <Loader2 size={12} class="animate-spin" />
        <span class="font-medium animate-pulse">Compilando...</span>
      </div>
    {:else if compilationError || errorCount > 0}
      <button 
        class="flex items-center gap-1.5 shrink-0 {isLight ? 'text-red-700 bg-red-100 border-red-300' : 'text-[#f85149] bg-[#da3633]/20 border-[#da3633]/30'} hover:opacity-80 transition-colors cursor-pointer px-2 py-0.5 rounded border" 
        onclick={onToggleErrorPanel}
        title="Abrir/Cerrar panel de diagnóstico de errores"
      >
        <AlertCircle size={12} />
        <span class="truncate">{errorCount > 0 ? `${errorCount} error(es)` : 'LaTeX Error'} {compilationTimeMs !== null ? `(${compilationTimeMs} ms)` : ''}</span>
      </button>
    {:else if compilationTimeMs !== null}
      <div class="flex items-center gap-2 shrink-0 truncate">
        <div class="flex items-center gap-1.5 truncate {isLight ? 'text-emerald-700' : 'text-[#3fb950]'}" title="PDF generado correctamente">
          <FileCheck size={12} class="shrink-0" />
          <span class="truncate">LaTeX: {compilationTimeMs} ms {#if compilationEngine}({compilationEngine}){/if}</span>
        </div>
        {#if warningCount > 0}
          <button
            class="flex items-center gap-1 shrink-0 {isLight ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-[#d29922] bg-[#d29922]/20 border-[#d29922]/30'} hover:opacity-80 transition-colors cursor-pointer px-1.5 py-0.5 rounded border text-[10px]"
            onclick={onToggleErrorPanel}
            title="Ver advertencias de LaTeX en el panel"
          >
            <AlertTriangle size={11} />
            <span>{warningCount} adv.</span>
          </button>
        {/if}
      </div>
    {/if}

    <div class="hidden sm:flex items-center gap-1.5 shrink-0 {isLight ? 'text-indigo-600' : 'text-[#58a6ff]'}">
      <Zap size={12} />
      <span>Preview: {renderTimeMs} ms</span>
    </div>
  </div>

  <div class="flex items-center gap-3 shrink-0 ml-2">
    <span>L: {lines}</span>
    <span>P: {words}</span>
    <span class="{isLight ? 'text-slate-800' : 'text-[#e6edf3]'} hidden xs:inline">UTF-8</span>
    <span class="hidden md:inline">LaTeX</span>
  </div>
</footer>
