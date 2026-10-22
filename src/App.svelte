<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './lib/ui/Sidebar.svelte';
  import StatusBar from './lib/ui/StatusBar.svelte';
  import LatexEditor from './lib/editor/LatexEditor.svelte';
  import LatexPreview from './lib/preview/LatexPreview.svelte';
  import { fileService, type FileItem } from './lib/services/fileService';
  import { compilerService } from './lib/services/compilerService';
  import { 
    FileCode, 
    QrCode, 
    HardDrive, 
    Download, 
    Play, 
    Plus, 
    FolderOpen, 
    Save, 
    Clock, 
    Trash2, 
    Laptop,
    Check,
    AlertCircle,
    Loader2,
    ExternalLink,
    X,
    FileCheck,
    Terminal,
    Copy,
    Eye
  } from '@lucide/svelte';

  let activeTab = $state<'files' | 'p2p' | 'settings'>('files');
  let splitRatio = $state(50); // Porcentaje de ancho del editor
  let isDragging = $state(false);

  // Estado del Documento
  let currentFilePath = $state<string | null>(null);
  let currentFileName = $state<string>('documento.tex');
  const initialTemplate = `\\documentclass{article}
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

\\end{document}`;

  let documentContent = $state(initialTemplate);
  let savedContent = $state(initialTemplate);
  let isDirty = $derived(documentContent !== savedContent);

  let stats = $state({ lines: 0, words: 0 });
  let renderTimeMs = $state(0);
  let statusMessage = $state<string | null>(null);
  let statusMessageType = $state<'success' | 'error' | 'info'>('info');
  let recentFiles = $state<FileItem[]>([]);

  // Estado de Compilación & Exportación de PDF (Sprint 2: TICKET-012)
  let isCompiling = $state(false);
  let compilationTimeMs = $state<number | null>(null);
  let compilationEngine = $state<string | null>(null);
  let compilationError = $state(false);
  let previewMode = $state<'katex' | 'pdf'>('katex');
  let pdfBlobUrl = $state<string | null>(null);
  let lastExportedPath = $state<string | null>(null);
  let lastCompiledPdf = $state<{
    path: string;
    name: string;
    base64: string | null;
    engine: string;
    durationMs: number;
  } | null>(null);

  // Modales de Compilación y Error
  let showPdfSuccessModal = $state(false);
  let showErrorModal = $state(false);
  let errorModalTitle = $state('');
  let errorModalMessage = $state('');
  let errorModalDetails = $state('');
  let copiedError = $state(false);

  onMount(() => {
    recentFiles = fileService.getRecentFiles();

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpen();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewDocument();
      } else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') || e.key === 'F5') {
        e.preventDefault();
        handleCompile();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  });

  function showNotification(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    statusMessage = msg;
    statusMessageType = type;
    setTimeout(() => {
      if (statusMessage === msg) {
        statusMessage = null;
      }
    }, 4500);
  }

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

  // --- Operaciones de Archivo (Sprint 1: TICKET-007, 008, 009, 010) ---

  async function handleOpen() {
    if (isDirty) {
      const confirmDiscard = window.confirm('Tienes cambios sin guardar en este documento. ¿Deseas descartarlos y abrir otro archivo?');
      if (!confirmDiscard) return;
    }

    try {
      const res = await fileService.openTexFile();
      if (!res || res.content === null) return;

      documentContent = res.content;
      savedContent = res.content;
      currentFilePath = res.path;
      currentFileName = res.name;
      recentFiles = fileService.getRecentFiles();
      showNotification(`Abierto: ${res.name}`, 'success');
    } catch (err: any) {
      showNotification(`Error al abrir: ${err?.message || err}`, 'error');
    }
  }

  async function handleSave() {
    try {
      const res = await fileService.saveTexFile(currentFilePath, documentContent);
      if (!res) return;

      currentFilePath = res.path;
      currentFileName = res.name;
      savedContent = documentContent;
      recentFiles = fileService.getRecentFiles();
      showNotification(`Guardado: ${res.name}`, 'success');
    } catch (err: any) {
      showNotification(`Error al guardar: ${err?.message || err}`, 'error');
    }
  }

  async function handleSaveAs() {
    try {
      const res = await fileService.saveTexFileAs(documentContent, currentFileName);
      if (!res) return;

      currentFilePath = res.path;
      currentFileName = res.name;
      savedContent = documentContent;
      recentFiles = fileService.getRecentFiles();
      showNotification(`Guardado como: ${res.name}`, 'success');
    } catch (err: any) {
      showNotification(`Error al guardar como: ${err?.message || err}`, 'error');
    }
  }

  function handleNewDocument() {
    if (isDirty) {
      const confirmDiscard = window.confirm('Tienes cambios sin guardar. ¿Deseas crear un nuevo documento y descartar los cambios?');
      if (!confirmDiscard) return;
    }

    const defaultTemplate = `\\documentclass{article}
\\title{Nuevo Documento Layratex}
\\author{Autor}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Inicio}
Escribe tu documentación técnica aquí...

\\end{document}`;

    documentContent = defaultTemplate;
    savedContent = defaultTemplate;
    currentFilePath = null;
    currentFileName = 'sin_titulo.tex';
    lastCompiledPdf = null;
    lastExportedPath = null;
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      pdfBlobUrl = null;
    }
    previewMode = 'katex';
    showNotification('Nuevo documento creado', 'info');
  }

  async function handleOpenRecent(path: string) {
    if (isDirty) {
      const confirmDiscard = window.confirm('Tienes cambios sin guardar. ¿Deseas descartarlos y abrir este archivo?');
      if (!confirmDiscard) return;
    }

    try {
      const content = await fileService.readFileFromPath(path);
      documentContent = content;
      savedContent = content;
      currentFilePath = path;
      currentFileName = fileService.getFileName(path);
      recentFiles = fileService.getRecentFiles();
      showNotification(`Abierto: ${currentFileName}`, 'success');
    } catch (err: any) {
      showNotification(`No se pudo abrir el archivo reciente: ${err?.message || err}`, 'error');
    }
  }

  function handleClearRecents() {
    fileService.clearRecentFiles();
    recentFiles = [];
    showNotification('Historial de recientes limpiado', 'info');
  }

  // --- Pipeline de Compilación y Exportación PDF (Sprint 2: TICKET-012) ---

  async function handleCompile() {
    if (isCompiling) return;

    isCompiling = true;
    compilationError = false;
    showNotification('Compilando documento con motor LaTeX...', 'info');

    try {
      const output = await compilerService.compileLatex(documentContent, currentFilePath);
      isCompiling = false;

      compilationTimeMs = output.duration_ms;
      compilationEngine = output.engine;

      if (output.success && output.pdf_path) {
        compilationError = false;

        // Generar Blob URL local si disponemos del base64 para previsualización inmediata
        if (output.pdf_base64) {
          if (pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
          }
          pdfBlobUrl = compilerService.createPdfBlobUrl(output.pdf_base64);
        }

        const suggestedName = currentFileName.replace(/\.tex$/i, '') + '.pdf';
        lastCompiledPdf = {
          path: output.pdf_path,
          name: suggestedName,
          base64: output.pdf_base64,
          engine: output.engine,
          durationMs: output.duration_ms
        };

        showNotification(`Compilado con éxito con ${output.engine} (${output.duration_ms} ms)`, 'success');

        // Abrir diálogo de exportación nativo para guardar el PDF
        await handleExportPdf(true);
      } else {
        compilationError = true;
        errorModalTitle = 'Error de Compilación LaTeX';
        errorModalMessage = output.error_message || 'El compilador LaTeX finalizó con errores de compilación.';
        errorModalDetails = output.stderr || output.log || output.stdout || '';
        showErrorModal = true;
        showNotification(`Compilación fallida (${output.duration_ms} ms)`, 'error');
      }
    } catch (err: any) {
      isCompiling = false;
      compilationError = true;
      const errMsg = err?.message || String(err);

      if (errMsg.includes('No se encontró ningún compilador') || errMsg.includes('sudo dnf install')) {
        errorModalTitle = 'Compilador LaTeX no Encontrado';
        errorModalMessage = 'Para compilar documentos a PDF nativo, se requiere una distribución de LaTeX o Tectonic instalada en el sistema.';
        errorModalDetails = errMsg;
      } else {
        errorModalTitle = 'Fallo en Motor de Compilación';
        errorModalMessage = errMsg;
        errorModalDetails = '';
      }

      showErrorModal = true;
      showNotification('Error al iniciar la compilación', 'error');
    }
  }

  async function handleExportPdf(afterCompilation = false) {
    if (!lastCompiledPdf) {
      showNotification('Primero debes compilar el documento (Ctrl+B).', 'info');
      return;
    }

    try {
      const savedPath = await compilerService.exportPdf(
        lastCompiledPdf.path,
        lastCompiledPdf.name,
        lastCompiledPdf.base64
      );

      if (savedPath) {
        lastExportedPath = savedPath;
        showNotification(`PDF exportado correctamente a: ${fileService.getFileName(savedPath)}`, 'success');
        showPdfSuccessModal = true;
      } else if (afterCompilation) {
        // Si el usuario canceló el diálogo de guardado, mostramos el modal para ofrecer abrir en visor o previsualizar
        showPdfSuccessModal = true;
      }
    } catch (err: any) {
      showNotification(`Error al exportar PDF: ${err?.message || err}`, 'error');
    }
  }

  async function handleOpenInSystemViewer() {
    const targetPath = lastExportedPath || lastCompiledPdf?.path;
    if (!targetPath) {
      showNotification('No hay archivo PDF disponible para abrir.', 'error');
      return;
    }

    try {
      await compilerService.openPath(targetPath);
      showNotification('Abriendo PDF en el visor predeterminado del sistema...', 'info');
    } catch (err: any) {
      showNotification(`No se pudo abrir el visor: ${err?.message || err}`, 'error');
    }
  }

  function copyErrorDetails() {
    if (errorModalDetails) {
      navigator.clipboard.writeText(errorModalDetails);
      copiedError = true;
      setTimeout(() => copiedError = false, 2500);
    }
  }
