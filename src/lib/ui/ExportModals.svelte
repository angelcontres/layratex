<script lang="ts">
  import {
    FileCheck,
    X,
    ExternalLink,
    Download,
    Printer,
    Eye,
    AlertCircle,
    Check,
    Copy
  } from '@lucide/svelte';

  export interface CompiledExportArtifact {
    path: string;
    name: string;
    base64: string | null;
    engine: string;
    durationMs: number;
    format?: 'pdf' | 'docx';
  }

  interface Props {
    showPdfSuccessModal?: boolean;
    lastCompiledPdf?: CompiledExportArtifact | null;
    lastExportedPath?: string | null;
    showErrorModal?: boolean;
    errorModalTitle?: string;
    errorModalMessage?: string;
    errorModalDetails?: string;
    onOpenInSystemViewer?: () => void;
    onExportWord?: () => void;
    onExportPdf?: () => void;
    onPrintVectorSystem?: () => void;
    onViewPdfInApp?: () => void;
  }

  let {
    showPdfSuccessModal = $bindable(false),
    lastCompiledPdf = null,
    lastExportedPath = null,
    showErrorModal = $bindable(false),
    errorModalTitle = '',
    errorModalMessage = '',
    errorModalDetails = '',
    onOpenInSystemViewer,
    onExportWord,
    onExportPdf,
    onPrintVectorSystem,
    onViewPdfInApp
  }: Props = $props();

  let copiedError = $state(false);

  function copyErrorDetails() {
    if (errorModalDetails) {
      navigator.clipboard.writeText(errorModalDetails);
      copiedError = true;
      setTimeout(() => (copiedError = false), 2500);
    }
  }
</script>

