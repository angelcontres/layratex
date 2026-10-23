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
  <div class="border-t border-[#21262d] bg-[#161b22] flex flex-col transition-all duration-150 z-30 select-none shadow-lg">
    <!-- Barra Superior / Encabezado del Panel -->
    <div class="h-9 px-3 flex items-center justify-between bg-[#0d1117] border-b border-[#21262d] text-xs">
      <div class="flex items-center gap-3">
        <button 
          class="flex items-center gap-1.5 font-semibold text-[#c9d1d9] hover:text-white transition-colors cursor-pointer"
          onclick={() => isCollapsed = !isCollapsed}
          title={isCollapsed ? 'Expandir panel de errores' : 'Minimizar panel'}
        >
          {#if isCollapsed}
            <ChevronUp size={14} />
          {:else}
            <ChevronDown size={14} />
          {/if}
          <span class="flex items-center gap-1">
            <Terminal size={13} class="text-[#58a6ff]" />
            <span>Diagnóstico LaTeX</span>
          </span>
        </button>

        <!-- Filtros rápidos con contadores tipo badges -->
        <div class="flex items-center gap-1.5 text-[11px]">
          <button
            class="px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 {activeFilter === 'all' ? 'bg-[#21262d] text-white font-medium' : 'text-[#8b949e] hover:text-[#c9d1d9]'}"
            onclick={() => activeFilter = 'all'}
          >
            <span>Todos</span>
            <span class="bg-[#30363d] px-1 rounded-full text-[10px]">{issues.length}</span>
          </button>

          <button
            class="px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 {activeFilter === 'error' ? 'bg-[#da3633]/25 text-[#f85149] font-medium border border-[#da3633]/40' : 'text-[#8b949e] hover:text-[#f85149]'}"
            onclick={() => activeFilter = 'error'}
          >
            <AlertCircle size={12} class="text-[#f85149]" />
            <span>Errores</span>
            <span class="{errors.length > 0 ? 'bg-[#da3633] text-white' : 'bg-[#30363d] text-[#8b949e]'} px-1 rounded-full text-[10px] font-mono">
              {errors.length}
            </span>
          </button>

          <button
            class="px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 {activeFilter === 'warning' ? 'bg-[#d29922]/25 text-[#d29922] font-medium border border-[#d29922]/40' : 'text-[#8b949e] hover:text-[#d29922]'}"
            onclick={() => activeFilter = 'warning'}
          >
            <AlertTriangle size={12} class="text-[#d29922]" />
            <span>Advertencias</span>
            <span class="{warnings.length > 0 ? 'bg-[#d29922] text-black font-semibold' : 'bg-[#30363d] text-[#8b949e]'} px-1 rounded-full text-[10px] font-mono">
              {warnings.length}
            </span>
          </button>

          <button
            class="px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 {activeFilter === 'badbox' ? 'bg-[#8b949e]/20 text-[#c9d1d9] font-medium border border-[#8b949e]/30' : 'text-[#8b949e] hover:text-[#c9d1d9]'}"
            onclick={() => activeFilter = 'badbox'}
          >
            <Info size={12} class="text-[#8b949e]" />
            <span>Bad Boxes</span>
            <span class="bg-[#30363d] text-[#8b949e] px-1 rounded-full text-[10px] font-mono">
              {badboxes.length}
            </span>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="text-[#8b949e] hover:text-white p-1 rounded hover:bg-[#21262d] transition-colors cursor-pointer"
          onclick={() => {
            isOpen = false;
            onClose();
          }}
          title="Cerrar panel de errores"
        >
          <X size={14} />
        </button>
      </div>
    </div>

    <!-- Contenido Expandible del Panel -->
    {#if !isCollapsed}
      <div class="h-48 overflow-y-auto font-sans text-xs bg-[#0d1117]/80 divide-y divide-[#21262d]">
        {#if filteredIssues.length === 0}
          <div class="p-6 text-center text-[#8b949e] flex flex-col items-center justify-center gap-1.5">
            <span class="text-sm">No se encontraron incidencias en esta categoría</span>
            <span class="text-[11px] text-[#484f58]">El código LaTeX no reportó problemas de compilación aquí.</span>
          </div>
        {:else}
          {#each filteredIssues as issue (issue.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="px-3 py-2 flex items-start gap-3 hover:bg-[#161b22] transition-colors group cursor-pointer"
              onclick={() => handleLineClick(issue.line)}
            >
              <!-- Icono según severidad -->
              <div class="mt-0.5 shrink-0">
                {#if issue.type === 'error'}
                  <div class="w-5 h-5 rounded flex items-center justify-center bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/30">
                    <AlertCircle size={13} />
                  </div>
                {:else if issue.type === 'warning'}
                  <div class="w-5 h-5 rounded flex items-center justify-center bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/30">
                    <AlertTriangle size={13} />
                  </div>
                {:else}
                  <div class="w-5 h-5 rounded flex items-center justify-center bg-[#8b949e]/15 text-[#8b949e] border border-[#8b949e]/25">
                    <Info size={13} />
                  </div>
                {/if}
              </div>

              <!-- Mensaje & Detalles -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Tag de Línea Clicable -->
                  {#if issue.line !== null}
                    <span 
                      class="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40 flex items-center gap-1 group-hover:bg-[#1f6feb] group-hover:text-white transition-colors"
                      title="Ir a línea {issue.line}"
                    >
                      <CornerDownRight size={10} />
                      <span>Línea {issue.line}</span>
                    </span>
                  {:else}
                    <span class="px-1.5 py-0.5 rounded font-mono text-[10px] bg-[#21262d] text-[#8b949e]">
                      Global
                    </span>
                  {/if}

                  {#if issue.file}
                    <span class="text-[10px] font-mono text-[#8b949e] truncate" title={issue.file}>
                      {issue.file}
                    </span>
                  {/if}

                  <span class="font-medium text-[#e6edf3] break-words">
                    {issue.message}
                  </span>
                </div>

                <!-- Detalle adicional o contexto del código si existe -->
                {#if issue.detail}
                  <pre class="mt-1 p-1.5 rounded bg-[#161b22] border border-[#21262d] font-mono text-[11px] text-[#8b949e] whitespace-pre-wrap leading-relaxed select-text">{issue.detail}</pre>
                {/if}
              </div>

              <!-- Botón explícito para saltar a línea -->
              {#if issue.line !== null}
                <div class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-1 text-[11px] text-[#58a6ff]">
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
