<script lang="ts">
  import { FileText, Share2, Settings, Download, RefreshCw, Smartphone } from '@lucide/svelte';
  import LayratexLogo from './LayratexLogo.svelte';

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

<aside class="w-14 {isLight ? 'bg-white border-slate-200' : 'bg-[#090d16] border-white/10'} border-r flex flex-col items-center py-3 select-none justify-between z-20 transition-colors duration-150">
  <div class="flex flex-col items-center gap-4 w-full">
    <!-- Logo Layratex Insano -->
    <button
      type="button"
      class="p-1 rounded-xl hover:bg-white/5 transition-all cursor-pointer mb-1 group" 
      title="Layratex P2P • Abrir Preferencias"
      onclick={onOpenPreferences}
    >
      <LayratexLogo size={32} showText={false} showBadge={false} />
    </button>

    <!-- Navegación Lateral -->
    <button
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer relative {activeTab === 'files' ? (isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]') : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5')}"
      onclick={() => activeTab = activeTab === 'files' ? '' : 'files'}
      title="Explorador de Archivos y Proyectos LaTeX"
    >
      <FileText size={18} />
      {#if activeTab === 'files'}
        <span class="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-r-full"></span>
      {/if}
    </button>

    <button
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-all relative cursor-pointer {activeTab === 'p2p' ? (isLight ? 'bg-purple-50 text-purple-600' : 'bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]') : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5')}"
      onclick={() => activeTab = activeTab === 'p2p' ? '' : 'p2p'}
      title="Red P2P & Dispositivos"
    >
      <Share2 size={18} />
      {#if connectedPeersCount > 0}
        <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
      {/if}
      {#if activeTab === 'p2p'}
        <span class="absolute left-0 top-2 bottom-2 w-0.5 bg-purple-500 rounded-r-full"></span>
      {/if}
    </button>

    <button
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer relative {activeTab === 'settings' ? (isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]') : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5')}"
      onclick={() => activeTab = activeTab === 'settings' ? '' : 'settings'}
      title="Ajustes y Preferencias (Ctrl+,)"
    >
      <Settings size={18} />
      {#if activeTab === 'settings'}
        <span class="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-r-full"></span>
      {/if}
    </button>
  </div>

  <div class="flex flex-col items-center gap-3">
    <button 
      type="button" 
      class="w-8 h-8 rounded-lg {isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/5 text-slate-400 hover:text-white'} flex items-center justify-center transition-colors cursor-pointer"
      onclick={onOpenPreferences}
      title="Preferencias de la aplicación (Ctrl+,)"
    >
      <Settings size={15} />
    </button>
    <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" title="Modo Local-First Activo"></div>
  </div>
</aside>
