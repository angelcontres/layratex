<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorState } from '@codemirror/state';
  import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from '@codemirror/view';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { StreamLanguage, syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
  import { stex } from '@codemirror/legacy-modes/mode/stex';

  let {
    content = $bindable('\\documentclass{article}\n\\title{Documento Layratex}\n\\begin{document}\n\\maketitle\n\n\\section{Introducción}\n¡Bienvenido a Layratex! Este es un editor híbrido local-first.\n\n\\subsection{Fórmulas Matemáticas}\nPodemos escribir ecuaciones en línea como $E = mc^2$ o en bloque destacado:\n\n\\[\n\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n\\]\n\n\\end{document}'),
    onChange = (val: string) => {},
    onStatsChange = (stats: { lines: number; words: number }) => {}
  } = $props();

  let editorContainer: HTMLDivElement;
  let view: EditorView | null = null;

  // Dark theme minimalista y de alto contraste para CodeMirror 6
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
        StreamLanguage.define(stex),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        darkTheme,
        keymap.of([...defaultKeymap, ...historyKeymap]),
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

    calculateStats(content);
  });

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

  onDestroy(() => {
    if (view) {
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
    <div class="text-[11px] text-[#8b949e]">
      Modo: Código (CodeMirror 6)
    </div>
  </div>
  <div class="flex-1 overflow-hidden" bind:this={editorContainer}></div>
</div>
