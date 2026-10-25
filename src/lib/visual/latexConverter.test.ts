import { visualToLatex, latexToVisual } from './latexConverter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Fallo en la aserción: ${message}`);
  }
}

console.log('🧪 Iniciando pruebas unitarias de latexConverter (conversión bidireccional)...\n');

// Prueba 1: Encabezados y Formato de texto
console.log('1. Probando encabezados y formato de texto...');
const visualText1 = `# Título Uno\n## Subtítulo Dos\n### Subsección Tres\nTexto con **negrita** y *cursiva*.`;
const latex1 = visualToLatex(visualText1, { title: 'Doc', author: 'Ana' });
assert(latex1.includes('\\section{Título Uno}'), 'Debe generar \\section');
assert(latex1.includes('\\subsection{Subtítulo Dos}'), 'Debe generar \\subsection');
assert(latex1.includes('\\subsubsection{Subsección Tres}'), 'Debe generar \\subsubsection');
assert(latex1.includes('\\textbf{negrita}'), 'Debe generar \\textbf');
assert(latex1.includes('\\textit{cursiva}'), 'Debe generar \\textit');

const back1 = latexToVisual(latex1);
assert(back1.includes('# Título Uno'), 'Debe reconvertir a # Título');
assert(back1.includes('## Subtítulo Dos'), 'Debe reconvertir a ## Subtítulo');
assert(back1.includes('**negrita**'), 'Debe reconvertir a **negrita**');
assert(back1.includes('*cursiva*'), 'Debe reconvertir a *cursiva*');
console.log('  ✓ Encabezados y formato básico validados.');

// Prueba 2: Caracteres especiales fuera de matemáticas (%, _, &)
console.log('2. Probando escape de caracteres especiales reservados (%, _, &)...');
const visualText2 = `Descuento del 25% en la tienda. Variable mi_variable_uno y valor A & B.`;
const latex2 = visualToLatex(visualText2, { title: 'Doc' });
assert(latex2.includes('25\\%'), 'El símbolo % debe escapar a \\%');
assert(latex2.includes('mi\\_variable\\_uno'), 'El guion bajo _ debe escapar a \\_');
assert(latex2.includes('A \\& B'), 'El ampersand & debe escapar a \\&');

const back2 = latexToVisual(latex2);
assert(back2.includes('25%'), 'Debe reconvertir \\% a %');
assert(back2.includes('mi_variable_uno'), 'Debe reconvertir \\_ a _');
assert(back2.includes('A & B'), 'Debe reconvertir \\& a &');
console.log('  ✓ Escape y restauración de caracteres reservados validado.');

// Prueba 3: Ecuaciones matemáticas y fórmulas inline
console.log('3. Probando fórmulas matemáticas (display, inline y AMS)...');
const visualText3 = `Fórmula en línea $E = mc^2$ en el párrafo.\n\n$$\n\\frac{a}{b} = c\n$$\n\n$$\n\\begin{align*}\nx &= y + 1 \\\\\nz &= w + 2\n\\end{align*}\n$$`;
const latex3 = visualToLatex(visualText3, { title: 'Doc' });
assert(latex3.includes('$E = mc^2$'), 'Fórmula inline $...$ debe mantenerse');
assert(latex3.includes('\\[\n\\frac{a}{b} = c\n\\]'), 'Display math debe convertirse a \\[...\\]');
assert(!latex3.includes('\\[\n\\begin{align*}'), 'align* NO debe envolverse en \\[ ... \\]');
assert(latex3.includes('\\begin{align*}'), 'align* debe incluirse directamente');

const back3 = latexToVisual(latex3);
assert(back3.includes('$E = mc^2$'), 'Inline math reconvertido a $...$');
assert(back3.includes('$$\n\\frac{a}{b} = c\n$$'), 'Display math reconvertido a $$...$$');
assert(back3.includes('\\begin{align*}'), 'Entorno align* reconvertido a $$...$$');
console.log('  ✓ Fórmulas matemáticas validadas.');

