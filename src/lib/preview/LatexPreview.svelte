<script lang="ts">
  import katex from 'katex';

  let {
    content = '',
    onRenderTime = (ms: number) => {}
  } = $props();

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
  <div class="flex items-center justify-between px-4 py-2 border-b border-[#21262d] bg-[#0d1117] text-xs font-mono text-[#8b949e]">
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-[#58a6ff] animate-pulse"></span>
      <span class="text-white font-semibold">Live Preview</span>
      <span class="text-[#3fb950] bg-[#2386361a] px-1.5 py-0.5 rounded text-[10px]">KaTeX Vectorial</span>
    </div>
    <div class="text-[11px] text-[#8b949e]">
      Actualización en tiempo real (&lt; 10 ms)
    </div>
  </div>
  
  <div class="flex-1 overflow-auto p-8 lg:p-12 bg-[#0d1117]">
    <div class="max-w-2xl mx-auto bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl p-8 sm:p-12 text-[#c9d1d9] min-h-[600px]">
      {@html renderedHtml}
    </div>
  </div>
</div>
