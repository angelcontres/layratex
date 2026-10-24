<script lang="ts">
  import { FileText, Share2, Settings, Download, RefreshCw, Smartphone } from '@lucide/svelte';

  let {
    activeTab = $bindable<'files' | 'p2p' | 'settings' | ''>('files'),
    connectedPeersCount = 0,
    isLight = false,
    onOpenPreferences = () => {}
  }: {
    activeTab?: 'files' | 'p2p' | 'settings' | '';
    connectedPeersCount?: number;
    isLight?: boolean;
    onOpenPreferences?: () => void;
  } = $props();
</script>

<aside class="w-14 {isLight ? 'bg-white border-slate-200' : 'bg-[#0d1117] border-[#21262d]'} border-r flex flex-col items-center py-3 select-none justify-between z-10 transition-colors duration-150">
  <div class="flex flex-col items-center gap-4 w-full">
    <!-- Logo Layratex -->
    <button
      type="button"
      class="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1f6feb] to-[#a371f7] flex items-center justify-center text-white font-bold text-sm shadow-md mb-2 cursor-pointer hover:scale-105 transition-transform" 
      title="Layratex P2P • Abrir Preferencias"
      onclick={onOpenPreferences}
    >
      λ
    </button>

    <!-- Navegación Lateral -->
    <button
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer {activeTab === 'files' ? (isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-[#21262d] text-[#58a6ff]') : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]')}"
      onclick={() => activeTab = activeTab === 'files' ? '' : 'files'}
      title="Explorador de Archivos"
    >
      <FileText size={18} />
    </button>

    <button
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative cursor-pointer {activeTab === 'p2p' ? (isLight ? 'bg-purple-50 text-purple-600' : 'bg-[#21262d] text-[#a371f7]') : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]')}"
      onclick={() => activeTab = activeTab === 'p2p' ? '' : 'p2p'}
      title="Red P2P & Dispositivos"
    >
      <Share2 size={18} />
      {#if connectedPeersCount > 0}
        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3fb950]"></span>
      {/if}
    </button>

    <button
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer {activeTab === 'settings' ? (isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-[#21262d] text-[#58a6ff]') : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]')}"
      onclick={() => activeTab = activeTab === 'settings' ? '' : 'settings'}
      title="Ajustes y Preferencias (Ctrl+,)"
    >
      <Settings size={18} />
    </button>
  </div>

  <div class="flex flex-col items-center gap-3">
    <button 
      type="button" 
      class="w-7 h-7 rounded-lg {isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-[#21262d] text-[#8b949e]'} flex items-center justify-center transition-colors cursor-pointer"
      onclick={onOpenPreferences}
      title="Preferencias de la aplicación (Ctrl+,)"
    >
      <Settings size={14} />
    </button>
    <div class="w-2.5 h-2.5 rounded-full bg-[#238636]" title="Modo Local-First Activo"></div>
  </div>
</aside>
