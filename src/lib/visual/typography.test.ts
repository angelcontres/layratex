import fs from 'fs';
import path from 'path';
import { DEFAULT_PREFERENCES } from '../services/preferencesService';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${msg}`);
  }
}

console.log('🧪 Iniciando pruebas de Tipografía Oficial TeX Computer Modern (TICKET-027)...\n');

// 1. Verificar existencia física offline de los archivos WOFF2
const fontsDir = path.resolve(process.cwd(), 'src/assets/fonts/cmu');
assert(fs.existsSync(fontsDir), 'El directorio src/assets/fonts/cmu debe existir');

const requiredFonts = [
  'cmu-serif-500-roman.woff2',
  'cmu-serif-500-italic.woff2',
  'cmu-serif-700-roman.woff2',
  'cmu-serif-700-italic.woff2',
  'cmu-sans-serif-500-roman.woff2',
  'cmu-sans-serif-500-italic.woff2',
  'cmu-sans-serif-700-roman.woff2',
  'cmu-sans-serif-700-italic.woff2',
  'cmu-typewriter-text-500-roman.woff2',
  'cmu-typewriter-text-500-italic.woff2',
  'cmu-typewriter-text-700-roman.woff2',
  'cmu-typewriter-text-700-italic.woff2'
];

for (const fontFile of requiredFonts) {
  const filePath = path.join(fontsDir, fontFile);
  assert(fs.existsSync(filePath), `Debe existir la fuente ${fontFile}`);
  const stats = fs.statSync(filePath);
  assert(stats.size > 50000, `La fuente ${fontFile} debe tener un tamaño válido (>50KB)`);
}
console.log('  ✓ 12 archivos WOFF2 de Computer Modern (Serif, Sans y Typewriter) verificados offline.');

// 2. Verificar reglas @font-face y ligaduras en app.css
const cssPath = path.resolve(process.cwd(), 'src/app.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

assert(cssContent.includes("font-family: 'CMU Serif'"), 'Debe declarar @font-face para CMU Serif');
assert(cssContent.includes("font-family: 'Computer Modern'"), 'Debe declarar @font-face para Computer Modern');
assert(cssContent.includes("font-family: 'CMU Sans Serif'"), 'Debe declarar @font-face para CMU Sans Serif');
assert(cssContent.includes("font-family: 'CMU Typewriter Text'"), 'Debe declarar @font-face para CMU Typewriter Text');
assert(cssContent.includes('font-feature-settings: "liga" 1, "dlig" 1'), 'Debe habilitar ligaduras tipográficas TeX (liga y dlig)');
assert(cssContent.includes('.font-paper-serif'), 'Debe existir la clase de utilidad .font-paper-serif');
console.log('  ✓ Reglas @font-face y ligaduras TeX verificadas en src/app.css.');

// 3. Verificar que Computer Modern / serif es la preferencia predeterminada
assert(DEFAULT_PREFERENCES.paperFont === 'serif', 'La tipografía predeterminada debe ser serif (Computer Modern)');
console.log('  ✓ Computer Modern configurada como tipografía estándar por defecto.');

console.log('\n🎉 TODAS LAS PRUEBAS DE TIPOGRAFÍA COMPUTER MODERN PASARON CON ÉXITO.\n');
