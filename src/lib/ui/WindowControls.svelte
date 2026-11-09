<script lang="ts">
  import { onMount } from 'svelte';
  import { Minus, Square, X } from '@lucide/svelte';

  let isTauri = $state(false);
  let isMaximized = $state(false);
  let appWindow: any = null;

  onMount(async () => {
    // Detectar si se está ejecutando dentro de Tauri (escritorio)
    isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
    
    if (isTauri) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        appWindow = getCurrentWindow();
        isMaximized = await appWindow.isMaximized();

        // Escuchar cambios de tamaño/maximización de la ventana
        const unlisten = await appWindow.onResized(async () => {
          try {
            isMaximized = await appWindow.isMaximized();
          } catch {
            // Silencioso en caso de desmontaje
          }
        });

        return () => {
          if (typeof unlisten === 'function') unlisten();
        };
      } catch (err) {
        console.warn('Tauri window API no disponible:', err);
      }
    }
  });

  async function handleMinimize() {
    if (appWindow) {
      try {
        await appWindow.minimize();
      } catch (e) {
        console.error('Error al minimizar ventana:', e);
      }
    }
  }

  async function handleToggleMaximize() {
    if (appWindow) {
      try {
        await appWindow.toggleMaximize();
        isMaximized = await appWindow.isMaximized();
      } catch (e) {
        console.error('Error al alternar maximizado:', e);
      }
    }
  }

  async function handleClose() {
    if (appWindow) {
      try {
        await appWindow.close();
      } catch (e) {
        console.error('Error al cerrar ventana:', e);
      }
    }
  }
</script>

{#if isTauri}
  <div class="flex items-center h-full ml-1 shrink-0 -mr-3 sm:-mr-4 border-l border-white/10 pl-1" data-tauri-drag-region="false">
    <!-- Minimizar -->
    <button
      type="button"
      class="w-10 h-12 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group"
      onclick={handleMinimize}
      title="Minimizar ventana"
      aria-label="Minimizar"
    >
      <Minus size={14} strokeWidth={2} class="transition-transform group-active:scale-90" />
    </button>

    <!-- Maximizar / Restaurar (Cuadrado elegante) -->
    <button
      type="button"
      class="w-10 h-12 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group"
      onclick={handleToggleMaximize}
      title={isMaximized ? "Restaurar tamaño" : "Maximizar"}
      aria-label={isMaximized ? "Restaurar" : "Maximizar"}
    >
      {#if isMaximized}
        <!-- Icono de Restaurar (dos cuadros superpuestos minimalistas) -->
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" class="transition-transform group-active:scale-90">
          <rect x="3" y="1" width="8" height="8" rx="1" />
          <path d="M1 4 v 6 a 1 1 0 0 0 1 1 h 6" />
        </svg>
      {:else}
        <!-- Icono de Maximizar (un cuadro limpio) -->
        <Square size={12} strokeWidth={1.5} class="transition-transform group-active:scale-90" />
      {/if}
    </button>

    <!-- Cerrar (X con fondo rojo dinámico al pasar el cursor) -->
    <button
      type="button"
      class="w-11 h-12 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#e81123] active:bg-[#c4101e] transition-colors cursor-pointer group"
      onclick={handleClose}
      title="Cerrar Layratex"
      aria-label="Cerrar"
    >
      <X size={15} strokeWidth={1.75} class="transition-transform group-active:scale-90" />
    </button>
  </div>
{/if}