<!-- Modal de Éxito de Exportación (PDF o Microsoft Word .docx) -->
{#if showPdfSuccessModal && lastCompiledPdf}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl max-w-md w-full p-6 text-xs text-[#c9d1d9] space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-full bg-[#238636]/20 text-[#3fb950] flex items-center justify-center shrink-0">
            <FileCheck size={18} />
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">
              {lastCompiledPdf.format === 'docx' ? 'Documento Word (.docx) Listo' : 'Compilación PDF Completada'}
            </h3>
            <p class="text-[11px] text-[#8b949e]">Generado con {lastCompiledPdf.engine} en {lastCompiledPdf.durationMs} ms</p>
          </div>
        </div>
        <button 
          class="text-[#8b949e] hover:text-white transition-colors cursor-pointer"
          onclick={() => (showPdfSuccessModal = false)}
        >
          <X size={16} />
        </button>
      </div>

      <div class="p-3 rounded-xs bg-[#0d1117] border border-[#21262d] space-y-1.5 font-mono text-[11px]">
        <div class="flex justify-between items-baseline gap-3">
          <span class="text-[#8b949e] shrink-0">Archivo:</span>
          <span class="text-white font-medium truncate text-right" title={lastCompiledPdf.name}>{lastCompiledPdf.name}</span>
        </div>
        <div class="flex justify-between items-baseline gap-3">
          <span class="text-[#8b949e] shrink-0">Formato:</span>
          <span class="text-[#58a6ff] truncate text-right">
            {lastCompiledPdf.format === 'docx' ? 'Microsoft Word (.docx) + OMML' : 'Adobe PDF Editorial A4 (.pdf)'}
          </span>
        </div>
        <div class="flex justify-between items-baseline gap-3">
          <span class="text-[#8b949e] shrink-0">Tiempo de generación:</span>
          <span class="text-[#3fb950] shrink-0 font-medium">{lastCompiledPdf.durationMs} ms</span>
        </div>
        {#if lastExportedPath}
          <div class="pt-1 border-t border-[#21262d] flex flex-col gap-0.5">
            <span class="text-[#8b949e] text-[10px]">Ubicación guardada:</span>
            <span class="text-white text-[10px] break-all">{lastExportedPath}</span>
          </div>
        {/if}
      </div>

      <div class="space-y-2 pt-1">
        {#if lastCompiledPdf.path}
          <button
            class="w-full py-2.5 px-4 rounded-xs bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            onclick={() => onOpenInSystemViewer?.()}
          >
            <ExternalLink size={14} />
            <span>{lastCompiledPdf.format === 'docx' ? 'Abrir en Microsoft Word / LibreOffice' : 'Abrir en Visor PDF del Sistema'}</span>
          </button>
        {/if}

        {#if lastCompiledPdf.format === 'docx'}
          <button
            class="w-full py-2 px-4 rounded-xs bg-[#21262d] hover:bg-[#30363d] text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            onclick={() => onExportWord?.()}
          >
            <Download size={14} />
            <span>Guardar copia .docx en otra carpeta...</span>
          </button>
        {:else}
          <button
            class="w-full py-2 px-4 rounded-xs bg-[#21262d] hover:bg-[#30363d] text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            onclick={() => onExportPdf?.()}
          >
            <Download size={14} />
            <span>{lastExportedPath ? 'Exportar PDF a otra carpeta...' : 'Guardar / Exportar PDF...'}</span>
          </button>

          <button
            class="w-full py-2 px-4 rounded-xs bg-[#185abd] hover:bg-[#1f6feb] text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            onclick={() => {
              showPdfSuccessModal = false;
              onExportWord?.();
            }}
          >
            <Download size={14} />
            <span>Exportar también en Microsoft Word (.docx)</span>
          </button>

          <button
            class="w-full py-2 px-4 rounded-xs bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
            onclick={() => onPrintVectorSystem?.()}
            title="Imprimir o guardar como PDF vectorial usando el diálogo nativo del sistema"
          >
            <Printer size={14} />
            <span>Imprimir / Guardar Vectorial del Sistema</span>
          </button>

          <button
            class="w-full py-1.5 px-4 rounded-xs hover:bg-[#21262d] text-[#8b949e] hover:text-white font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            onclick={() => {
              showPdfSuccessModal = false;
              onViewPdfInApp?.();
            }}
          >
            <Eye size={13} />
            <span>Ver PDF en Layratex</span>
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Modal de Errores -->
{#if showErrorModal}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-[#161b22] border border-[#da3633]/40 rounded-md shadow-2xl max-w-lg w-full p-6 text-xs text-[#c9d1d9] space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-full bg-[#da3633]/20 text-[#f85149] flex items-center justify-center shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">{errorModalTitle}</h3>
            <p class="text-[11px] text-[#8b949e]">{errorModalMessage}</p>
          </div>
        </div>
        <button 
          class="text-[#8b949e] hover:text-white transition-colors cursor-pointer"
          onclick={() => (showErrorModal = false)}
        >
          <X size={16} />
        </button>
      </div>

      {#if errorModalDetails}
        <div class="relative">
          <div class="p-3 rounded-xs bg-[#0d1117] border border-[#30363d] font-mono text-[10.5px] max-h-56 overflow-y-auto whitespace-pre-wrap text-[#e6edf3] leading-relaxed">
            {errorModalDetails}
          </div>
          <button
            class="absolute top-2 right-2 p-1.5 rounded-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
            onclick={copyErrorDetails}
            title="Copiar contenido"
          >
            {#if copiedError}
              <Check size={11} class="text-[#3fb950]" />
              <span class="text-[#3fb950]">Copiado</span>
            {:else}
              <Copy size={11} />
              <span>Copiar</span>
            {/if}
          </button>
        </div>
      {/if}

      <div class="flex items-center justify-end gap-2 pt-2">
        <button
          class="px-4 py-2 rounded-xs bg-[#21262d] hover:bg-[#30363d] text-white font-medium transition-colors cursor-pointer"
          onclick={() => (showErrorModal = false)}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
{/if}
