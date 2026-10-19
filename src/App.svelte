<script lang="ts">
  import Sidebar from './lib/ui/Sidebar.svelte';
  import StatusBar from './lib/ui/StatusBar.svelte';
  import LatexEditor from './lib/editor/LatexEditor.svelte';
  import LatexPreview from './lib/preview/LatexPreview.svelte';
  import { FileCode, QrCode, HardDrive, Download, Play, Plus, RefreshCw, Smartphone, Laptop } from '@lucide/svelte';

  let activeTab = $state<'files' | 'p2p' | 'settings'>('files');
  let splitRatio = $state(50); // Porcentaje de ancho del editor
  let isDragging = $state(false);

  let documentContent = $state(`\\documentclass{article}
\\title{Layratex: Documentación Técnica de Software}
\\author{Equipo de Ingeniería}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introducción}
\\textbf{Layratex} es un editor técnico multiplataforma basado en el paradigma \\textit{Local-First} y redes \\textit{Peer-to-Peer (P2P)}.

\\subsection{Rendimiento Extremo}
El sistema está diseñado para consumir la menor cantidad de memoria RAM y CPU en cualquier máquina:
\\begin{itemize}
  \\item \\textbf{Cero Latencia:} Renderizado incremental de fórmulas matemáticas con KaTeX en menos de 10 milisegundos.
  \\item \\textbf{Convergencia CRDT:} Edición concurrente sin colisiones ni servidores centrales.
  \\item \\textbf{Soberanía de Datos:} Archivos almacenados en texto plano local (.tex).
\\end{itemize}

\\section{Modelado Matemático}
A continuación se ilustra una ecuación en bloque con integrales y derivadas:

\\[
\\mathcal{L}_{p2p} = \\oint_C \\vec{E} \\cdot d\\vec{\\ell} + \\frac{\\partial}{\\partial t} \\iint_S \\vec{B} \\cdot d\\vec{S}
\\]

Ecuación de equivalencia relativista en línea: $E = \\gamma m_0 c^2$, donde el factor de Lorentz es $\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}$.

\\section{Conclusión}
La arquitectura descentralizada asegura que puedas redactar sin conexión a Internet y sincronizar directamente con tus demás computadoras al reconectarte.

\\end{document}`);

  let stats = $state({ lines: 0, words: 0 });
  let renderTimeMs = $state(0);

  function startResize(e: MouseEvent) {
    isDragging = true;
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', stopResize);
  }

  function handleResize(e: MouseEvent) {
    if (!isDragging) return;
    const containerWidth = window.innerWidth - 56 - (activeTab ? 240 : 0);
    const offsetX = e.clientX - 56 - (activeTab ? 240 : 0);
    const newRatio = (offsetX / containerWidth) * 100;
    if (newRatio >= 20 && newRatio <= 80) {
      splitRatio = Math.round(newRatio);
    }
  }

  function stopResize() {
    isDragging = false;
    window.removeEventListener('mousemove', handleResize);
    window.removeEventListener('mouseup', stopResize);
  }

  function exportTexFile() {
    const blob = new Blob([documentContent], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.tex';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="h-screen w-screen flex flex-col bg-[#0d1117] text-[#c9d1d9] select-none overflow-hidden">
  
  <!-- Barra Superior / Header de Acciones -->
  <header class="h-11 bg-[#161b22] border-b border-[#21262d] px-4 flex items-center justify-between text-xs">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="font-bold text-white tracking-wide text-sm flex items-center gap-1.5">
          <span class="text-[#58a6ff]">λ</span> Layratex
        </span>
        <span class="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded font-mono">v0.1.0-alpha</span>
      </div>
      <span class="text-[#30363d]">/</span>
      <span class="text-[#e6edf3] font-mono">main.tex</span>
    </div>

    <div class="flex items-center gap-2">
      <button 
        class="flex items-center gap-1.5 px-3 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-white transition-colors text-xs font-medium"
        onclick={exportTexFile}
        title="Guardar documento .tex en disco"
      >
        <Download size={13} />
        <span>Guardar .tex</span>
      </button>

      <button 
        class="flex items-center gap-1.5 px-3 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white transition-colors text-xs font-semibold shadow-sm"
        title="Compilación completa a PDF nativo"
      >
        <Play size={13} />
        <span>Compilar PDF</span>
      </button>
    </div>
  </header>

  <!-- Cuerpo Principal: Sidebar + Drawer + Split Editor/Preview -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Icon Bar -->
    <Sidebar bind:activeTab connectedPeersCount={2} />

    <!-- Panel de Navegación Lateral (Drawer colapsable) -->
    {#if activeTab === 'files'}
      <div class="w-60 bg-[#0d1117] border-r border-[#21262d] flex flex-col text-xs">
        <div class="p-3 border-b border-[#21262d] flex items-center justify-between font-semibold text-[#8b949e] tracking-wider uppercase text-[10px]">
          <span>Explorador</span>
          <button class="hover:text-white" title="Nuevo archivo">
            <Plus size={14} />
          </button>
        </div>
        <div class="p-2 space-y-1">
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#1f6feb1f] text-[#58a6ff] cursor-pointer font-mono">
            <FileCode size={14} />
            <span class="truncate">main.tex</span>
          </div>
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] cursor-pointer font-mono">
            <FileCode size={14} />
            <span class="truncate">referencias.bib</span>
          </div>
        </div>
      </div>
    {:else if activeTab === 'p2p'}
      <div class="w-64 bg-[#0d1117] border-r border-[#21262d] flex flex-col text-xs">
        <div class="p-3 border-b border-[#21262d] flex items-center justify-between font-semibold text-[#8b949e] tracking-wider uppercase text-[10px]">
          <span>Red P2P & Dispositivos</span>
          <span class="w-2 h-2 rounded-full bg-[#3fb950]"></span>
        </div>
        <div class="p-3 space-y-4 overflow-y-auto">
          <!-- Mi Identidad de Dispositivo -->
          <div class="p-2.5 rounded border border-[#30363d] bg-[#161b22]">
            <div class="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider mb-1">Este Dispositivo</div>
            <div class="flex items-center gap-2 text-white font-medium">
              <Laptop size={15} class="text-[#58a6ff]" />
              <span>Estación Principal (Fedora)</span>
            </div>
            <div class="mt-1 font-mono text-[10px] text-[#8b949e] truncate" title="Ed25519 PubKey">
              ed25519:7a9c...f482
            </div>
          </div>

          <!-- Botón de Emparejar QR -->
          <button class="w-full py-2 px-3 rounded bg-[#a371f7]/20 border border-[#a371f7]/40 hover:bg-[#a371f7]/30 text-[#d2a8ff] flex items-center justify-center gap-2 font-medium transition-colors">
            <QrCode size={14} />
            <span>Vincular Nuevo Equipo (QR)</span>
          </button>

          <!-- Dispositivos Emparejados -->
          <div>
            <div class="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider mb-2">Dispositivos en el Enjambre</div>
            <div class="space-y-1.5">
              <div class="p-2 rounded bg-[#161b22] border border-[#21262d] flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Laptop size={14} class="text-[#3fb950]" />
                  <div>
                    <div class="text-white text-[11px] font-medium">Laptop Portátil</div>
                    <div class="text-[10px] text-[#3fb950]">● En línea (P2P Directo)</div>
                  </div>
                </div>
                <span class="text-[10px] text-[#8b949e] font-mono">12 ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'settings'}
      <div class="w-60 bg-[#0d1117] border-r border-[#21262d] p-4 text-xs">
        <h3 class="font-bold text-white mb-3">Ajustes</h3>
        <p class="text-[#8b949e] text-[11px] leading-relaxed mb-4">
          Motor LaTeX: <span class="text-[#58a6ff] font-semibold">Tectonic (Embebido)</span>
        </p>
        <p class="text-[#8b949e] text-[11px] leading-relaxed">
          Cifrado P2P: <span class="text-[#3fb950] font-semibold">ChaCha20-Poly1305 (E2EE)</span>
        </p>
      </div>
    {/if}

    <!-- Área de Trabajo Dividida (Split View) -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Panel de Edición de Código -->
      <div class="h-full overflow-hidden" style="width: {splitRatio}%">
        <LatexEditor 
          bind:content={documentContent}
          onStatsChange={(newStats) => stats = newStats}
        />
      </div>

      <!-- Divisor Arrastrable (Resizer) -->
      <div 
        class="w-1.5 hover:w-2 bg-[#21262d] hover:bg-[#58a6ff] transition-all cursor-col-resize select-none relative z-20 flex items-center justify-center group"
        onmousedown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={splitRatio}
        tabindex="0"
      >
        <div class="w-0.5 h-6 bg-[#484f58] group-hover:bg-white rounded-full"></div>
      </div>

      <!-- Panel de Previsualización Reactiva KaTeX -->
      <div class="h-full overflow-hidden flex-1" style="width: {100 - splitRatio}%">
        <LatexPreview 
          content={documentContent}
          onRenderTime={(ms) => renderTimeMs = ms}
        />
      </div>
    </div>
  </div>

  <!-- Barra de Estado Inferior -->
  <StatusBar 
    lines={stats.lines}
    words={stats.words}
    renderTimeMs={renderTimeMs}
    p2pStatus="P2P Enjambre Conectado (1 par)"
  />
</div>
