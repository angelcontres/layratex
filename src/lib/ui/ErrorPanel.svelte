<script lang="ts">
  import type { LogIssue, LogIssueType } from '../services/latexLogParser';
  import { 
    AlertCircle, 
    AlertTriangle, 
    Info, 
    ChevronDown, 
    ChevronUp, 
    X, 
    CornerDownRight,
    Terminal
  } from '@lucide/svelte';

  let {
    issues = [],
    isOpen = $bindable(false),
    onSelectIssue = (line: number) => {},
    onClose = () => {}
  }: {
    issues: LogIssue[];
    isOpen: boolean;
    onSelectIssue?: (line: number) => void;
    onClose?: () => void;
  } = $props();

  let activeFilter = $state<'all' | 'error' | 'warning' | 'badbox'>('all');
  let isCollapsed = $state(false);

  const errors = $derived(issues.filter(i => i.type === 'error'));
  const warnings = $derived(issues.filter(i => i.type === 'warning'));
  const badboxes = $derived(issues.filter(i => i.type === 'badbox'));

  const filteredIssues = $derived(
    activeFilter === 'all' 
      ? issues 
      : issues.filter(i => i.type === activeFilter)
  );

  function handleLineClick(line: number | null) {
    if (line !== null && line > 0) {
      onSelectIssue(line);
    }
  }
</script>

