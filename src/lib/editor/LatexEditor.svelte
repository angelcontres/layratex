<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorState } from '@codemirror/state';
  import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from '@codemirror/view';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { StreamLanguage, syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
  import { stex } from '@codemirror/legacy-modes/mode/stex';
  import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
  import { Link2, Unlink } from '@lucide/svelte';
  import { createLatexAutocompleteExtension } from './latexAutocomplete';

  let {
    content = $bindable('\\documentclass{article}\n\\title{Documento Layratex}\n\\begin{document}\n\\maketitle\n\n\\section{Introducción}\n¡Bienvenido a Layratex! Este es un editor híbrido local-first.\n\n\\subsection{Fórmulas Matemáticas}\nPodemos escribir ecuaciones en línea como $E = mc^2$ o en bloque destacado:\n\n\\[\n\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n\\]\n\n\\end{document}'),
    onChange = (val: string) => {},
    onStatsChange = (stats: { lines: number; words: number }) => {},
    onScroll = (el: HTMLElement) => {},
    scrollSyncEnabled = $bindable(true)
  } = $props();

  let editorContainer: HTMLDivElement;
  let view: EditorView | null = null;

  // Dark theme minimalista y de alto contraste para CodeMirror 6 con autocompletado LaTeX
  const darkTheme = EditorView.theme({
    "&": {
      color: "#e6edf3",
      backgroundColor: "#0d1117",
      height: "100%",
    },
    ".cm-content": {
      caretColor: "#58a6ff",
      padding: "16px 8px",
      fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
      fontSize: "14px",
      lineHeight: "1.6"
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#58a6ff",
      borderLeftWidth: "2px"
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "#1f6feb44 !important"
    },
    ".cm-gutters": {
      backgroundColor: "#0d1117",
      color: "#484f58",
      borderRight: "1px solid #21262d",
      paddingRight: "8px"
    },
    ".cm-activeLine": {
      backgroundColor: "#161b2288"
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#161b22",
      color: "#8b949e"
    },
    // Estilos personalizados para el panel de autocompletado y snippets LaTeX
    ".cm-tooltip.cm-tooltip-autocomplete": {
      backgroundColor: "#161b22",
      border: "1px solid #30363d",
      borderRadius: "8px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
      overflow: "hidden",
      minWidth: "260px",
      maxWidth: "460px",
      zIndex: "100"
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul": {
      fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
      fontSize: "13px",
      maxHeight: "260px",
      padding: "4px"
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
      padding: "5px 10px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "#c9d1d9",
      cursor: "pointer"
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: "#1f6feb26",
      color: "#58a6ff"
    },
    ".cm-completionLabel": {
      fontWeight: "600",
      color: "#e6edf3"
    },
    ".cm-completionMatchedText": {
      color: "#58a6ff !important",
      fontWeight: "bold",
      textDecoration: "underline 1px"
    },
    ".cm-completionDetail": {
      fontStyle: "normal",
      fontSize: "11px",
      color: "#8b949e",
      marginLeft: "auto",
      paddingLeft: "8px"
    },
    ".cm-tooltip.cm-completionInfo": {
      backgroundColor: "#161b22",
      border: "1px solid #30363d",
      borderRadius: "6px",
      padding: "8px 12px",
      color: "#c9d1d9",
      fontSize: "12px",
      maxWidth: "320px",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
      lineHeight: "1.5"
    },
    ".cm-completionIcon": {
      opacity: "0.85"
    },
    ".cm-snippetField": {
      backgroundColor: "#1f6feb33",
      outline: "1px solid #58a6ff",
      borderRadius: "2px"
    }
  }, { dark: true });

  function calculateStats(text: string) {
    const lines = text.split('\n').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    onStatsChange({ lines, words });
  }

  onMount(() => {
    const startState = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        highlightSelectionMatches(),
        StreamLanguage.define(stex),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        darkTheme,
        ...createLatexAutocompleteExtension(),
        search({ top: true }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newDoc = update.state.doc.toString();
            content = newDoc;
            onChange(newDoc);
            calculateStats(newDoc);
          }
        })
      ]
    });

    view = new EditorView({
      state: startState,
      parent: editorContainer
    });

    view.scrollDOM.addEventListener('scroll', handleEditorScroll, { passive: true });

    calculateStats(content);
  });

  function handleEditorScroll() {
    if (!view) return;
    onScroll(view.scrollDOM);
  }

  // Sincronizar contenido externo cuando cambie (ej. al abrir archivo o crear nuevo documento)
  $effect(() => {
    if (view && content !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content }
      });
      calculateStats(content);
    }
  });

  /**
   * Salta a una línea específica en CodeMirror, posicionando el cursor y haciendo scroll suave.
   */
  export function goToLine(lineNumber: number) {
    if (!view) return;
    const doc = view.state.doc;
    const targetLine = Math.max(1, Math.min(lineNumber, doc.lines));
    const lineInfo = doc.line(targetLine);

    view.dispatch({
      selection: { anchor: lineInfo.from },
      effects: EditorView.scrollIntoView(lineInfo.from, { y: 'center' })
    });
    view.focus();
  }

  /**
   * Retorna el elemento DOM con scroll activo de CodeMirror 6 (.cm-scroller)
   */
  export function getScrollElement(): HTMLElement | null {
    return view ? view.scrollDOM : null;
  }

  /**
   * Posiciona el scroll de CodeMirror según una posición absoluta scrollTop en píxeles.
   */
  export function setScrollTop(top: number) {
    if (!view) return;
    view.scrollDOM.scrollTop = top;
  }

  onDestroy(() => {
    if (view) {
      view.scrollDOM.removeEventListener('scroll', handleEditorScroll);
      view.destroy();
    }
  });
</script>

<div class="h-full w-full overflow-hidden flex flex-col bg-[#0d1117]">
  <div class="flex items-center justify-between px-4 py-2 border-b border-[#21262d] bg-[#161b22] text-xs font-mono text-[#8b949e]">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-[#238636]"></span>
      <span>main.tex</span>
      <span class="text-[#58a6ff] bg-[#1f6feb1f] px-1.5 py-0.5 rounded text-[10px]">LaTeX 2e</span>
    </div>
    <div class="flex items-center gap-3">
      <!-- Botón de Sincronización de Scroll Bidireccional (TICKET-023) -->
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
      <div class="text-[11px] text-[#8b949e]">
        Modo: Código (CodeMirror 6)
      </div>
    </div>
  </div>
  <div class="flex-1 overflow-hidden" bind:this={editorContainer}></div>
</div>
