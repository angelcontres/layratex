import {
  visualToLatex,
  latexToVisual,
  extractLatexMetadata,
  resolveLatexInputsInMemory,
  splitLatexIntoModularProject,
  syncAssembledLatexToExistingProject
} from './latexConverter';

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
assert(latex4.includes('\\toprule'), 'Debe incluir \\toprule de booktabs');
assert(latex4.includes('\\midrule'), 'Debe incluir \\midrule de booktabs');
assert(latex4.includes('\\bottomrule'), 'Debe incluir \\bottomrule de booktabs');
assert(latex4.includes('\\textbf{Nombre} & \\textbf{Rol} & \\textbf{Edad}'), 'Encabezados con \\textbf');
assert(latex4.includes('Carlos & Admin & 30'), 'Filas de datos correctas');

const back4 = latexToVisual(latex4);
assert(back4.includes('| Nombre | Rol | Edad |'), 'Debe reconvertir encabezados de tabla');
assert(back4.includes('| Carlos | Admin | 30 |'), 'Debe reconvertir datos de tabla');
console.log('  ✓ Tablas bidireccionales con booktabs validadas.');

// Prueba 5: Listas con viñetas, listas numeradas y notas agrupadas
console.log('5. Probando listas con viñetas, numeradas y notas...');
const visualText5 = `* Elemento A\n* Elemento B\n\n1. Paso 1\n2. Paso 2\n\n> Primera línea de nota\n> Segunda línea de nota`;
const latex5 = visualToLatex(visualText5, { title: 'Doc' });
assert(latex5.includes('\\begin{itemize}'), 'Debe generar \\begin{itemize}');
assert(latex5.includes('\\begin{enumerate}'), 'Debe generar \\begin{enumerate}');
assert(latex5.includes('\\begin{quote}'), 'Debe generar \\begin{quote}');
const quoteCount = (latex5.match(/\\begin\{quote\}/g) || []).length;
assert(quoteCount === 1, `Debe haber 1 único quote agrupado, se encontraron ${quoteCount}`);

const back5 = latexToVisual(latex5);
assert(back5.includes('* Elemento A'), 'Debe reconvertir lista con viñetas');
assert(back5.includes('1. Paso 1'), 'Debe reconvertir lista numerada');
assert(back5.includes('> Primera línea de nota\n> Segunda línea de nota'), 'Debe reconvertir nota agrupada');
console.log('  ✓ Listas y notas agrupadas validadas.');

// Prueba 6: Microtipografía (comillas TeX) y entorno abstract
console.log('6. Probando microtipografía (comillas TeX) y entorno abstract...');
const visualText6 = `> **Resumen**\n> Este es el resumen del artículo científico.\n\nTexto con "comillas dobles" en el párrafo.`;
const latex6 = visualToLatex(visualText6, { title: 'Paper Científico' });
assert(latex6.includes('\\begin{abstract}'), 'Debe generar entorno \\begin{abstract}');
assert(latex6.includes('Este es el resumen del artículo científico.'), 'Debe contener el texto del abstract');
assert(latex6.includes("``comillas dobles''"), "Comillas rectas deben transformarse en comillas canónicas TeX ``...''");
assert(latex6.includes('\\usepackage{microtype}'), 'Debe incluir microtype en el preámbulo');
assert(latex6.includes('\\usepackage{booktabs}'), 'Debe incluir booktabs en el preámbulo');

const back6 = latexToVisual(latex6);
assert(back6.includes('> **Resumen**'), 'Debe reconvertir abstract a nota de Resumen');
assert(back6.includes('"comillas dobles"'), 'Debe reconvertir comillas TeX a comillas legibles');
console.log('  ✓ Microtipografía TeX y abstract validados.');

// Prueba 7: Preservación de preámbulo existente
console.log('7. Probando preservación de preámbulo con paquetes personalizados...');
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