{#if isOpen}
  <div 
    class="border-t border-white/10 bg-[#090d16]/95 backdrop-blur-md flex flex-col transition-all duration-200 z-30 select-none shadow-2xl overflow-hidden shrink-0"
    role="region"
    aria-label="Panel de diagnóstico de compilación"
  >
    <!-- Barra Superior / Encabezado del Panel (Anti-Desbordamiento) -->
    <div class="h-10 px-3.5 flex items-center justify-between gap-2 bg-[#0e1320] border-b border-white/10 text-xs min-w-0">
      <div class="flex items-center gap-2.5 min-w-0 flex-1 overflow-x-auto">
        <button 
          class="flex items-center gap-1.5 font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
          onclick={() => isCollapsed = !isCollapsed}
          title={isCollapsed ? 'Expandir panel de errores' : 'Minimizar panel'}
        >
          {#if isCollapsed}
            <ChevronUp size={14} />
          {:else}
            <ChevronDown size={14} />
          {/if}
          <div class="flex items-center gap-1.5">
            <Terminal size={14} class="text-indigo-400" />
            <span class="font-mono text-[11px] font-bold">Diagnóstico LaTeX</span>
          </div>
        </button>

        <span class="text-white/10 hidden sm:inline shrink-0">|</span>

        <!-- Filtros rápidos con contadores tipo badges -->
        <div class="flex items-center gap-1.5 text-[11px] shrink-0">
          <button
            class="px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 {activeFilter === 'all' ? 'bg-white/10 text-white font-medium ring-1 ring-white/15' : 'text-slate-400 hover:text-slate-200'}"
            onclick={() => activeFilter = 'all'}
          >
            <span>Todos</span>
            <span class="bg-white/10 px-1.5 rounded-full text-[10px] font-mono">{issues.length}</span>
          </button>

          <button
            class="px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 {activeFilter === 'error' ? 'bg-rose-500/20 text-rose-300 font-medium ring-1 ring-rose-500/40' : 'text-slate-400 hover:text-rose-400'}"
            onclick={() => activeFilter = 'error'}
          >
            <AlertCircle size={12} class="text-rose-400 shrink-0" />
            <span class="hidden sm:inline">Errores</span>
            <span class="{errors.length > 0 ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-400'} px-1.5 rounded-full text-[10px] font-mono font-bold">
              {errors.length}
            </span>
          </button>

          <button
            class="px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 {activeFilter === 'warning' ? 'bg-amber-500/20 text-amber-300 font-medium ring-1 ring-amber-500/40' : 'text-slate-400 hover:text-amber-400'}"
            onclick={() => activeFilter = 'warning'}
          >
            <AlertTriangle size={12} class="text-amber-400 shrink-0" />
            <span class="hidden sm:inline">Advertencias</span>
            <span class="{warnings.length > 0 ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/10 text-slate-400'} px-1.5 rounded-full text-[10px] font-mono">
              {warnings.length}
            </span>
          </button>

          <button
            class="px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 {activeFilter === 'badbox' ? 'bg-indigo-500/20 text-indigo-300 font-medium ring-1 ring-indigo-500/40' : 'text-slate-400 hover:text-indigo-300'}"
            onclick={() => activeFilter = 'badbox'}
          >
            <Info size={12} class="text-indigo-400 shrink-0" />
            <span class="hidden md:inline">Bad Boxes</span>
            <span class="bg-white/10 text-slate-400 px-1.5 rounded-full text-[10px] font-mono">
              {badboxes.length}
            </span>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <button
          class="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          onclick={() => {
            isOpen = false;
            onClose();
          }}
          title="Cerrar panel de errores"
        >
          <X size={15} />
        </button>
      </div>
    </div>

    <!-- Contenido Expandible del Panel -->
    {#if !isCollapsed}
      <div class="h-44 sm:h-52 overflow-y-auto overflow-x-hidden font-sans text-xs bg-[#090d16]/90 divide-y divide-white/5">
        {#if filteredIssues.length === 0}
          <div class="p-6 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
            <span class="text-sm font-medium text-slate-300">No se encontraron incidencias en esta categoría</span>
            <span class="text-[11px] text-slate-500">El motor LaTeX no reportó problemas de compilación aquí.</span>
          </div>
        {:else}
          {#each filteredIssues as issue (issue.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="px-3.5 py-2.5 flex items-start gap-3 hover:bg-white/5 transition-colors group cursor-pointer min-w-0"
              onclick={() => handleLineClick(issue.line)}
            >
              <!-- Icono según severidad -->
              <div class="mt-0.5 shrink-0">
                {#if issue.type === 'error'}
                  <div class="w-5 h-5 rounded-md flex items-center justify-center bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40">
                    <AlertCircle size={13} />
                  </div>
                {:else if issue.type === 'warning'}
                  <div class="w-5 h-5 rounded-md flex items-center justify-center bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40">
                    <AlertTriangle size={13} />
                  </div>
                {:else}
                  <div class="w-5 h-5 rounded-md flex items-center justify-center bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40">
                    <Info size={13} />
                  </div>
                {/if}
              </div>

              <!-- Mensaje & Detalles -->
              <div class="flex-1 min-w-0 overflow-hidden">
                <div class="flex items-center gap-2 flex-wrap min-w-0">
                  <!-- Tag de Línea Clicable -->
                  {#if issue.line !== null}
                    <span 
                      class="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/35 flex items-center gap-1 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0"
                      title="Ir a línea {issue.line}"
                    >
                      <CornerDownRight size={10} />
                      <span>Línea {issue.line}</span>
                    </span>
                  {:else}
                    <span class="px-1.5 py-0.5 rounded font-mono text-[10px] bg-white/5 text-slate-400 shrink-0">
                      Global
                    </span>
                  {/if}

                  {#if issue.file}
                    <span class="text-[10px] font-mono text-slate-400 truncate max-w-xs" title={issue.file}>
                      {issue.file}
                    </span>
                  {/if}

                  <span class="font-medium text-slate-100 break-words flex-1 min-w-0">
                    {issue.message}
                  </span>
                </div>

                <!-- Detalle adicional o contexto del código si existe (Anti-Desbordamiento) -->
                {#if issue.detail}
                  <pre class="mt-1.5 p-2 rounded-md bg-[#0e1320] border border-white/5 font-mono text-[10.5px] text-slate-300 whitespace-pre-wrap break-all leading-relaxed select-text overflow-hidden">{issue.detail}</pre>
                {/if}
              </div>

              <!-- Botón explícito para saltar a línea -->
              {#if issue.line !== null}
                <div class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hidden sm:flex items-center gap-1 text-[11px] text-indigo-400">
                  <span>Ir a línea {issue.line}</span>
                  <CornerDownRight size={12} />
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
{/if}
