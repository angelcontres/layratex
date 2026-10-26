import { visualToLatex, latexToVisual } from './latexConverter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Fallo en la aserción: ${message}`);
  }
}

console.log('🧪 Iniciando pruebas unitarias de Maquetación Canónica LaTeX Article (TICKET-028)...\n');

// 1. Geometría de página y proporciones canónicas LaTeX
console.log('1. Probando configuración geométrica y preámbulo estándar article...');
const visualDoc = `Texto inicial`;
const latexDoc = visualToLatex(visualDoc, { title: 'Geometría Test', author: 'Dr. Euler' });

assert(latexDoc.includes('\\documentclass[12pt,a4paper]{article}'), 'Debe utilizar \\documentclass[12pt,a4paper]{article}');
assert(latexDoc.includes('\\usepackage{geometry}'), 'Debe incluir paquete geometry');
assert(latexDoc.includes('left=3cm, right=3cm') || latexDoc.includes('top=2.5cm, bottom=2.5cm'), 'Debe definir geometría canónica equilibrada');
assert(latexDoc.includes('\\usepackage{microtype}'), 'Debe incluir microtype para protrusión y justificación');
console.log('  ✓ Geometría de página validada.');

// 2. Secciones no numeradas (\section* con #*) y numeradas
console.log('2. Probando soporte para secciones no numeradas (\\section*)...');
const visualWithStarred = `# 1. Introducción\nTexto de intro.\n\n#* Agradecimientos\nTexto de agradecimientos sin numerar.\n\n##* Apéndice Metodológico\nDetalles técnicos no numerados.`;
const latexStarred = visualToLatex(visualWithStarred, { title: 'Doc' });

assert(latexStarred.includes('\\section{1. Introducción}'), 'Sección estándar debe generar \\section');
assert(latexStarred.includes('\\section*{Agradecimientos}'), '#* debe generar \\section*{} no numerada');
assert(latexStarred.includes('\\subsection*{Apéndice Metodológico}'), '##* debe generar \\subsection*{} no numerada');

const backStarred = latexToVisual(latexStarred);
assert(backStarred.includes('#* Agradecimientos'), 'Debe reconvertir \\section*{} a #*');
assert(backStarred.includes('##* Apéndice Metodológico'), 'Debe reconvertir \\subsection*{} a ##*');
console.log('  ✓ Secciones no numeradas (\\section*) validadas bidireccionalmente.');

// 3. Notas al pie de página (\footnote y markdown [^id])
console.log('3. Probando notas al pie de página (\\footnote, ^[...] y [^id])...');
const visualWithFootnotes = `Este es un texto principal[^1] con una segunda nota^[Nota explicativa directa].\n\n[^1]: Esta es la definición de la primera nota al pie.`;
const latexFootnotes = visualToLatex(visualWithFootnotes, { title: 'Doc' });

assert(latexFootnotes.includes('\\footnote{Esta es la definición de la primera nota al pie.}'), 'Debe convertir [^1] con definición a \\footnote{...}');
assert(latexFootnotes.includes('\\footnote{Nota explicativa directa}'), 'Debe convertir sintaxis inline ^[...] a \\footnote{...}');
assert(!latexFootnotes.includes('[^1]:'), 'La línea de definición no debe quedar en el cuerpo LaTeX');

const latexInputFn = `Texto con nota al pie\\footnote{Explicación de prueba en LaTeX}.`;
const backFn = latexToVisual(latexInputFn);
assert(backFn.includes('^[ Explicación de prueba en LaTeX ]'), 'Debe reconvertir \\footnote{...} a sintaxis visual amigable');
console.log('  ✓ Notas al pie de página (\\footnote) validadas bidireccionalmente.');

// 4. Metadatos académicos con autor y afiliación institucional
console.log('4. Probando bloque académico con autor y afiliación institucional (\\\\)...');
const authorWithAffiliation = 'Dra. María González \\\\ Departamento de Física \\\\ Universidad Autónoma';
const latexAcademic = visualToLatex('Contenido científico', {
  title: 'Análisis Cuántico',
  author: authorWithAffiliation
});

assert(latexAcademic.includes('\\title{Análisis Cuántico}'), 'Debe contener título');
assert(latexAcademic.includes('\\author{Dra. María González \\\\ Departamento de Física \\\\ Universidad Autónoma}'), 'Debe preservar saltos \\\\ para afiliación institucional');
assert(latexAcademic.includes('\\maketitle'), 'Debe incluir \\maketitle');
console.log('  ✓ Bloque académico con afiliación validado.');

// 5. Entorno abstract (Resumen)
console.log('5. Probando integración del entorno canónico abstract...');
const visualWithAbstract = `> **Resumen**\n> Este artículo presenta un nuevo algoritmo.\n\n# Introducción\nComenzamos aquí.`;
const latexAbstract = visualToLatex(visualWithAbstract, { title: 'Paper' });

assert(latexAbstract.includes('\\begin{abstract}'), 'Debe generar \\begin{abstract}');
assert(latexAbstract.includes('Este artículo presenta un nuevo algoritmo.'), 'Debe incluir texto del abstract');
assert(latexAbstract.includes('\\end{abstract}'), 'Debe cerrar \\end{abstract}');

const backAbstract = latexToVisual(latexAbstract);
assert(backAbstract.includes('> **Resumen**'), 'Debe reconvertir abstract a bloque de Resumen');
console.log('  ✓ Entorno canónico abstract validado.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LA CLASE LATEX ARTICLE (TICKET-028) PASARON CON ÉXITO!\n');