// Prueba 4: Tablas bidireccionales
console.log('4. Probando tablas bidireccionales...');
const visualText4 = `| Nombre | Rol | Edad |\n| :--- | :--- | :--- |\n| Carlos | Admin | 30 |\n| Laura | Editor | 25 |`;
const latex4 = visualToLatex(visualText4, { title: 'Doc' });
assert(latex4.includes('\\begin{tabular}'), 'Debe generar \\begin{tabular}');
assert(latex4.includes('\\textbf{Nombre} & \\textbf{Rol} & \\textbf{Edad}'), 'Encabezados con \\textbf');
assert(latex4.includes('Carlos & Admin & 30'), 'Filas de datos correctas');

const back4 = latexToVisual(latex4);
assert(back4.includes('| Nombre | Rol | Edad |'), 'Debe reconvertir encabezados de tabla');
assert(back4.includes('| Carlos | Admin | 30 |'), 'Debe reconvertir datos de tabla');
console.log('  ✓ Tablas bidireccionales validadas.');

// Prueba 5: Listas con viñetas, listas numeradas y notas agrupadas
console.log('5. Probando listas con viñetas, numeradas y notas...');
const visualText5 = `* Elemento A\n* Elemento B\n\n1. Paso 1\n2. Paso 2\n\n> Primera línea de nota\n> Segunda línea de nota`;
const latex5 = visualToLatex(visualText5, { title: 'Doc' });
assert(latex5.includes('\\begin{itemize}'), 'Debe generar \\begin{itemize}');
assert(latex5.includes('\\begin{enumerate}'), 'Debe generar \\begin{enumerate}');
assert(latex5.includes('\\begin{quote}'), 'Debe generar \\begin{quote}');
// Asegurar que solo hay UN bloque de quote y no dos
const quoteCount = (latex5.match(/\\begin\{quote\}/g) || []).length;
assert(quoteCount === 1, `Debe haber 1 único quote agrupado, se encontraron ${quoteCount}`);

const back5 = latexToVisual(latex5);
assert(back5.includes('* Elemento A'), 'Debe reconvertir lista con viñetas');
assert(back5.includes('1. Paso 1'), 'Debe reconvertir lista numerada');
assert(back5.includes('> Primera línea de nota\n> Segunda línea de nota'), 'Debe reconvertir nota agrupada');
console.log('  ✓ Listas y notas agrupadas validadas.');

// Prueba 6: Preservación de preámbulo existente
console.log('6. Probando preservación de preámbulo con paquetes personalizados...');
const customPreambleLatex = `\\documentclass[11pt,a4paper]{report}
\\usepackage{tikz}
\\usepackage{booktabs}
\\title{Mi Tesis}
\\author{Roberto}
\\begin{document}
\\maketitle

Antiguo contenido

\\end{document}
`;
const updatedLatex = visualToLatex('Nuevo texto redactado en la hoja', { title: 'Mi Tesis Actualizada', author: 'Roberto G.' }, customPreambleLatex);
assert(updatedLatex.includes('\\documentclass[11pt,a4paper]{report}'), 'Debe preservar \\documentclass personalizado');
assert(updatedLatex.includes('\\usepackage{tikz}'), 'Debe preservar paquete tikz');
assert(updatedLatex.includes('\\usepackage{booktabs}'), 'Debe preservar paquete booktabs');
assert(updatedLatex.includes('\\title{Mi Tesis Actualizada}'), 'Debe actualizar el título');
assert(updatedLatex.includes('\\author{Roberto G.}'), 'Debe actualizar el autor');
assert(updatedLatex.includes('Nuevo texto redactado en la hoja'), 'Debe inyectar el nuevo cuerpo');
console.log('  ✓ Preservación de preámbulo validada.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE CONVERSIÓN BIDIRECCIONAL PASARON CON ÉXITO!\n');