// Prueba 8: Entornos académicos (Teorema, Definición, Demostración)
console.log('8. Probando entornos académicos AMS (theorem, definition, proof)...');
const visualText8 = `> **Teorema:** Todo espacio compacto es acotado.\n\n> **Demostración:** Se concluye por recubrimientos finitos.`;
const latex8 = visualToLatex(visualText8, { title: 'Topología' });
assert(latex8.includes('\\begin{theorem}'), 'Debe generar \\begin{theorem}');
assert(latex8.includes('\\begin{proof}'), 'Debe generar \\begin{proof}');
const back8 = latexToVisual(latex8);
assert(back8.includes('> **Teorema:**'), 'Debe reconvertir \\begin{theorem}');
assert(back8.includes('> **Demostración:**'), 'Debe reconvertir \\begin{proof}');
console.log('  ✓ Entornos académicos AMS validados.');

// Prueba 9: Apertura de archivos .tex reales (metadatos con llaves anidadas, comentarios %, \label)
console.log('9. Probando apertura de .tex externo (extractLatexMetadata, comentarios % y \\label)...');
const externalTex = `\\documentclass[12pt]{article}
\\usepackage{amsmath}
\\title{Análisis de \\textbf{Ecuaciones} en $\\mathbb{R}^n$}
\\author{Dra. Elena Gómez \\and Dr. Marco Polo\\thanks{Universidad Nacional}}
\\begin{document}
\\maketitle
% Comentario de línea completa que no debe filtrarse a la hoja visual
\\section{Introducción}\\label{sec:intro}
El rendimiento creció un 95\\% este año. % comentario al final de línea
\\end{document}`;

const meta9 = extractLatexMetadata(externalTex);
assert(meta9.title === 'Análisis de Ecuaciones en $\\mathbb{R}^n$', `Título extraído inesperado: ${meta9.title}`);
assert(meta9.author === 'Dra. Elena Gómez · Dr. Marco Polo', `Autor extraído inesperado: ${meta9.author}`);

const visual9 = latexToVisual(externalTex);
assert(!visual9.includes('Comentario de línea'), 'Los comentarios % no deben aparecer en el documento visual');
assert(!visual9.includes('comentario al final'), 'Los comentarios inline % deben eliminarse');
assert(!visual9.includes('\\label{sec:intro}'), 'Las etiquetas \\label deben limpiarse en modo visual');
assert(visual9.includes('95%'), 'El porcentaje escapado \\% sí debe preservarse como 95%');
console.log('  ✓ Apertura de .tex externo con llaves anidadas y comentarios validada.');

// Prueba 10: Proyectos Multi-Carpeta (\input, \include y splitLatexIntoModularProject) en los 3 modos
console.log('10. Probando división modular por carpetas (secciones/) y resolución de \\input en los 3 modos...');
const fullPaper = visualToLatex(
  `> **Resumen**\n> Resumen del proyecto modular.\n\n# Introducción\nTexto de la primera sección con $E = mc^2$.\n\n# Metodología Experimental\nSegunda sección con **teoremas** y tablas.`,
  { title: 'Proyecto Modular LaTeX', author: 'Equipo Layratex' }
);

const splitResult = splitLatexIntoModularProject(fullPaper, 'secciones');
assert(splitResult.mainTex.includes('\\input{secciones/01-introduccion}'), 'main.tex debe incluir \\input{secciones/01-introduccion}');
assert(splitResult.mainTex.includes('\\input{secciones/02-metodologia-experimental}'), 'main.tex debe incluir \\input{secciones/02-metodologia-experimental}');
assert(splitResult.subfiles.length === 2, `Deben generarse 2 subarchivos en secciones/, se generaron ${splitResult.subfiles.length}`);
assert(splitResult.bibContent.includes('@article{knuth1984'), 'Debe incluir plantilla BibTeX en referencias.bib');

// Construir mapa de archivos como lo entrega open_latex_project / createModularProjectStructure
const projectMap: Record<string, string> = { 'main.tex': splitResult.mainTex };
for (const sf of splitResult.subfiles) {
  projectMap[sf.relative_path] = sf.content;
}

const resolvedFromInputs = resolveLatexInputsInMemory(splitResult.mainTex, projectMap);
assert(resolvedFromInputs.includes('\\section{Introducción}'), 'El resolver debe ensamblar la sección 1 desde secciones/01-introduccion.tex');
assert(resolvedFromInputs.includes('\\section{Metodología Experimental}'), 'El resolver debe ensamblar la sección 2 desde secciones/02-metodologia-experimental.tex');

