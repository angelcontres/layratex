import { generateLatexStyledDocxBytes, latexMathToOmmlInner } from './wordExportService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Fallo en la aserción: ${message}`);
  }
}

console.log('🧪 Iniciando pruebas unitarias de wordExportService (.docx OpenXML + OMML)...\n');

// 1. Verificar conversión de matemáticas LaTeX a Office Math (OMML)
console.log('1. Probando convertidor LaTeX -> Office Math (OMML)...');
const ommlFrac = latexMathToOmmlInner('\\frac{\\Delta x}{\\Delta t}');
assert(ommlFrac.includes('<m:f>'), 'Debe generar nodo de fracción <m:f>');
assert(ommlFrac.includes('<m:num>') && ommlFrac.includes('<m:den>'), 'Debe incluir numerador y denominador OMML');
assert(ommlFrac.includes('Δ'), 'Debe traducir \\Delta al símbolo matemático Δ');

const ommlSupSub = latexMathToOmmlInner('x_i^2 + \\sqrt{y}');
assert(ommlSupSub.includes('<m:sSubSup>') || ommlSupSub.includes('<m:sSup>'), 'Debe generar sub/superíndices OMML');
assert(ommlSupSub.includes('<m:rad>'), 'Debe generar radical <m:rad> para \\sqrt');
console.log('  ✓ Fórmulas LaTeX convertidas a estructuras nativas Office Math (<m:oMath>).');

// 2. Verificar generación de archivo binario ZIP (.docx) válido con estructura OpenXML
console.log('2. Probando empaquetado binario .docx y estética LaTeX...');
const sampleDoc = `> **Resumen**
> Resumen científico de prueba para exportación a Microsoft Word.

# Introducción

Primer párrafo sin sangría tras el encabezado.

Segundo párrafo con sangría canónica de primera línea y fórmula inline $E = mc^2$.

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

> **Teorema:** Todo espacio compacto es completo.

> **Demostración:** Se sigue de la propiedad de recubrimientos finitos.

| Algoritmo | Complejidad |
| :--- | :--- |
| Quicksort | $O(n \\log n)$ |
`;

const docxBytes = generateLatexStyledDocxBytes(sampleDoc, {
  title: 'Artículo de Prueba Layratex',
  author: 'Autor Académico',
  fontStyle: 'serif'
});

// Verificar firma mágica PK\x03\x04 de archivo ZIP (.docx)
assert(docxBytes.length > 2000, 'El archivo .docx generado debe tener tamaño válido (> 2 KB)');
assert(docxBytes[0] === 0x50 && docxBytes[1] === 0x4b && docxBytes[2] === 0x03 && docxBytes[3] === 0x04, 'Debe iniciar con la firma ZIP estándar PK\\x03\\x04');

// Decodificar contenido del contenedor para verificar los archivos XML internos
const archiveText = new TextDecoder().decode(docxBytes);
assert(archiveText.includes('[Content_Types].xml'), 'Debe incluir [Content_Types].xml');
assert(archiveText.includes('word/document.xml'), 'Debe incluir word/document.xml');
assert(archiveText.includes('word/styles.xml'), 'Debe incluir word/styles.xml');
assert(archiveText.includes('CMU Serif'), 'Debe configurar la tipografía oficial CMU Serif de LaTeX');
assert(archiveText.includes('<m:oMathPara>'), 'Debe incluir ecuaciones en bloque Office Math (<m:oMathPara>)');
assert(archiveText.includes('(1)'), 'Debe incluir numeración canónica de ecuación (1) a la derecha');
assert(archiveText.includes('Teorema 1.'), 'Debe numerar automáticamente los teoremas (Teorema 1.)');
assert(archiveText.includes('Demostración.'), 'Debe incluir entorno de demostración con símbolo Q.E.D.');
assert(archiveText.includes('Cuadro 1:'), 'Debe incluir título de tabla estilo LaTeX (Cuadro 1:)');
console.log('  ✓ Contenedor binario .docx OpenXML verificado con éxito.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE EXPORTACIÓN A WORD (.DOCX) PASARON CON ÉXITO!\n');