</script>

<div class="h-screen w-screen flex flex-col bg-[#0d1117] text-[#c9d1d9] select-none overflow-hidden font-sans">
  
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
      
      <!-- Nombre de Archivo & Estado Sucio (Dirty indicator) -->
      <div class="flex items-center gap-1.5 font-mono text-[#e6edf3]" title={currentFilePath || 'Sin guardar en disco'}>
        {#if isDirty}
          <span class="w-2 h-2 rounded-full bg-[#f0883e]" title="Cambios sin guardar (Ctrl+S para guardar)"></span>
        {/if}
        <span>{currentFileName}</span>
      </div>
    </div>

    <!-- Acciones Rápidas de Archivo y Compilación -->
    <div class="flex items-center gap-2">
      {#if statusMessage}
        <div class="text-[11px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5 transition-all {statusMessageType === 'success' ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40' : statusMessageType === 'error' ? 'bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40' : 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40'}">
          {#if statusMessageType === 'success'}
            <Check size={12} />
          {:else if statusMessageType === 'error'}
            <AlertCircle size={12} />
          {/if}
          <span>{statusMessage}</span>
        </div>
      {/if}

      <button 
        class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-white transition-colors text-xs font-medium"
        onclick={handleNewDocument}
        title="Nuevo documento LaTeX (Ctrl+N)"
      >
        <Plus size={13} />
        <span class="hidden sm:inline">Nuevo</span>
      </button>

      <button 
        class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-white transition-colors text-xs font-medium"
        onclick={handleOpen}
        title="Abrir archivo .tex local (Ctrl+O)"
      >
        <FolderOpen size={13} />
        <span class="hidden sm:inline">Abrir</span>
      </button>

      <button 
        class="flex items-center gap-1.5 px-3 py-1 rounded transition-colors text-xs font-medium {isDirty ? 'bg-[#1f6feb] hover:bg-[#388bfd] text-white shadow-sm' : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9]'}"
        onclick={handleSave}
        title="Guardar archivo en disco (Ctrl+S)"
      >
        <Save size={13} />
        <span>Guardar</span>
      </button>

      <!-- Botón de Exportar si ya existe compilación -->
      {#if lastCompiledPdf}
        <button
          class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] hover:text-white transition-colors text-xs font-medium border border-[#30363d]"
          onclick={() => showPdfSuccessModal = true}
          title="Ver o exportar el último PDF compilado"
        >
          <Download size={13} class="text-[#58a6ff]" />
          <span class="hidden md:inline">Exportar PDF</span>
        </button>
      {/if}

      <!-- Botón Principal: Compilar PDF (TICKET-012) -->
      <button 
        class="flex items-center gap-1.5 px-3.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white transition-colors text-xs font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        onclick={handleCompile}
        disabled={isCompiling}
        title="Compilar a PDF con backend nativo (Ctrl+B / F5)"
      >
        {#if isCompiling}
          <Loader2 size={13} class="animate-spin" />
          <span>Compilando...</span>
        {:else}
          <Play size={13} />
          <span>Compilar PDF</span>
        {/if}
      </button>
    </div>
  </header>

  <!-- Cuerpo Principal: Sidebar + Drawer + Split Editor/Preview -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Icon Bar -->
    <Sidebar bind:activeTab connectedPeersCount={2} />

    <!-- Panel de Navegación Lateral (Drawer colapsable) -->
    {#if activeTab === 'files'}
      <div class="w-64 bg-[#0d1117] border-r border-[#21262d] flex flex-col text-xs">
        <div class="p-3 border-b border-[#21262d] flex items-center justify-between font-semibold text-[#8b949e] tracking-wider uppercase text-[10px]">
          <span>Documento Activo</span>
          <button class="hover:text-white" onclick={handleNewDocument} title="Crear nuevo archivo (Ctrl+N)">
            <Plus size={14} />
          </button>
        </div>
        
        <div class="p-2 space-y-1 border-b border-[#21262d]">
          <div class="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#1f6feb1f] text-[#58a6ff] font-mono">
            <div class="flex items-center gap-2 truncate">
              <FileCode size={14} />
              <span class="truncate">{currentFileName}</span>
            </div>
            {#if isDirty}
              <span class="w-1.5 h-1.5 rounded-full bg-[#f0883e]" title="Modificado"></span>
            {/if}
          </div>
          {#if currentFilePath}
            <div class="px-2.5 py-1 text-[10px] text-[#8b949e] font-mono truncate" title={currentFilePath}>
              {currentFilePath}
            </div>
          {/if}
        </div>

        <!-- Archivos Recientes (TICKET-010) -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="p-3 pb-1 flex items-center justify-between font-semibold text-[#8b949e] tracking-wider uppercase text-[10px]">
            <div class="flex items-center gap-1.5">
              <Clock size={12} />
              <span>Archivos Recientes</span>
            </div>
            {#if recentFiles.length > 0}
              <button 
                class="hover:text-[#f85149] transition-colors" 
                onclick={handleClearRecents}
                title="Limpiar recientes"
              >
                <Trash2 size={12} />
              </button>
            {/if}
          </div>

          <div class="p-2 space-y-1 overflow-y-auto flex-1">
            {#if recentFiles.length === 0}
              <div class="p-4 text-center text-[#484f58] text-[11px]">
                No hay archivos recientes aún. Abre o guarda un archivo para verlo aquí.
              </div>
            {:else}
              {#each recentFiles as file}
                <button 
                  class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] transition-colors font-mono text-left group"
                  onclick={() => handleOpenRecent(file.path)}
                  title={file.path}
                >
                  <FileCode size={13} class="text-[#8b949e] group-hover:text-[#58a6ff] shrink-0" />
                  <div class="truncate flex-1">
                    <div class="truncate text-white text-[11px]">{file.name}</div>
                    <div class="truncate text-[9px] text-[#484f58]">{file.path}</div>
                  </div>
                </button>
              {/each}
            {/if}
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
          Motor LaTeX: <span class="text-[#58a6ff] font-semibold">{compilationEngine || 'Detección Automática (Tectonic/pdflatex)'}</span>
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
          onStatsChange={(newStats: { lines: number; words: number }) => stats = newStats}
        />
      </div>

      <!-- Divisor Arrastrable (Resizer) -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div 
        class="w-1.5 hover:w-2 bg-[#21262d] hover:bg-[#58a6ff] transition-all cursor-col-resize select-none relative z-20 flex items-center justify-center group"
        onmousedown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={splitRatio}
      >
        <div class="w-0.5 h-6 bg-[#484f58] group-hover:bg-white rounded-full"></div>
      </div>

      <!-- Panel de Previsualización Reactiva KaTeX y PDF Real -->
      <div class="h-full overflow-hidden flex-1" style="width: {100 - splitRatio}%">
        <LatexPreview 
          content={documentContent}
          pdfBlobUrl={pdfBlobUrl}
          bind:previewMode
          onRenderTime={(ms: number) => renderTimeMs = ms}
          onExportPdf={() => handleExportPdf(false)}
          onOpenNative={handleOpenInSystemViewer}
          onTriggerCompile={handleCompile}
        />
      </div>
    </div>
  </div>

  <!-- Barra de Estado Inferior -->
  <StatusBar 
    lines={stats.lines}
    words={stats.words}
    renderTimeMs={renderTimeMs}
    isCompiling={isCompiling}
    compilationTimeMs={compilationTimeMs}
    compilationEngine={compilationEngine}
    compilationError={compilationError}
    p2pStatus={currentFilePath ? `Local: ${currentFileName}` : 'Sin Guardar (Memoria)'}
  />

  <!-- Modal de Éxito / Exportación de PDF (TICKET-012) -->
  {#if showPdfSuccessModal && lastCompiledPdf}
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl max-w-md w-full p-6 text-xs text-[#c9d1d9] space-y-4">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-[#238636]/20 text-[#3fb950] flex items-center justify-center shrink-0">
              <FileCheck size={18} />
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Compilación Completada</h3>
              <p class="text-[11px] text-[#8b949e]">Generado con {lastCompiledPdf.engine} en {lastCompiledPdf.durationMs} ms</p>
            </div>
          </div>
          <button 
            class="text-[#8b949e] hover:text-white transition-colors"
            onclick={() => showPdfSuccessModal = false}
          >
            <X size={16} />
          </button>
        </div>

        <div class="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-1.5 font-mono text-[11px]">
          <div class="flex justify-between">
            <span class="text-[#8b949e]">Archivo:</span>
            <span class="text-white font-medium">{lastCompiledPdf.name}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#8b949e]">Motor:</span>
            <span class="text-[#58a6ff]">{lastCompiledPdf.engine}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#8b949e]">Tiempo de compilación:</span>
            <span class="text-[#3fb950]">{lastCompiledPdf.durationMs} ms</span>
          </div>
          {#if lastExportedPath}
            <div class="pt-1 border-t border-[#21262d] flex flex-col gap-0.5">
              <span class="text-[#8b949e] text-[10px]">Ubicación exportada:</span>
              <span class="text-white text-[10px] break-all">{lastExportedPath}</span>
            </div>
          {/if}
        </div>

        <div class="space-y-2 pt-1">
          <button
            class="w-full py-2.5 px-4 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            onclick={handleOpenInSystemViewer}
          >
            <ExternalLink size={14} />
            <span>Abrir en Visor del Sistema</span>
          </button>

          <button
            class="w-full py-2 px-4 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white font-medium flex items-center justify-center gap-2 transition-colors"
            onclick={() => handleExportPdf(false)}
          >
            <Download size={14} />
            <span>{lastExportedPath ? 'Exportar a otra carpeta...' : 'Guardar / Exportar PDF...'}</span>
          </button>

          <button
            class="w-full py-1.5 px-4 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
            onclick={() => {
              previewMode = 'pdf';
              showPdfSuccessModal = false;
            }}
          >
            <Eye size={13} />
            <span>Ver PDF en Layratex</span>
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Modal de Errores de Compilación o Falta de Compilador -->
  {#if showErrorModal}
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-[#161b22] border border-[#da3633]/40 rounded-xl shadow-2xl max-w-lg w-full p-6 text-xs text-[#c9d1d9] space-y-4">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-[#da3633]/20 text-[#f85149] flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">{errorModalTitle}</h3>
              <p class="text-[11px] text-[#8b949e]">{errorModalMessage}</p>
            </div>
          </div>
          <button 
            class="text-[#8b949e] hover:text-white transition-colors"
            onclick={() => showErrorModal = false}
          >
            <X size={16} />
          </button>
        </div>

        {#if errorModalDetails}
          <div class="relative">
            <div class="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-[10.5px] max-h-56 overflow-y-auto whitespace-pre-wrap text-[#e6edf3] leading-relaxed">
              {errorModalDetails}
            </div>
            <button
              class="absolute top-2 right-2 p-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white transition-colors flex items-center gap-1 text-[10px]"
              onclick={copyErrorDetails}
              title="Copiar contenido"
            >
              {#if copiedError}
                <Check size={11} class="text-[#3fb950]" />
                <span class="text-[#3fb950]">Copiado</span>
              {:else}
                <Copy size={11} />
                <span>Copiar</span>
              {/if}
            </button>
          </div>
        {/if}

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            class="px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white font-medium transition-colors"
            onclick={() => showErrorModal = false}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>