const visualFromModular = latexToVisual(resolvedFromInputs);
assert(visualFromModular.includes('# Introducción'), 'Modo Hoja Visual debe mostrar # Introducción del proyecto modular');
assert(visualFromModular.includes('# Metodología Experimental'), 'Modo Hoja Visual debe mostrar # Metodología Experimental del proyecto modular');
console.log('  ✓ Proyectos Multi-Carpeta (main.tex + secciones/ + build/) validados en los 3 modos.');

// Prueba 11: Guardado Quirúrgico (syncAssembledLatexToExistingProject) respetando carpetas originales (ej. chapters/)
console.log('11. Probando guardado quirúrgico sobre proyectos existentes con rutas personalizadas (chapters/)...');
const customMainTex = `\\documentclass[12pt]{article}
\\usepackage{amsmath}
\\title{Tesis Doctoral Original}
\\author{Dra. Sofía Vargas}
\\begin{document}
\\maketitle

\\input{chapters/01_intro}
\\input{chapters/02_methods}

\\bibliographystyle{plain}
\\bibliography{referencias}
\\end{document}`;

const customMap: Record<string, string> = {
  'main.tex': customMainTex,
  'chapters/01_intro.tex': '\\section{Introducción}\nTexto original de introducción.\n',
  'chapters/02_methods.tex': '\\section{Métodos}\nTexto original de métodos.\n'
};

// Simulamos edición en el Modo Hoja Visual del documento ensamblado (cambiando contenido + agregando una 3ra sección)
const editedVisual = `# Introducción\nTexto actualizado de introducción con $\\alpha + \\beta$.\n\n# Métodos\nTexto actualizado de métodos experimentales.\n\n# Resultados Finales\nNueva sección añadida desde la Hoja Visual.`;
const assembledEditedTex = visualToLatex(
  editedVisual,
  { title: 'Tesis Doctoral Actualizada', author: 'Dra. Sofía Vargas' },
  customMainTex
);

const surgicalPayload = syncAssembledLatexToExistingProject(
  assembledEditedTex,
  customMainTex,
  customMap
);

assert(
  surgicalPayload.mainTexContent.includes('\\title{Tesis Doctoral Actualizada}'),
  'Debe actualizar \\title en main.tex sin destruir la estructura'
);
assert(
  surgicalPayload.mainTexContent.includes('\\bibliography{referencias}'),
  'Debe preservar comandos de bibliografía en main.tex'
);
assert(
  surgicalPayload.updatedSubfiles[0]?.relative_path === 'chapters/01_intro.tex',
  `El primer subarchivo debe conservar su ruta exacta chapters/01_intro.tex, recibido: ${surgicalPayload.updatedSubfiles[0]?.relative_path}`
);
assert(
  surgicalPayload.updatedSubfiles[0]?.content.includes('Texto actualizado de introducción'),
  'El contenido de chapters/01_intro.tex debe actualizarse quirúrgicamente'
);
assert(
  surgicalPayload.updatedSubfiles[1]?.relative_path === 'chapters/02_methods.tex',
  `El segundo subarchivo debe conservar su ruta exacta chapters/02_methods.tex, recibido: ${surgicalPayload.updatedSubfiles[1]?.relative_path}`
);
assert(
  surgicalPayload.updatedSubfiles[2]?.relative_path.startsWith('chapters/03-resultados-finales'),
  `La nueva sección añadida debe crearse en la misma carpeta chapters/, recibido: ${surgicalPayload.updatedSubfiles[2]?.relative_path}`
);
assert(
  surgicalPayload.mainTexContent.includes('\\input{chapters/03-resultados-finales}'),
  'El nuevo \\input debe insertarse automáticamente en main.tex antes de la bibliografía'
);
console.log('  ✓ Guardado quirúrgico multi-carpeta validado con éxito.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE CONVERSIÓN BIDIRECCIONAL PASARON CON ÉXITO!\n');
