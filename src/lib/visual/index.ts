/**
 * Subsistema de Edición Visual "PaperCraft" y Conversión Bidireccional (`src/lib/visual`)
 *
 * Agrupa el lienzo A4 físico con tipografía Computer Modern (`PaperEditor`),
 * el transpilador bidireccional LaTeX ⇄ Visual (`latexConverter`), los constructores
 * interactivos de ecuaciones y tablas, y el catálogo de plantillas canónicas.
 */

export { default as PaperEditor } from './PaperEditor.svelte';
export { default as FloatingToolbar } from './FloatingToolbar.svelte';
export { default as SlashMenu } from './SlashMenu.svelte';
export { default as MathBuilderModal } from './MathBuilderModal.svelte';
export { default as TableBuilderModal } from './TableBuilderModal.svelte';
export { default as KeyboardHelpModal } from './KeyboardHelpModal.svelte';

export {
  visualToLatex,
  latexToVisual,
  extractLatexMetadata,
  resolveLatexInputsInMemory,
  splitLatexIntoModularProject,
  syncAssembledLatexToExistingProject,
  type VisualDocMetadata,
  type ModularSubfileItem,
  type ModularProjectSplitResult,
  type SurgicalProjectSavePayload
} from './latexConverter';

export { TEMPLATE_PRESETS, type DocumentTemplate } from './templatePresets';
export { WELCOME_TITLE, WELCOME_CONTENT } from './welcomeDocument';
