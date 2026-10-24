import {
  ALL_LATEX_COMPLETIONS,
  LATEX_ENVIRONMENTS,
  structureCommands,
  formatCommands,
  environmentCommands,
  quickSnippets,
  mathCommands,
  latexCompletionSource,
  latexAutoCloseInputHandler,
  handleEnterAfterBegin,
  createLatexAutocompleteExtension
} from './latexAutocomplete';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { CompletionContext } from '@codemirror/autocomplete';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

console.log('🧪 Starting TICKET-022 Autocomplete and Snippets Tests...\n');

// 1. Validar Catálogo de Comandos
console.log('Testing command catalogs...');
assert(structureCommands.length >= 6, 'Should have structure commands');
const hasDocClass = structureCommands.some(c => c.label === '\\documentclass');
const hasUsePackage = structureCommands.some(c => c.label === '\\usepackage');
const hasSection = structureCommands.some(c => c.label === '\\section');
const hasSubsection = structureCommands.some(c => c.label === '\\subsection');
const hasParagraph = structureCommands.some(c => c.label === '\\paragraph');
const hasTOC = structureCommands.some(c => c.label === '\\tableofcontents');
assert(hasDocClass && hasUsePackage && hasSection && hasSubsection && hasParagraph && hasTOC, 'All required structure commands must exist');
console.log('  ✓ Structure commands verified');

// Format commands
assert(formatCommands.length >= 5, 'Should have format commands');
const hasBold = formatCommands.some(c => c.label === '\\textbf');
const hasItalic = formatCommands.some(c => c.label === '\\textit');
const hasTeletype = formatCommands.some(c => c.label === '\\texttt');
const hasUnderline = formatCommands.some(c => c.label === '\\underline');
const hasEmph = formatCommands.some(c => c.label === '\\emph');
assert(hasBold && hasItalic && hasTeletype && hasUnderline && hasEmph, 'All required format commands must exist');
console.log('  ✓ Format commands verified');

// Environments
assert(LATEX_ENVIRONMENTS.length >= 6, 'Should have environments catalog');
const requiredEnvs = ['equation', 'align', 'gather', 'matrix', 'pmatrix', 'bmatrix'];
for (const env of requiredEnvs) {
  assert(LATEX_ENVIRONMENTS.some(e => e.name === env), `Environment ${env} must exist in catalog`);
}
console.log('  ✓ Math environments verified');

// Math commands
assert(mathCommands.length >= 10, 'Should have math commands');
const requiredMath = ['\\frac', '\\sqrt', '\\sum', '\\int', '\\lim', '\\alpha', '\\beta'];
for (const cmd of requiredMath) {
  assert(mathCommands.some(c => c.label === cmd), `Math command ${cmd} must exist`);
}
console.log('  ✓ Math commands and greek symbols verified');

// Quick snippets for figures and tables
const hasFigureSnippet = quickSnippets.some(s => s.label === '\\figure' || s.label === '\\fig');
const hasTableSnippet = quickSnippets.some(s => s.label === '\\table' || s.label === '\\tab');
assert(hasFigureSnippet && hasTableSnippet, 'Figure and Table quick snippets must exist');
console.log('  ✓ Quick snippets for figures and tables verified');

// 2. Probar CompletionSource al escribir '\'
console.log('\nTesting CompletionSource...');
const stateBackslash = EditorState.create({
  doc: '\\sec'
});
const ctxBackslash = new CompletionContext(stateBackslash, 4, false);
const resultBackslash = latexCompletionSource(ctxBackslash);
assert(resultBackslash !== null, 'CompletionSource should trigger when typing backslash');
assert(resultBackslash!.from === 0, 'CompletionSource should replace from the backslash position');
assert(resultBackslash!.options.length === ALL_LATEX_COMPLETIONS.length, 'Should return all completion options for fuzzy filtering');
console.log('  ✓ Backslash trigger & fuzzy matching options verified');

// 3. Probar CompletionSource dentro de \begin{
const stateInsideEnv = EditorState.create({
  doc: '\\begin{mat'
});
const ctxInsideEnv = new CompletionContext(stateInsideEnv, 10, false);
const resultInsideEnv = latexCompletionSource(ctxInsideEnv);
assert(resultInsideEnv !== null, 'CompletionSource should trigger inside \\begin{');
assert(resultInsideEnv!.from === 7, 'CompletionSource should replace environment name position');
assert(resultInsideEnv!.options.some(o => o.label === 'matrix'), 'Should suggest matrix environment');
console.log('  ✓ Contextual environment completion inside \\begin{ verified');

// 4. Probar handleEnterAfterBegin
console.log('\nTesting Enter after \\begin{equation}...');
const docWithBegin = '\\begin{equation}';
let viewState = EditorState.create({
  doc: docWithBegin,
  selection: { anchor: docWithBegin.length }
});
let dispatched = false;
let updatedDoc = '';
let updatedCursor = 0;
const mockView: any = {
  state: viewState,
  dispatch: (tr: any) => {
    dispatched = true;
    const insert = tr.changes.insert;
    const from = tr.changes.from;
    updatedDoc = docWithBegin.slice(0, from) + insert + docWithBegin.slice(from);
    updatedCursor = tr.selection.anchor;
  }
};

const enterHandled = handleEnterAfterBegin(mockView);
assert(enterHandled === true, 'handleEnterAfterBegin should handle enter right after \\begin{equation}');
assert(updatedDoc.includes('\\begin{equation}\n  \n\\end{equation}'), 'Should generate \\end{equation} with indented line');
console.log('  ✓ Auto-closing \\begin{equation} on Enter verified');

// 5. Validar que la extensión de CodeMirror se construye sin errores
console.log('\nTesting createLatexAutocompleteExtension...');
const extensions = createLatexAutocompleteExtension();
assert(Array.isArray(extensions) && extensions.length > 0, 'Extensions should be an array');
console.log('  ✓ Extensions created successfully');

console.log('\n🎉 ALL TESTS PASSED! TICKET-022 requirements fully satisfied.\n');
