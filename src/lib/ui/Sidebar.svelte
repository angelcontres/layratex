<script lang="ts">
  import { FileText, Share2, Settings, Download, RefreshCw, Smartphone } from '@lucide/svelte';

  let {
    activeTab = $bindable<'files' | 'p2p' | 'settings'>('files'),
    connectedPeersCount = 0
  } = $props();
</script>

<aside class="w-14 bg-[#0d1117] border-r border-[#21262d] flex flex-col items-center py-3 select-none justify-between z-10">
  <div class="flex flex-col items-center gap-4 w-full">
    <!-- Logo Layratex -->
    <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1f6feb] to-[#a371f7] flex items-center justify-center text-white font-bold text-sm shadow-md mb-2 cursor-pointer hover:scale-105 transition-transform" title="Layratex P2P">
      λ
    </div>

    <!-- Navegación Lateral -->
    <button
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors {activeTab === 'files' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'}"
      onclick={() => activeTab = 'files'}
      title="Explorador de Archivos"
    >
      <FileText size={18} />
    </button>

    <button
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative {activeTab === 'p2p' ? 'bg-[#21262d] text-[#a371f7]' : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'}"
      onclick={() => activeTab = 'p2p'}
      title="Red P2P & Dispositivos"
    >
      <Share2 size={18} />
      {#if connectedPeersCount > 0}
        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3fb950]"></span>
      {/if}
    </button>

    <button
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors {activeTab === 'settings' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'}"
      onclick={() => activeTab = 'settings'}
      title="Ajustes y Motor LaTeX"
    >
      <Settings size={18} />
    </button>
  </div>

  <div class="flex flex-col items-center gap-3">
    <div class="w-2.5 h-2.5 rounded-full bg-[#238636]" title="Modo Local-First Activo"></div>
  </div>
</aside>
