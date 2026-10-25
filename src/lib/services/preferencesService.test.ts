import { preferencesService, DEFAULT_PREFERENCES, type UserPreferences } from './preferencesService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Fallo en la aserción: ${message}`);
  }
}

function assertStrictEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(`❌ Fallo en la aserción: ${message || ''} (esperado ${expected}, obtenido ${actual})`);
  }
}

// Mock localStorage for test runner
class LocalStorageMock {
  store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

// Setup global window and localStorage mocks
(globalThis as any).window = {
  matchMedia: (query: string) => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {}
  })
};
(globalThis as any).localStorage = new LocalStorageMock();
(globalThis as any).document = {
  documentElement: {
    setAttribute: () => {},
    classList: {
      add: () => {},
      remove: () => {}
    }
  }
};

console.log('🧪 Iniciando pruebas de preferencesService...');

// Test 1: Defaults
const defaults = preferencesService.getPreferences();
assertStrictEqual(defaults.theme, 'dark');
assertStrictEqual(defaults.paperTone, 'dark');
assertStrictEqual(defaults.paperFont, 'serif');
assertStrictEqual(defaults.autoSave, true);
assertStrictEqual(defaults.autoSaveIntervalSec, 2);
console.log('  ✓ Valores predeterminados verificados correctamente.');

// Test 2: Save and Load partial updates
const updated = preferencesService.savePreferences({
  theme: 'light',
  paperTone: 'cream',
  autoSaveIntervalSec: 5
});
assertStrictEqual(updated.theme, 'light');
assertStrictEqual(updated.paperTone, 'cream');
assertStrictEqual(updated.autoSaveIntervalSec, 5);

const reloaded = preferencesService.getPreferences();
assertStrictEqual(reloaded.theme, 'light');
assertStrictEqual(reloaded.paperTone, 'cream');
assertStrictEqual(reloaded.autoSaveIntervalSec, 5);
assertStrictEqual(reloaded.paperFont, 'serif', 'Mantiene valores existentes no modificados');
console.log('  ✓ Guardado y recuperación reactiva en localStorage verificado.');

// Test 3: Theme resolution
assertStrictEqual(preferencesService.resolveTheme('light'), 'light');
assertStrictEqual(preferencesService.resolveTheme('dark'), 'dark');
assertStrictEqual(preferencesService.resolveTheme('system'), 'dark');
console.log('  ✓ Resolución de temas (light / dark / system) verificada.');

// Test 4: Reset
const resetPrefs = preferencesService.reset();
assertStrictEqual(resetPrefs.theme, 'dark');
assertStrictEqual(resetPrefs.paperTone, 'dark');
assertStrictEqual(resetPrefs.autoSaveIntervalSec, 2);
console.log('  ✓ Restablecimiento a valores por defecto verificado.');

console.log('🎉 ¡Todas las pruebas de preferencesService pasaron con éxito!\n');
