<script lang="ts">
  import { 
    X, 
    Settings, 
    Palette, 
    FileText, 
    Sliders, 
    RotateCcw, 
    Check, 
    Sun, 
    Moon, 
    Laptop, 
    Type, 
    BookOpen, 
    Columns, 
    Cpu, 
    Save, 
    Eye,
    Scroll
  } from '@lucide/svelte';
  import { 
    preferencesService, 
    DEFAULT_PREFERENCES, 
    type UserPreferences, 
    type AppTheme, 
    type PaperTone, 
    type PaperFont, 
    type SheetMode, 
    type CompilationEnginePreference 
  } from '../services/preferencesService';

  let {
    show = $bindable(false),
    isLight = false,
    onPreferencesChanged = (prefs: UserPreferences) => {}
  }: {
    show: boolean;
    isLight?: boolean;
    onPreferencesChanged?: (prefs: UserPreferences) => void;
  } = $props();

  let activeCategory = $state<'appearance' | 'sheet' | 'editor'>('appearance');

  // Copia local de trabajo de las preferencias
  let prefs = $state<UserPreferences>(preferencesService.getPreferences());

  $effect(() => {
    if (show) {
      prefs = preferencesService.getPreferences();
    }
  });

  function updateField<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    prefs[key] = value;
    const updated = preferencesService.savePreferences({ [key]: value });
    onPreferencesChanged(updated);
  }

  function handleReset() {
    const defaults = preferencesService.reset();
    prefs = defaults;
    onPreferencesChanged(defaults);
  }

  function handleClose() {
    show = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && show) {
      e.preventDefault();
      handleClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if show}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div 
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    onclick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="pref-modal-title"
    tabindex="-1"
  >
    <!-- Modal Container -->
    <div class="w-full max-w-2xl rounded-2xl {isLight ? 'bg-white text-slate-800 border-slate-200 shadow-2xl' : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] shadow-2xl'} border flex flex-col max-h-[85vh] overflow-hidden">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b {isLight ? 'border-slate-200 bg-slate-50' : 'border-[#21262d] bg-[#0d1117]'} flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg {isLight ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/20 text-indigo-400'} flex items-center justify-center">
            <Settings size={18} />
          </div>
          <div>
            <h2 id="pref-modal-title" class="text-sm font-bold {isLight ? 'text-slate-900' : 'text-white'}">
              Preferencias de Layratex
            </h2>
            <p class="text-[11px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
              Personaliza la apariencia, el modo hoja y el motor editorial
            </p>
          </div>
        </div>
        <button 
          type="button"
          class="p-1.5 rounded-lg {isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'hover:bg-[#21262d] text-[#8b949e] hover:text-white'} transition-colors cursor-pointer"
          onclick={handleClose}
          title="Cerrar (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b {isLight ? 'border-slate-200 bg-slate-50/50' : 'border-[#21262d] bg-[#0d1117]/50'} px-6 gap-2 text-xs font-medium">
        <button
          type="button"
          class="flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-all cursor-pointer {activeCategory === 'appearance' ? (isLight ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-indigo-400 text-white font-semibold') : 'border-transparent ' + (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-[#8b949e] hover:text-white')}"
          onclick={() => activeCategory = 'appearance'}
        >
          <Palette size={14} />
          <span>Apariencia & Estética</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-all cursor-pointer {activeCategory === 'sheet' ? (isLight ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-indigo-400 text-white font-semibold') : 'border-transparent ' + (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-[#8b949e] hover:text-white')}"
          onclick={() => activeCategory = 'sheet'}
        >
          <FileText size={14} />
          <span>Modo Hoja (PaperCraft)</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-all cursor-pointer {activeCategory === 'editor' ? (isLight ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-indigo-400 text-white font-semibold') : 'border-transparent ' + (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-[#8b949e] hover:text-white')}"
          onclick={() => activeCategory = 'editor'}
        >
          <Sliders size={14} />
          <span>Editor & Compilación</span>
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-6 overflow-y-auto space-y-6 text-xs flex-1">
        
        {#if activeCategory === 'appearance'}
          <!-- 1. Tema de la Aplicación -->
          <div class="space-y-3">
            <div>
              <h3 class="font-semibold text-sm {isLight ? 'text-slate-900' : 'text-white'}">
                Tema de la Aplicación
              </h3>
              <p class="text-[11px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                Define el esquema de color general para barras, menús y modales
              </p>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <!-- Dark Theme -->
              <button
                type="button"
                class="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center cursor-pointer {prefs.theme === 'dark' ? 'border-indigo-500 bg-indigo-500/10 shadow-xs' : (isLight ? 'border-slate-200 hover:border-slate-300 bg-slate-50' : 'border-[#30363d] hover:border-[#484f58] bg-[#0d1117]')}"
                onclick={() => updateField('theme', 'dark')}
              >
                <div class="w-8 h-8 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-slate-200">
                  <Moon size={16} />
                </div>
                <div class="font-medium {prefs.theme === 'dark' ? 'text-indigo-400' : (isLight ? 'text-slate-800' : 'text-slate-200')}">
                  Modo Oscuro
                </div>
                <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                  Grafito GitHub
                </div>
              </button>

              <!-- Light Theme -->
              <button
                type="button"
                class="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center cursor-pointer {prefs.theme === 'light' ? 'border-indigo-500 bg-indigo-500/10 shadow-xs' : (isLight ? 'border-slate-200 hover:border-slate-300 bg-slate-50' : 'border-[#30363d] hover:border-[#484f58] bg-[#0d1117]')}"
                onclick={() => updateField('theme', 'light')}
              >
                <div class="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-amber-500">
                  <Sun size={16} />
                </div>
                <div class="font-medium {prefs.theme === 'light' ? 'text-indigo-600' : (isLight ? 'text-slate-800' : 'text-slate-200')}">
                  Modo Claro
                </div>
                <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                  Limpio y luminoso
                </div>
              </button>

              <!-- System Theme -->
              <button
                type="button"
                class="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center cursor-pointer {prefs.theme === 'system' ? 'border-indigo-500 bg-indigo-500/10 shadow-xs' : (isLight ? 'border-slate-200 hover:border-slate-300 bg-slate-50' : 'border-[#30363d] hover:border-[#484f58] bg-[#0d1117]')}"
                onclick={() => updateField('theme', 'system')}
              >
                <div class="w-8 h-8 rounded-lg {isLight ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-[#21262d] border-[#30363d] text-slate-300'} flex items-center justify-center">
                  <Laptop size={16} />
                </div>
                <div class="font-medium {prefs.theme === 'system' ? 'text-indigo-400' : (isLight ? 'text-slate-800' : 'text-slate-200')}">
                  Sistema
                </div>
                <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                  Automático del SO
                </div>
              </button>
            </div>
          </div>

          <!-- 2. Tono de la Hoja de Papel -->
          <div class="space-y-3 pt-3 border-t {isLight ? 'border-slate-200' : 'border-[#21262d]'}">
            <div>
              <h3 class="font-semibold text-sm {isLight ? 'text-slate-900' : 'text-white'}">
                Tono de Papel Predeterminado
              </h3>
              <p class="text-[11px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                Selecciona la textura y calidez de la hoja en el modo PaperCraft
              </p>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <!-- Dark Tone -->
              <button
                type="button"
                class="p-3 rounded-xl border text-left cursor-pointer transition-all {prefs.paperTone === 'dark' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : (isLight ? 'border-slate-200 hover:border-slate-300' : 'border-[#30363d] hover:border-[#484f58]')}"
                onclick={() => updateField('paperTone', 'dark')}
              >
                <div class="w-full h-8 rounded-md bg-[#161b22] border border-white/10 mb-2 flex items-center justify-center text-slate-400">
                  <Moon size={13} />
                </div>
                <div class="font-semibold text-xs {isLight ? 'text-slate-800' : 'text-white'}">Grafito Noche</div>
                <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">Descanso visual</div>
              </button>

              <!-- White Tone -->
              <button
                type="button"
                class="p-3 rounded-xl border text-left cursor-pointer transition-all {prefs.paperTone === 'white' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : (isLight ? 'border-slate-200 hover:border-slate-300' : 'border-[#30363d] hover:border-[#484f58]')}"
                onclick={() => updateField('paperTone', 'white')}
              >
                <div class="w-full h-8 rounded-md bg-white border border-slate-300 mb-2 flex items-center justify-center text-slate-700">
                  <Sun size={13} />
                </div>
                <div class="font-semibold text-xs {isLight ? 'text-slate-800' : 'text-white'}">Blanco Nieve</div>
                <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">Contraste puro</div>
              </button>

              <!-- Cream Tone -->
              <button
                type="button"
                class="p-3 rounded-xl border text-left cursor-pointer transition-all {prefs.paperTone === 'cream' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : (isLight ? 'border-slate-200 hover:border-slate-300' : 'border-[#30363d] hover:border-[#484f58]')}"
                onclick={() => updateField('paperTone', 'cream')}
              >
                <div class="w-full h-8 rounded-md bg-[#fdfbf7] border border-[#ebdccb] mb-2 flex items-center justify-center text-[#9c783e]">
                  <Sun size={13} />
                </div>
                <div class="font-semibold text-xs {isLight ? 'text-slate-800' : 'text-white'}">Marfil Cálido</div>
                <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">Libro editorial</div>
              </button>

              <!-- Sepia Tone -->
              <button
                type="button"
                class="p-3 rounded-xl border text-left cursor-pointer transition-all {prefs.paperTone === 'sepia' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : (isLight ? 'border-slate-200 hover:border-slate-300' : 'border-[#30363d] hover:border-[#484f58]')}"
                onclick={() => updateField('paperTone', 'sepia')}
              >
                <div class="w-full h-8 rounded-md bg-[#f4ecd8] border border-[#d6c4a8] mb-2 flex items-center justify-center text-[#7c5b35]">
                  <Scroll size={13} />
                </div>
                <div class="font-semibold text-xs {isLight ? 'text-slate-800' : 'text-white'}">Sepia Vintage</div>
                <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">Tono pergamino</div>
              </button>
            </div>
          </div>

          <!-- 3. Tipografía de la Hoja -->
          <div class="space-y-3 pt-3 border-t {isLight ? 'border-slate-200' : 'border-[#21262d]'}">
            <div>
              <h3 class="font-semibold text-sm {isLight ? 'text-slate-900' : 'text-white'}">
                Tipografía de Lectura
              </h3>
              <p class="text-[11px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                Familia tipográfica aplicada a los párrafos y títulos de la hoja
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 {prefs.paperFont === 'serif' ? 'border-indigo-500 bg-indigo-500/10' : (isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#0d1117]')}"
                onclick={() => updateField('paperFont', 'serif')}
              >
                <div class="w-10 h-10 rounded-lg {isLight ? 'bg-white border-slate-300' : 'bg-[#161b22] border-[#30363d]'} border flex items-center justify-center font-serif text-lg font-bold">
                  Ag
                </div>
                <div>
                  <div class="font-semibold text-xs font-serif {isLight ? 'text-slate-800' : 'text-white'}">Serif Clásica</div>
                  <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">Charter, Georgia, Roman</div>
                </div>
              </button>

              <button
                type="button"
                class="p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 {prefs.paperFont === 'sans' ? 'border-indigo-500 bg-indigo-500/10' : (isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#0d1117]')}"
                onclick={() => updateField('paperFont', 'sans')}
              >
                <div class="w-10 h-10 rounded-lg {isLight ? 'bg-white border-slate-300' : 'bg-[#161b22] border-[#30363d]'} border flex items-center justify-center font-sans text-lg font-bold">
                  Ag
                </div>
                <div>
                  <div class="font-semibold text-xs font-sans {isLight ? 'text-slate-800' : 'text-white'}">Sans Moderna</div>
                  <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">Inter, Segoe UI, System</div>
                </div>
              </button>
            </div>
          </div>

        {:else if activeCategory === 'sheet'}
          <!-- Modo Hoja (PaperCraft) Options -->
          <div class="space-y-4">
            <div>
              <h3 class="font-semibold text-sm {isLight ? 'text-slate-900' : 'text-white'}">
                Modo de Trabajo Inicial en la Hoja
              </h3>
              <p class="text-[11px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                Elige cómo prefieres interactuar con el documento al abrir el modo PaperCraft
              </p>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <button
                type="button"
                class="p-3 rounded-xl border text-left cursor-pointer transition-all {prefs.defaultSheetMode === 'edit' ? 'border-indigo-500 bg-indigo-500/10' : (isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#0d1117]')}"
                onclick={() => updateField('defaultSheetMode', 'edit')}
              >
                <div class="font-semibold text-xs flex items-center gap-1.5 {isLight ? 'text-slate-800' : 'text-white'} mb-1">
                  <Type size={14} class="text-indigo-400" />
                  <span>Redactar</span>
                </div>
                <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'} leading-tight">
                  Escritura ágil en la hoja sin sobrecargas
                </div>
              </button>

              <button
                type="button"
                class="p-3 rounded-xl border text-left cursor-pointer transition-all {prefs.defaultSheetMode === 'split' ? 'border-indigo-500 bg-indigo-500/10' : (isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#0d1117]')}"
                onclick={() => updateField('defaultSheetMode', 'split')}
              >
                <div class="font-semibold text-xs flex items-center gap-1.5 {isLight ? 'text-slate-800' : 'text-white'} mb-1">
                  <Columns size={14} class="text-amber-400" />
                  <span>En Vivo (Split)</span>
                </div>
                <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'} leading-tight">
                  Escribe a la izquierda y ve el maquetado A4 a la derecha
                </div>
              </button>

              <button
                type="button"
                class="p-3 rounded-xl border text-left cursor-pointer transition-all {prefs.defaultSheetMode === 'print' ? 'border-indigo-500 bg-indigo-500/10' : (isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#0d1117]')}"
                onclick={() => updateField('defaultSheetMode', 'print')}
              >
                <div class="font-semibold text-xs flex items-center gap-1.5 {isLight ? 'text-slate-800' : 'text-white'} mb-1">
                  <BookOpen size={14} class="text-emerald-400" />
                  <span>Vista Impresa</span>
                </div>
                <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'} leading-tight">
                  Hojas A4 terminadas con KaTeX y paginación
                </div>
              </button>
            </div>

            <!-- Mostrar Marcas de Corte -->
            <div class="pt-3 border-t {isLight ? 'border-slate-200' : 'border-[#21262d]'} flex items-center justify-between">
              <div>
                <div class="font-semibold text-xs {isLight ? 'text-slate-800' : 'text-white'}">
                  Marcas de Corte (Crop Marks)
                </div>
                <div class="text-[11px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                  Muestra las esquinas de imprenta editorial profesional en cada hoja física
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={prefs.showCropMarks}
                onchange={(e) => updateField('showCropMarks', (e.target as HTMLInputElement).checked)}
                class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

        {:else if activeCategory === 'editor'}
          <!-- Editor & Compilation Options -->
          <div class="space-y-4">
            
            <!-- Auto-Guardado -->
            <div class="flex items-center justify-between pb-3 border-b {isLight ? 'border-slate-200' : 'border-[#21262d]'}">
              <div>
                <div class="font-semibold text-xs {isLight ? 'text-slate-800' : 'text-white'}">
                  Guardado Automático (Auto-Save)
                </div>
                <div class="text-[11px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                  Guarda automáticamente las modificaciones del documento
                </div>
              </div>
              <div class="flex items-center gap-2">
                {#if prefs.autoSave}
                  <select
                    value={prefs.autoSaveIntervalSec}
                    onchange={(e) => updateField('autoSaveIntervalSec', Number((e.target as HTMLSelectElement).value))}
                    class="px-2 py-1 rounded-lg text-xs {isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#0d1117] border-[#30363d] text-slate-200'} border"
                  >
                    <option value={1}>Cada 1 s</option>
                    <option value={2}>Cada 2 s</option>
                    <option value={5}>Cada 5 s</option>
                  </select>
                {/if}
                <input 
                  type="checkbox" 
                  checked={prefs.autoSave}
                  onchange={(e) => updateField('autoSave', (e.target as HTMLInputElement).checked)}
                  class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <!-- Word Wrap en Editor LaTeX -->
            <div class="flex items-center justify-between pb-3 border-b {isLight ? 'border-slate-200' : 'border-[#21262d]'}">
              <div>
                <div class="font-semibold text-xs {isLight ? 'text-slate-800' : 'text-white'}">
                  Ajuste de Línea (Word Wrap)
                </div>
                <div class="text-[11px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                  Evita el desplazamiento horizontal ajustando las líneas largas al ancho del editor
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={prefs.wordWrap}
                onchange={(e) => updateField('wordWrap', (e.target as HTMLInputElement).checked)}
                class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <!-- Sincronización de Scroll -->
            <div class="flex items-center justify-between pb-3 border-b {isLight ? 'border-slate-200' : 'border-[#21262d]'}">
              <div>
                <div class="font-semibold text-xs {isLight ? 'text-slate-800' : 'text-white'}">
                  Sincronización de Desplazamiento (Scroll Sync)
                </div>
                <div class="text-[11px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                  Mantiene alineada la posición entre el editor LaTeX y la previsualización
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={prefs.scrollSync}
                onchange={(e) => updateField('scrollSync', (e.target as HTMLInputElement).checked)}
                class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <!-- Motor de Compilación LaTeX -->
            <div class="space-y-2">
              <div>
                <div class="font-semibold text-xs {isLight ? 'text-slate-800' : 'text-white'}">
                  Motor de Compilación LaTeX Preferido
                </div>
                <div class="text-[11px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">
                  Selecciona el compilador prioritario para la exportación a PDF
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  class="p-2.5 rounded-lg border text-left cursor-pointer transition-all {prefs.compilationEngine === 'auto' ? 'border-indigo-500 bg-indigo-500/10 font-semibold' : (isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#0d1117]')}"
                  onclick={() => updateField('compilationEngine', 'auto')}
                >
                  <div class="text-xs {isLight ? 'text-slate-800' : 'text-white'}">Auto-detección</div>
                  <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">Tectonic / pdflatex</div>
                </button>

                <button
                  type="button"
                  class="p-2.5 rounded-lg border text-left cursor-pointer transition-all {prefs.compilationEngine === 'tectonic' ? 'border-indigo-500 bg-indigo-500/10 font-semibold' : (isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#0d1117]')}"
                  onclick={() => updateField('compilationEngine', 'tectonic')}
                >
                  <div class="text-xs {isLight ? 'text-slate-800' : 'text-white'}">Tectonic</div>
                  <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">Moderno y autónomo</div>
                </button>

                <button
                  type="button"
                  class="p-2.5 rounded-lg border text-left cursor-pointer transition-all {prefs.compilationEngine === 'pdflatex' ? 'border-indigo-500 bg-indigo-500/10 font-semibold' : (isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#0d1117]')}"
                  onclick={() => updateField('compilationEngine', 'pdflatex')}
                >
                  <div class="text-xs {isLight ? 'text-slate-800' : 'text-white'}">pdflatex</div>
                  <div class="text-[10px] {isLight ? 'text-slate-500' : 'text-[#8b949e]'}">TeX Live / MiKTeX</div>
                </button>
              </div>
            </div>

          </div>
        {/if}

      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 border-t {isLight ? 'border-slate-200 bg-slate-50' : 'border-[#21262d] bg-[#0d1117]'} flex items-center justify-between text-xs">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg {isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-[#21262d] text-[#8b949e] hover:text-white'} transition-colors cursor-pointer"
          onclick={handleReset}
          title="Restablecer todos los ajustes a los valores iniciales"
        >
          <RotateCcw size={13} />
          <span>Restablecer valores</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-xs transition-colors cursor-pointer"
          onclick={handleClose}
        >
          <Check size={14} />
          <span>Listo</span>
        </button>
      </div>

    </div>
  </div>
{/if}
