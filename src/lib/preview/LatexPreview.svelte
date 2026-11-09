<script lang="ts">
  import katex from 'katex';
  import { FileText, Download, ExternalLink, Play, Link2, Unlink, Sun, Moon, FileSpreadsheet } from '@lucide/svelte';

  interface Props {
    content?: string;
    pdfBlobUrl?: string | null;
    previewMode?: 'katex' | 'pdf';
    scrollSyncEnabled?: boolean;
    onRenderTime?: (ms: number) => void;
    onExportPdf?: () => void;
    onExportWord?: () => void;
    onOpenNative?: () => void;
    onTriggerCompile?: () => void;
    onScroll?: (el: HTMLElement) => void;
  }

  let {
    content = '',
    pdfBlobUrl = null,
    previewMode = $bindable<'katex' | 'pdf'>('katex'),
    scrollSyncEnabled = $bindable(true),
    onRenderTime = () => {},
    onExportPdf = () => {},
    onExportWord = () => {},
    onOpenNative = () => {},
    onTriggerCompile = () => {},
    onScroll = () => {}
  }: Props = $props();

  let renderedHtml = $state('');
  let previewScrollContainer = $state<HTMLDivElement | null>(null);
  let classicPaperLight = $state(true);

  function handlePreviewScroll() {
    if (previewScrollContainer) {
      onScroll(previewScrollContainer);
    }
  }

  export function getScrollElement(): HTMLElement | null {
    return previewScrollContainer;
  }

  export function setScrollTop(top: number) {
    if (!previewScrollContainer) return;
    previewScrollContainer.scrollTop = top;
  }

  function renderInlineMathInCell(text: string): string {
    return text.replace(/\$([^\$\n]+)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `$${math}$`;
      }
    });
  }

  function parseTabularToBooktabsHtml(tabularBlock: string, tableNumber: number): string {
    const match = tabularBlock.match(/\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/);
    if (!match) return tabularBlock;
    const captionMatch = tabularBlock.match(/\\caption\{([^}]+)\}/);
    const captionText = captionMatch ? captionMatch[1] : 'Datos tabulados';

    const inner = match[1];
    const rawRows = inner.split(/\\\\/);
    const parsedRows: string[][] = [];
    for (const rawRow of rawRows) {
      const cleanRow = rawRow.replace(/\\(hline|toprule|midrule|bottomrule)/g, '').trim();
      if (!cleanRow) continue;
      const cells = cleanRow.split('&').map(cell =>
        renderInlineMathInCell(cell.trim().replace(/\\textbf\{([^}]+)\}/g, '$1'))
      );
      if (cells.length > 0 && !cells.every(c => !c)) parsedRows.push(cells);
    }
    if (parsedRows.length === 0) return '';
    const header = parsedRows[0];
    const dataRows = parsedRows.slice(1);

    let html = `<div class="my-5 flex flex-col items-center">`;
    html += `<div class="text-[10.5pt] mb-2 text-center"><span class="font-bold">Cuadro ${tableNumber}:</span> ${captionText}</div>`;
    html += `<table class="text-[10.5pt] border-collapse">`;
    html += `<thead><tr style="border-top: 1.8px solid currentColor; border-bottom: 1px solid currentColor;">`;
    for (const h of header) {
      html += `<th class="py-1.5 px-4 text-center font-bold">${h}</th>`;
    }
    html += `</tr></thead><tbody style="border-bottom: 1.8px solid currentColor;">`;
    for (let i = 0; i < dataRows.length; i++) {
      html += `<tr>`;
      for (const c of dataRows[i]) {
        html += `<td class="py-1.5 px-4 text-center">${c}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table></div>`;
    return html;
  }

  function renderLatexIncremental(source: string) {
    const t0 = performance.now();
    try {
      let bodyText = source;
      const docMatch = source.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
      if (docMatch) {
        bodyText = docMatch[1];
      }

      // Extraer metadatos \title, \author, \date para \maketitle
      const titleMatch = source.match(/\\title\{([^}]+)\}/);
      const authorMatch = source.match(/\\author\{([^}]+)\}/);
      const dateMatch = source.match(/\\date\{([^}]+)\}/);

      let dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      if (dateMatch && dateMatch[1] && !dateMatch[1].includes('\\today')) {
        dateStr = dateMatch[1];
      }

      let titleHtml = '';
      if (titleMatch) {
        titleHtml = `
          <div class="mt-2 mb-9 text-center">
            <h1 class="text-[21pt] font-normal leading-tight mb-3">${titleMatch[1]}</h1>
            ${authorMatch ? `<div class="text-[12.5pt] font-normal">${authorMatch[1].replace(/\\and/g, ' · ')}</div>` : ''}
            <div class="text-[11pt] opacity-80 mt-1">${dateStr}</div>
          </div>
        `;
      }

      // Stash de bloques ya convertidos a HTML para evitar alteraciones
      const htmlStash: string[] = [];
      const stash = (html: string) => {
        const token = `ZXLTXPRV${htmlStash.length}XZ`;
        htmlStash.push(html);
        return `\n\n${token}\n\n`;
      };

      let eqCounter = 0;
      let tableCounter = 0;
      let thmCounter = 0;

      // 1. Bloques matemáticos \[ ... \] y entornos equation / align
      let processed = bodyText
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
          eqCounter++;
          try {
            const ktx = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
            return stash(`<div class="my-3.5 py-1 relative flex items-center justify-center"><div class="text-center text-[12pt] overflow-x-auto max-w-[85%]">${ktx}</div><span class="absolute right-0 text-[11pt]">(${eqCounter})</span></div>`);
          } catch (e) {
            return stash(`<div class="text-red-500 font-mono text-xs">[Error KaTeX: ${e}]</div>`);
          }
        })
        .replace(/\\begin\{(equation\*?|align\*?|gather\*?|multline\*?)\}([\s\S]*?)\\end\{\1\}/g, (_, env, math) => {
          const isUnnumbered = env.endsWith('*');
          if (!isUnnumbered) eqCounter++;
          try {
            const ktx = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
            const numHtml = !isUnnumbered ? `<span class="absolute right-0 text-[11pt]">(${eqCounter})</span>` : '';
            return stash(`<div class="my-3.5 py-1 relative flex items-center justify-center"><div class="text-center text-[12pt] overflow-x-auto max-w-[85%]">${ktx}</div>${numHtml}</div>`);
          } catch (e) {
            return stash(`<div class="text-red-500 font-mono text-xs">[Error KaTeX: ${e}]</div>`);
          }
        });

      // 2. Tablas booktabs
      processed = processed.replace(/(?:\\begin\{table\}(?:\[.*?\])?\s*(?:\\centering\s*)?)?(?:\\begin\{center\}\s*)?\\begin\{tabular\}\{[^}]*\}[\s\S]*?\\end\{tabular\}(?:\s*\\caption\{[^}]*\})?(?:\s*\\end\{center\})?(?:\s*\\end\{table\})?/g, (match) => {
        tableCounter++;
        return stash(parseTabularToBooktabsHtml(match, tableCounter));
      });

      // 3. Entorno \begin{abstract}
      processed = processed.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (_, abs) => {
        return stash(`
          <div class="my-5 mx-10">
            <div class="text-center font-bold text-[10pt] mb-1.5">Resumen</div>
            <p class="text-[10pt] leading-[1.52] text-justify" style="text-indent: 1.5em;">${renderInlineMathInCell(abs.trim().replace(/\n+/g, ' '))}</p>
          </div>
        `);
      });

      // 4. Entornos académicos theorem, definition, lemma, proof
      processed = processed.replace(/\\begin\{(theorem|lemma)\}([\s\S]*?)\\end\{\1\}/g, (_, env, body) => {
        thmCounter++;
        const label = env === 'lemma' ? 'Lema' : 'Teorema';
        return stash(`<div class="my-3 text-[11.5pt] leading-[1.58] text-justify"><span class="font-bold mr-1.5">${label} ${thmCounter}.</span><span class="italic">${renderInlineMathInCell(body.trim())}</span></div>`);
      });
      processed = processed.replace(/\\begin\{definition\}([\s\S]*?)\\end\{definition\}/g, (_, body) => {
        thmCounter++;
        return stash(`<div class="my-3 text-[11.5pt] leading-[1.58] text-justify"><span class="font-bold mr-1.5">Definición ${thmCounter}.</span><span>${renderInlineMathInCell(body.trim())}</span></div>`);
      });
      processed = processed.replace(/\\begin\{proof\}([\s\S]*?)\\end\{proof\}/g, (_, body) => {
        return stash(`<div class="my-3 text-[11.5pt] leading-[1.58] text-justify"><span class="italic mr-1.5">Demostración.</span><span>${renderInlineMathInCell(body.trim())}</span><span class="float-right ml-3">◻</span></div>`);
      });

      // 5. Listas itemize y enumerate
      processed = processed.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, listBody) => {
        const items = listBody
          .split(/\\item\s+/)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .map((item: string) => `<li class="ml-6 list-disc my-0.5 text-[11.5pt] leading-[1.58] text-justify">${renderInlineMathInCell(item)}</li>`)
          .join('');
        return stash(`<ul class="my-2.5">${items}</ul>`);
      });
      processed = processed.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, listBody) => {
        const items = listBody
          .split(/\\item\s+/)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .map((item: string) => `<li class="ml-6 list-decimal my-0.5 text-[11.5pt] leading-[1.58] text-justify">${renderInlineMathInCell(item)}</li>`)
          .join('');
        return stash(`<ol class="my-2.5">${items}</ol>`);
      });

      // 6. Citas \begin{quote}
      processed = processed.replace(/\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g, (_, q) => {
        return stash(`<blockquote class="my-3 mx-8 text-[11pt] italic text-justify leading-[1.55]">${renderInlineMathInCell(q.trim().replace(/\n/g, '<br/>'))}</blockquote>`);
      });

      // 7. Matemáticas en línea $...$ y \(...\)
      processed = processed
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
          try {
            return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
          } catch {
            return `<span>$${math}$</span>`;
          }
        })
        .replace(/\$([^\$\n]+)\$/g, (_, math) => {
          try {
            return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
          } catch {
            return `<span class="text-red-500">$${math}$</span>`;
          }
        });

      // 8. Secciones numeradas canónicamente (\section, \subsection, \subsubsection)
      let sec1 = 0;
      let sec2 = 0;
      let sec3 = 0;

      processed = processed
        .replace(/\\maketitle/g, '')
        .replace(/\\phantom\{\.\}/g, '')
        .replace(/\\(newpage|clearpage)\b/g, () => stash('<hr class="my-8 border-t border-dashed opacity-30"/>'))
        .replace(/\\section(\*)?\{([^}]+)\}/g, (_, star, title) => {
          if (star) {
            return stash(`<h2 class="text-[15.5pt] font-bold pt-5 pb-2 leading-snug">${title}</h2>`);
          }
          sec1++;
          sec2 = 0;
          sec3 = 0;
          return stash(`<h2 class="text-[15.5pt] font-bold pt-5 pb-2 leading-snug"><span class="mr-3.5">${sec1}</span>${title}</h2>`);
        })
        .replace(/\\subsection(\*)?\{([^}]+)\}/g, (_, star, title) => {
          if (star) {
            return stash(`<h3 class="text-[13pt] font-bold pt-4 pb-1.5 leading-snug">${title}</h3>`);
          }
          sec2++;
          sec3 = 0;
          const p1 = sec1 > 0 ? sec1 : 1;
          return stash(`<h3 class="text-[13pt] font-bold pt-4 pb-1.5 leading-snug"><span class="mr-3">${p1}.${sec2}</span>${title}</h3>`);
        })
        .replace(/\\subsubsection(\*)?\{([^}]+)\}/g, (_, star, title) => {
          if (star) {
            return stash(`<h4 class="text-[11.5pt] font-bold pt-3 pb-1 leading-snug">${title}</h4>`);
          }
          sec3++;
          const p1 = sec1 > 0 ? sec1 : 1;
          const p2 = sec2 > 0 ? sec2 : 1;
          return stash(`<h4 class="text-[11.5pt] font-bold pt-3 pb-1 leading-snug"><span class="mr-2.5">${p1}.${p2}.${sec3}</span>${title}</h4>`);
        });

      // 9. Formato de texto inline y microtipografía TeX
      processed = processed
        .replace(/``([^'\n]+)''/g, '“$1”')
        .replace(/"([^"\n]+)"/g, '“$1”')
        .replace(/(\d+)\s*--\s*(\d+)/g, '$1–$2')
        .replace(/\s+---\s+/g, ' — ')
        .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
        .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
        .replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>')
        .replace(/\\texttt\{([^}]+)\}/g, '<code class="font-paper-mono text-[0.92em]">$1</code>')
        .replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>')
        .replace(/\\%/g, '%')
        .replace(/\\&/g, '&')
        .replace(/\\_/g, '_');

      // 10. Párrafos con regla \noindent tras encabezados y sangría 1.75em en párrafos sucesivos
      let isAfterHeading = true;
      const blocks = processed.split(/\n{2,}/).map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        const stashMatch = trimmed.match(/^ZXLTXPRV(\d+)XZ$/);
        if (stashMatch) {
          const stashedHtml = htmlStash[Number(stashMatch[1])] || '';
          if (stashedHtml.startsWith('<h2') || stashedHtml.startsWith('<h3') || stashedHtml.startsWith('<h4') || stashedHtml.startsWith('<hr')) {
            isAfterHeading = true;
          }
          return stashedHtml;
        }
        const indent = isAfterHeading ? '0' : '1.75em';
        isAfterHeading = false;
        return `<p class="text-[11.5pt] leading-[1.58] text-justify" style="text-indent: ${indent}; margin-bottom: 0;">${trimmed.replace(/\n/g, ' ')}</p>`;
      }).filter(Boolean).join('\n');

      renderedHtml = titleHtml + blocks;
    } catch (err) {
      renderedHtml = `<div class="text-red-500 font-mono text-sm p-4">Error en renderizado: ${err}</div>`;
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
  <!-- Encabezado con Switcher de Vistas (Hoja LaTeX en Vivo / PDF Compilado) -->
  <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#21262d] bg-[#0d1117] text-xs font-mono text-[#8b949e]">
    <div class="flex items-center gap-1 bg-[#161b22] p-0.5 rounded border border-[#30363d]">
      <button 
        class="flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-[11px] cursor-pointer {previewMode === 'katex' ? 'bg-[#1f6feb] text-white font-medium' : 'text-[#8b949e] hover:text-[#c9d1d9]'}"
        onclick={() => previewMode = 'katex'}
      >
        <span class="w-1.5 h-1.5 rounded-full {previewMode === 'katex' ? 'bg-white' : 'bg-[#58a6ff]'}"></span>
        <span>Hoja LaTeX (En Vivo)</span>
      </button>

      <button 
        class="flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-[11px] cursor-pointer {previewMode === 'pdf' ? 'bg-[#238636] text-white font-medium' : 'text-[#8b949e] hover:text-[#c9d1d9]'}"
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
          class="flex items-center gap-1 px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white text-[11px] transition-colors cursor-pointer"
          onclick={() => onOpenNative()}
          title="Abrir en el visor predeterminado del sistema"
        >
          <ExternalLink size={12} />
          <span>Visor SO</span>
        </button>

        <button 
          class="flex items-center gap-1 px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white text-[11px] transition-colors cursor-pointer"
          onclick={() => onExportWord()}
          title="Exportar a Microsoft Word (.docx)"
        >
          <FileSpreadsheet size={12} />
          <span>Word</span>
        </button>

        <button 
          class="flex items-center gap-1 px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white text-[11px] transition-colors cursor-pointer"
          onclick={() => onExportPdf()}
          title="Exportar archivo PDF"
        >
          <Download size={12} />
          <span>PDF</span>
        </button>
      </div>
    {:else}
      <div class="flex items-center gap-2">
        <!-- Selector Papel Blanco Clásico vs Noche -->
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer border bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:text-white"
          onclick={() => classicPaperLight = !classicPaperLight}
          title="Cambiar entre Hoja Blanca LaTeX y Modo Noche"
        >
          {#if classicPaperLight}
            <Sun size={12} class="text-amber-400" />
            <span class="hidden sm:inline">Papel Blanco</span>
          {:else}
            <Moon size={12} class="text-indigo-400" />
            <span class="hidden sm:inline">Papel Noche</span>
          {/if}
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border {scrollSyncEnabled ? 'bg-[#1f6feb26] border-[#1f6feb55] text-[#58a6ff] hover:bg-[#1f6feb3a]' : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'}"
          onclick={() => scrollSyncEnabled = !scrollSyncEnabled}
          title={scrollSyncEnabled ? 'Sincronización de scroll activa. Clic para desactivar.' : 'Sincronización de scroll desactivada. Clic para activar.'}
        >
          {#if scrollSyncEnabled}
            <Link2 size={12} />
            <span>Sync: ON</span>
          {:else}
            <Unlink size={12} />
            <span>Sync: OFF</span>
          {/if}
        </button>
      </div>
    {/if}
  </div>

  <!-- Contenido de Vista Previa -->
  {#if previewMode === 'katex'}
    <div 
      class="flex-1 overflow-auto p-6 lg:p-10 bg-[#181c24]"
      bind:this={previewScrollContainer}
      onscroll={handlePreviewScroll}
    >
      <div
        class="max-w-[780px] mx-auto rounded-[1px] shadow-[0_14px_48px_rgba(0,0,0,0.5)] px-10 sm:px-16 pt-14 pb-12 min-h-[980px] font-paper-serif flex flex-col transition-colors duration-150 {classicPaperLight ? 'bg-white text-black border border-slate-300' : 'bg-[#141821] text-[#e6edf3] border border-white/10'}"
        style="hyphens: auto; -webkit-hyphens: auto;"
      >
        <div class="flex-1">
          {@html renderedHtml}
        </div>
        <div class="pt-8 text-center text-[11pt] opacity-80 mt-auto select-none">
          1
        </div>
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
              Haz clic en el botón inferior para generar el documento PDF con formato editorial LaTeX.
            </p>
          </div>
          <button
            class="px-4 py-2 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center justify-center gap-2 mx-auto transition-colors shadow-sm cursor-pointer"
            onclick={() => onTriggerCompile()}
          >
            <Play size={13} />
            <span>Compilar PDF Ahora (Ctrl+Enter)</span>
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
