<script lang="ts">
  import katex from 'katex';
  import { FileText, Download, ExternalLink, Play } from '@lucide/svelte';

  interface Props {
    content?: string;
    pdfBlobUrl?: string | null;
    previewMode?: 'katex' | 'pdf';
    onRenderTime?: (ms: number) => void;
    onExportPdf?: () => void;
    onOpenNative?: () => void;
    onTriggerCompile?: () => void;
  }

  let {
    content = '',
    pdfBlobUrl = null,
    previewMode = $bindable<'katex' | 'pdf'>('katex'),
    onRenderTime = () => {},
    onExportPdf = () => {},
    onOpenNative = () => {},
    onTriggerCompile = () => {}
  }: Props = $props();

  let renderedHtml = $state('');

  function renderLatexIncremental(source: string) {
    const t0 = performance.now();
    try {
      // 1. Extraer o aislar \begin{document}...\end{document} si existe
      let bodyText = source;
      const docMatch = source.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
      if (docMatch) {
        bodyText = docMatch[1];
      }

      // 2. Extraer título si existe en preámbulo o cuerpo
      const titleMatch = source.match(/\\title\{([^}]+)\}/);
      let titleHtml = '';
      if (titleMatch) {
        titleHtml = `<h1 class="text-3xl font-bold border-b border-[#30363d] pb-3 mb-6 text-white text-center font-serif">${titleMatch[1]}</h1>`;
      }

      // 3. Renderizar Bloques Matemáticos \[ ... \] o \begin{equation}...\end{equation}
      let processed = bodyText
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
          try {
            return `<div class="my-4 py-2 overflow-x-auto text-center">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
          } catch (e) {
            return `<div class="text-red-400 font-mono text-sm">[Error KaTeX: ${e}]</div>`;
          }
        })
        .replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_, math) => {
          try {
            return `<div class="my-4 py-2 overflow-x-auto text-center">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
          } catch (e) {
            return `<div class="text-red-400 font-mono text-sm">[Error KaTeX: ${e}]</div>`;
          }
        });

      // 4. Renderizar Matemáticas en línea $...$
      processed = processed.replace(/\$([^\$\n]+)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="text-red-400">$${math}$</span>`;
        }
      });

      // 5. Renderizar Secciones y Estructura
      processed = processed
        .replace(/\\maketitle/g, '')
        .replace(/\\section\*?\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-6 mb-3 text-[#58a6ff] border-b border-[#21262d] pb-1 font-serif">$1</h2>')
        .replace(/\\subsection\*?\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-4 mb-2 text-[#79c0ff] font-serif">$1</h3>')
        .replace(/\\subsubsection\*?\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-3 mb-1 text-[#d2a8ff] font-serif">$1</h4>')
        .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
        .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
        .replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>')
        .replace(/\\item\s+(.*)/g, '<li class="ml-6 list-disc text-[#c9d1d9] mb-1">$1</li>');

      // 6. Párrafos
      const paragraphs = processed.split(/\n{2,}/).map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<div') || trimmed.startsWith('<li')) {
          return trimmed;
        }
        return `<p class="leading-relaxed mb-4 text-[#e6edf3] font-serif text-base">${trimmed.replace(/\n/g, ' ')}</p>`;
      }).join('\n');

      renderedHtml = titleHtml + paragraphs;
    } catch (err) {
      renderedHtml = `<div class="text-red-400 font-mono text-sm p-4">Error en renderizado: ${err}</div>`;
    } finally {
      const ms = Math.round((performance.now() - t0) * 10) / 10;
      onRenderTime(ms);
    }
  }

  $effect(() => {
    renderLatexIncremental(content);
  });
</script>

<div class="h-full w-full overflow-hidden flex flex-col bg-[#161b22]">
  <!-- Encabezado con Switcher de Vistas (KaTeX / PDF Compilado) -->
  <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#21262d] bg-[#0d1117] text-xs font-mono text-[#8b949e]">
    <div class="flex items-center gap-1 bg-[#161b22] p-0.5 rounded border border-[#30363d]">
      <button 
        class="flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-[11px] {previewMode === 'katex' ? 'bg-[#1f6feb] text-white font-medium' : 'text-[#8b949e] hover:text-[#c9d1d9]'}"
        onclick={() => previewMode = 'katex'}
      >
        <span class="w-1.5 h-1.5 rounded-full {previewMode === 'katex' ? 'bg-white' : 'bg-[#58a6ff]'}"></span>
        <span>KaTeX (En Vivo)</span>
      </button>

      <button 
        class="flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-[11px] {previewMode === 'pdf' ? 'bg-[#238636] text-white font-medium' : 'text-[#8b949e] hover:text-[#c9d1d9]'}"
        onclick={() => previewMode = 'pdf'}
      >
        <FileText size={12} />
        <span>PDF Compilado</span>
        {#if pdfBlobUrl}
          <span class="w-1.5 h-1.5 rounded-full bg-[#3fb950]"></span>
        {/if}
      </button>
    </div>

    {#if previewMode === 'pdf' && pdfBlobUrl}
      <div class="flex items-center gap-2">
        <button 
          class="flex items-center gap-1 px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white text-[11px] transition-colors"
          onclick={() => onOpenNative()}
          title="Abrir en el visor predeterminado del sistema"
        >
          <ExternalLink size={12} />
          <span>Visor SO</span>
        </button>

        <button 
          class="flex items-center gap-1 px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white text-[11px] transition-colors"
          onclick={() => onExportPdf()}
          title="Exportar archivo PDF"
        >
          <Download size={12} />
          <span>Exportar</span>
        </button>
      </div>
    {:else}
      <div class="text-[11px] text-[#8b949e] hidden sm:block">
        KaTeX Reactivo (&lt; 10 ms)
      </div>
    {/if}
  </div>

  <!-- Contenido de Vista Previa -->
  {#if previewMode === 'katex'}
    <div class="flex-1 overflow-auto p-8 lg:p-12 bg-[#0d1117]">
      <div class="max-w-2xl mx-auto bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl p-8 sm:p-12 text-[#c9d1d9] min-h-[600px]">
        {@html renderedHtml}
      </div>
    </div>
  {:else}
    <!-- Vista Previa de Documento PDF Real -->
    <div class="flex-1 w-full h-full overflow-hidden bg-[#0d1117] flex flex-col items-center justify-center">
      {#if pdfBlobUrl}
        <iframe
          src={pdfBlobUrl}
          title="Previsualización PDF Compilado"
          class="w-full h-full border-0 bg-[#21262d]"
        ></iframe>
      {:else}
        <div class="p-8 text-center max-w-sm space-y-4">
          <div class="w-14 h-14 mx-auto rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
            <FileText size={28} />
          </div>
          <div>
            <h4 class="text-white font-semibold text-sm">Sin Documento PDF Compilado</h4>
            <p class="text-xs text-[#8b949e] mt-1 leading-relaxed">
              El motor LaTeX aún no ha generado el archivo binario PDF para este documento.
            </p>
          </div>
          <button
            class="px-4 py-2 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center justify-center gap-2 mx-auto transition-colors shadow-sm"
            onclick={() => onTriggerCompile()}
          >
            <Play size={13} />
            <span>Compilar Ahora (Ctrl+B)</span>
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
