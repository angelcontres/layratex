/**
 * Subsistema de Edición de Código Fuente LaTeX (`src/lib/editor`)
 *
 * Encapsula CodeMirror 6 con resaltado sintáctico TeX, autocompletado inteligente
 * contextual, cierre automático de entornos `\begin{...}` y búsqueda/reemplazo.
 */

export { default as LatexEditor } from './LatexEditor.svelte';
export {
  createLatexAutocompleteExtension,
  latexCompletionSource,
  ALL_LATEX_COMPLETIONS
} from './latexAutocomplete';
