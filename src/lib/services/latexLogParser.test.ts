import { parseLatexLog } from './latexLogParser';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- Iniciando Pruebas de latexLogParser ---');

// Test 1: Error clásico de TeX con número de línea
{
  const log = `
This is pdfTeX, Version 3.141592653-2.6-1.40.24
entering extended mode
(./document.tex
! Undefined control sequence.
<argument> \\invalidmacro
l.15 \\invalidmacro
                   {argument}
[1] )
(see the transcript file for additional information)
! ==> Fatal error occurred, no output PDF file produced!
  `;
  const issues = parseLatexLog(log);
  console.log('Test 1 Issues:', issues);
  assert(issues.length === 1, `Debe haber 1 error, obtenido ${issues.length}`);
  assert(issues[0].type === 'error', 'El tipo debe ser error');
  assert(issues[0].line === 15, `La línea debe ser 15, obtenido ${issues[0].line}`);
  assert(issues[0].message.includes('Undefined control sequence'), 'El mensaje debe indicar undefined control sequence');
  console.log('✓ Test 1 Pasado: Error clásico TeX parseado correctamente.');
}

// Test 2: Error en formato file-line-error
{
  const log = `
./document.tex:28: LaTeX Error: Environment equation* undefined.

See the LaTeX manual or LaTeX Companion for explanation.
Type  H <return>  for immediate help.
 ...                                              
                                                  
l.28 \\begin{equation*}
  `;
  const issues = parseLatexLog(log);
  console.log('Test 2 Issues:', issues);
  assert(issues.length >= 1, 'Debe detectar al menos 1 error');
  assert(issues[0].type === 'error', 'El tipo debe ser error');
  assert(issues[0].line === 28, `La línea debe ser 28, obtenido ${issues[0].line}`);
  assert(issues[0].file === 'document.tex', `El archivo debe ser document.tex, obtenido ${issues[0].file}`);
  console.log('✓ Test 2 Pasado: Error file-line-error parseado.');
}

// Test 3: Advertencias de LaTeX (referencias o citas indefinidas)
{
  const log = `
LaTeX Warning: Reference 'sec:intro' on page 1 undefined on input line 42.
Package hyperref Warning: Token not allowed in a PDF string (PDFDocEncoding):
(hyperref)                removing '\math' on input line 88.
  `;
  const issues = parseLatexLog(log);
  console.log('Test 3 Issues:', issues);
  assert(issues.length === 2, `Deben haber 2 advertencias, obtenido ${issues.length}`);
  assert(issues[0].type === 'warning', 'Primer issue debe ser warning');
  assert(issues[0].line === 42, `Línea de primera advertencia debe ser 42, obtenido ${issues[0].line}`);
  assert(issues[1].type === 'warning', 'Segundo issue debe ser warning');
  assert(issues[1].line === 88, `Línea de segunda advertencia debe ser 88, obtenido ${issues[1].line}`);
  console.log('✓ Test 3 Pasado: Advertencias parseadas.');
}

// Test 4: Bad Boxes (Overfull / Underfull \hbox y \vbox)
{
  const log = `
Overfull \\hbox (15.2pt too wide) in paragraph at lines 19--24
Underfull \\vbox (badness 10000) has occurred while \\output is active [1]
  `;
  const issues = parseLatexLog(log);
  console.log('Test 4 Issues:', issues);
  assert(issues.length === 2, `Deben haber 2 bad boxes, obtenido ${issues.length}`);
  assert(issues[0].type === 'badbox', 'Primer issue debe ser badbox');
  assert(issues[0].line === 19, `Línea de primer badbox debe ser 19, obtenido ${issues[0].line}`);
  assert(issues[1].type === 'badbox', 'Segundo issue debe ser badbox');
  assert(issues[1].line === null, 'Línea de segundo badbox debe ser null');
  console.log('✓ Test 4 Pasado: Bad boxes parseados.');
}

// Test 5: Error estilo Tectonic / CLI
{
  const log = `
error: ./document.tex:12: undefined control sequence
  `;
  const issues = parseLatexLog(log);
  console.log('Test 5 Issues:', issues);
  assert(issues.length === 1, 'Debe detectar 1 error de CLI');
  assert(issues[0].type === 'error', 'Debe ser de tipo error');
  assert(issues[0].line === 12, `Línea debe ser 12, obtenido ${issues[0].line}`);
  console.log('✓ Test 5 Pasado: Error estilo CLI parseado.');
}

// Test 6: Entrada vacía
{
  const issues = parseLatexLog('');
  assert(issues.length === 0, 'Entrada vacía debe retornar arreglo vacío');
  console.log('✓ Test 6 Pasado: Manejo de entrada vacía.');
}

console.log('🎉 ¡Todas las pruebas unitarias pasaron con éxito!');
