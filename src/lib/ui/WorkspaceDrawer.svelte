<script lang="ts">
  import {
    FolderOpen,
    Plus,
    FileCode,
    Clock,
    Trash2,
    Laptop,
    QrCode,
    FolderTree,
    Layers,
    Package,
    BookOpen,
    Sparkles,
    RefreshCw,
    X,
    FileCheck,
    Save,
    Download
  } from '@lucide/svelte';
  import type {
    FileItem,
    LatexProjectWorkspace,
    ProjectFileEntry
  } from '../services/fileService';
  import LayratexLogo from './LayratexLogo.svelte';

  interface Props {
    activeTab: 'files' | 'p2p' | 'settings' | '';
    currentFileName: string;
    currentFilePath: string | null;
    isDirty: boolean;
    recentFiles: FileItem[];
    compilationEngine: string | null;
    projectWorkspace?: LatexProjectWorkspace | null;
    activeProjectRelPath?: string | null;
    onOpen: () => void;
    onOpenProjectFolder?: () => void;
    onModularizeProject?: () => void;
    onSelectProjectFile?: (entry: ProjectFileEntry | null) => void;
    onCleanBuildDir?: () => void;
    onNewDocument: () => void;
    onSave: () => void;
    onExportWord: () => void;
    onOpenRecent: (path: string, isProject?: boolean) => void;
    onClearRecents: () => void;
    onOpenPreferences: () => void;
    onClose?: () => void;
  }

  let {
    activeTab,
    currentFileName,
    currentFilePath,
    isDirty,
    recentFiles,
    compilationEngine,
    projectWorkspace = null,
    activeProjectRelPath = null,
    onOpen,
    onOpenProjectFolder,
    onModularizeProject,
    onSelectProjectFile,
    onCleanBuildDir,
    onNewDocument,
    onSave,
    onExportWord,
    onOpenRecent,
    onClearRecents,
    onOpenPreferences,
    onClose = () => {}
  }: Props = $props();

  let rootFiles = $derived(
    projectWorkspace
      ? projectWorkspace.files.filter(
          (f) => f.category !== 'build' && !f.relative_path.includes('/')
        )
      : []
  );

  let subfolderFiles = $derived(
    projectWorkspace
      ? projectWorkspace.files.filter(
          (f) => f.category !== 'build' && f.relative_path.includes('/')
        )
      : []
  );

  let buildFiles = $derived(
    projectWorkspace
      ? projectWorkspace.files.filter((f) => f.category === 'build')
      : []
  );
</script>

{#if activeTab === 'files'}
  <aside 
    class="w-76 md:w-80 bg-[#090d16]/95 backdrop-blur-md border-r border-white/10 flex flex-col text-xs shrink-0 select-none h-full overflow-hidden z-20 transition-all duration-200 shadow-2xl"
    aria-label="Panel de Espacio de Trabajo"
  >
    <!-- Encabezado del Panel con Branding y Acciones Rápidas -->
    <div class="p-3 border-b border-white/10 space-y-2.5 shrink-0 bg-[#0e1320]/80">
      <div class="flex items-center justify-between min-w-0">
        <div class="flex items-center gap-2 min-w-0">
          <LayratexLogo size={20} showText={false} showBadge={false} />
          <span class="font-bold text-[11px] tracking-wider uppercase text-slate-300 truncate">Espacio de Trabajo</span>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button
            class="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            onclick={onOpen}
            title="Abrir archivo .tex (Ctrl+O)"
          >
            <FolderOpen size={13} />
          </button>
          <button
            class="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            onclick={onNewDocument}
            title="Crear nuevo documento (Ctrl+N)"
          >
            <Plus size={14} />
          </button>
          <button
            class="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ml-0.5"
            onclick={onClose}
            title="Cerrar panel lateral"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <!-- Acciones de Proyecto: Abrir .tex o Carpeta Modular -->
      <div class="grid grid-cols-2 gap-1.5">
        <button
          class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 hover:text-white text-[11px] font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          onclick={onOpen}
          title="Abrir un archivo .tex independiente"
        >
          <FileCode size={13} class="text-indigo-400 shrink-0" />
          <span class="truncate">Abrir .tex</span>
        </button>
        <button
          class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          onclick={() => onOpenProjectFolder?.()}
          title="Abrir una carpeta con subarchivos (\input, figuras, .bib, build/)"
        >
          <FolderTree size={13} class="text-indigo-400 shrink-0" />
          <span class="truncate">Abrir Carpeta</span>
        </button>
      </div>

      <button
        class="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-[11px] font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
        onclick={() => onModularizeProject?.()}
        title="Divide automáticamente tu documento por secciones en subcarpetas (main.tex + secciones/ + figuras/ + build/)"
      >
        <Sparkles size={12} class="shrink-0 text-emerald-400" />
        <span class="truncate">Estructurar Proyecto + build/</span>
      </button>
    </div>

    <!-- Tarjeta del Documento / Proyecto Activo (Anti-Desbordamiento) -->
    <div class="p-3 space-y-2 border-b border-white/10 shrink-0 bg-[#090d16]">
      <div class="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex flex-col gap-1 min-w-0">
        <div class="flex items-center justify-between min-w-0 gap-2">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            {#if projectWorkspace}
              <FolderTree size={14} class="text-emerald-400 shrink-0" />
            {:else}
              <FileCode size={14} class="text-indigo-400 shrink-0" />
            {/if}
            <span class="font-mono font-semibold text-white truncate text-[11px]" title={currentFileName}>
              {currentFileName}
            </span>
          </div>
          {#if isDirty}
            <span class="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_rgba(245,158,11,0.8)]" title="Cambios sin guardar"></span>
          {:else}
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Guardado"></span>
          {/if}
        </div>

        {#if currentFilePath}
          <div class="text-[9.5px] text-slate-400 font-mono truncate" title={currentFilePath}>
            {currentFilePath}
          </div>
        {/if}
      </div>

      <!-- Botones Rápidos de Guardado y Exportación -->
      <div class="grid grid-cols-2 gap-1.5">
        <button
          class="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 hover:text-white text-[11px] font-medium transition-colors cursor-pointer truncate"
          onclick={onSave}
          title="Guardar documento o cambios en disco (Ctrl+S)"
        >
          <Save size={11} class="shrink-0" />
          <span class="truncate">Guardar</span>
        </button>
        <button
          class="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#185abd]/80 hover:bg-[#1f6feb] border border-blue-400/25 text-white text-[11px] font-medium transition-colors cursor-pointer truncate shadow-xs"
          onclick={onExportWord}
          title="Exportar a Microsoft Word con ecuaciones LaTeX (Ctrl+Shift+W)"
        >
          <Download size={11} class="shrink-0" />
          <span class="truncate">Word .docx</span>
        </button>
      </div>
    </div>

    <!-- Si hay un Proyecto Multi-Carpeta Activo, mostrar su Árbol Modular -->
    {#if projectWorkspace}
      <div class="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-3 border-b border-white/10 min-w-0">
        <!-- Vista Ensamblada Completa -->
        <div>
          <div class="px-1.5 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between min-w-0">
            <span class="truncate">Proyecto: {projectWorkspace.project_name}</span>
          </div>
          <button
            class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left font-medium transition-all cursor-pointer min-w-0 {activeProjectRelPath === null ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-xs' : 'text-slate-300 hover:bg-white/5'}"
            onclick={() => onSelectProjectFile?.(null)}
            title="Muestra y edita todo el proyecto ensamblado (resolviendo \input de las subcarpetas)"
          >
            <Layers size={13} class="text-emerald-400 shrink-0" />
            <div class="truncate flex-1 min-w-0">
              <div class="text-[11px] font-semibold truncate">Documento Ensamblado</div>
              <div class="text-[9.5px] text-slate-400 truncate">Une main.tex + subcarpetas</div>
            </div>
          </button>
        </div>

        <!-- 1. Archivos Raíz (main.tex, referencias.bib, .cls) -->
        {#if rootFiles.length > 0}
          <div class="min-w-0">
            <div class="px-1.5 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Raíz del Proyecto ({rootFiles.length})
            </div>
            <div class="space-y-0.5 min-w-0">
              {#each rootFiles as file}
                <button
                  class="w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded-md font-mono text-[11px] text-left transition-colors cursor-pointer min-w-0 {activeProjectRelPath === file.relative_path ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-300 hover:bg-white/5'}"
                  onclick={() => onSelectProjectFile?.(file)}
                  title={file.full_path}
                >
                  <div class="flex items-center gap-1.5 truncate flex-1 min-w-0">
                    {#if file.category === 'bib'}
                      <BookOpen size={12} class="text-amber-400 shrink-0" />
                    {:else}
                      <FileCode size={12} class="text-indigo-400 shrink-0" />
                    {/if}
                    <span class="truncate">{file.name}</span>
                  </div>
                  {#if file.is_main}
                    <span class="text-[8.5px] font-bold px-1 py-0.5 rounded bg-indigo-500/25 text-indigo-300 shrink-0">MAIN</span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- 2. Subcarpetas Modulares (secciones/, capitulos/, figuras/) -->
        <div class="min-w-0">
          <div class="px-1.5 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Subcarpetas (\input) ({subfolderFiles.length})
          </div>
          {#if subfolderFiles.length === 0}
            <div class="px-2 py-1.5 text-[10px] text-slate-500 leading-snug">
              Usa «Estructurar Proyecto» para organizar capítulos por carpetas.
            </div>
          {:else}
            <div class="space-y-0.5 min-w-0">
              {#each subfolderFiles as file}
                <button
                  class="w-full flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[11px] text-left transition-colors cursor-pointer min-w-0 {activeProjectRelPath === file.relative_path ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}"
                  onclick={() => onSelectProjectFile?.(file)}
                  title={file.full_path}
                >
                  <FileCode size={12} class="text-sky-400 shrink-0" />
                  <span class="truncate flex-1 min-w-0">{file.relative_path}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- 3. Carpeta build/ (.aux, .toc, .log, .pdf, .docx) -->
        <div class="min-w-0">
          <div class="px-1.5 pb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-amber-400/90">
            <div class="flex items-center gap-1">
              <Package size={11} />
              <span>build/ ({buildFiles.length})</span>
            </div>
            {#if buildFiles.length > 0}
              <button
                class="text-[9px] text-slate-400 hover:text-rose-400 flex items-center gap-0.5 cursor-pointer transition-colors"
                onclick={() => onCleanBuildDir?.()}
                title="Limpiar archivos auxiliares de build/"
              >
                <RefreshCw size={9} />
                <span>Limpiar</span>
              </button>
            {/if}
          </div>
          {#if buildFiles.length === 0}
            <div class="px-2 py-1 text-[10px] text-slate-500 leading-snug">
              Compila o guarda para poblar `build/` (.pdf, .log, .aux).
            </div>
          {:else}
            <div class="space-y-0.5 min-w-0">
              {#each buildFiles as file}
                <button
                  class="w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded-md font-mono text-[10.5px] text-left transition-colors cursor-pointer min-w-0 {activeProjectRelPath === file.relative_path ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:bg-white/5 hover:text-amber-200'}"
                  onclick={() => onSelectProjectFile?.(file)}
                  title={file.full_path}
                >
                  <span class="truncate flex-1 min-w-0">{file.relative_path}</span>
                  <span class="text-[8.5px] uppercase opacity-60 font-semibold shrink-0">{file.name.split('.').pop()}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Archivos y Proyectos Recientes (Anti-Desbordamiento) -->
    <div class="{projectWorkspace ? 'max-h-52' : 'flex-1'} flex flex-col overflow-hidden min-w-0 shrink-0">
      <div class="p-3 pb-1.5 flex items-center justify-between font-semibold text-slate-400 tracking-wider uppercase text-[9.5px]">
        <div class="flex items-center gap-1.5">
          <Clock size={11} />
          <span>Historial Reciente</span>
        </div>
        {#if recentFiles.length > 0}
          <button 
            class="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer p-0.5" 
            onclick={onClearRecents}
            title="Limpiar historial de recientes"
          >
            <Trash2 size={11} />
          </button>
        {/if}
      </div>

      <div class="p-2 space-y-1 overflow-y-auto overflow-x-hidden flex-1 min-w-0">
        {#if recentFiles.length === 0}
          <div class="p-4 text-center text-slate-500 text-[11px]">
            No hay documentos recientes aún.
          </div>
        {:else}
          {#each recentFiles as file}
            <button 
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-mono text-left group cursor-pointer min-w-0"
              onclick={() => onOpenRecent(file.path, file.isProject)}
              title={file.path}
            >
              {#if file.isProject}
                <FolderTree size={13} class="text-emerald-400 shrink-0" />
              {:else}
                <FileCode size={13} class="text-slate-400 group-hover:text-indigo-400 shrink-0 transition-colors" />
              {/if}
              <div class="truncate flex-1 min-w-0">
                <div class="truncate text-white text-[11px] font-medium leading-tight">{file.name}</div>
                <div class="truncate text-[9px] text-slate-500 font-mono leading-normal">{file.path}</div>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </aside>
{:else if activeTab === 'p2p'}
  <aside 
    class="w-72 md:w-80 bg-[#090d16]/95 backdrop-blur-md border-r border-white/10 flex flex-col text-xs shrink-0 select-none h-full overflow-hidden z-20 shadow-2xl"
    aria-label="Panel P2P"
  >
    <div class="p-3 border-b border-white/10 flex items-center justify-between font-semibold text-slate-300 tracking-wider uppercase text-[10px] bg-[#0e1320]/80">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
        <span class="truncate">Red P2P & Dispositivos</span>
      </div>
      <button class="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" onclick={onClose} title="Cerrar panel lateral">
        <X size={14} />
      </button>
    </div>
    <div class="p-3 space-y-4 overflow-y-auto overflow-x-hidden flex-1 min-w-0">
      <div class="p-3 rounded-lg border border-white/10 bg-white/5 space-y-1.5 min-w-0">
        <div class="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider">Este Dispositivo</div>
        <div class="flex items-center gap-2 text-white font-medium">
          <Laptop size={15} class="text-indigo-400 shrink-0" />
          <span class="truncate">Estación Principal (Local)</span>
        </div>
        <div class="font-mono text-[9.5px] text-slate-400 truncate" title="Ed25519 PubKey">
          ed25519:7a9c...f482
        </div>
      </div>

      <button class="w-full py-2 px-3 rounded-lg bg-indigo-500/20 border border-indigo-500/40 hover:bg-indigo-500/30 text-indigo-300 flex items-center justify-center gap-2 font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]">
        <QrCode size={14} />
        <span>Vincular Nuevo Equipo (QR)</span>
      </button>

      <div class="min-w-0">
        <div class="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider mb-2">Dispositivos en el Enjambre</div>
        <div class="space-y-1.5 min-w-0">
          <div class="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between min-w-0">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <Laptop size={14} class="text-emerald-400 shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="text-white text-[11px] font-medium truncate">Laptop Portátil</div>
                <div class="text-[9.5px] text-emerald-400 flex items-center gap-1.5 truncate">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <span class="truncate">En línea (P2P Directo)</span>
                </div>
              </div>
            </div>
            <span class="text-[9.5px] text-slate-400 font-mono shrink-0 ml-1">12 ms</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
{:else if activeTab === 'settings'}
  <aside 
    class="w-72 md:w-80 bg-[#090d16]/95 backdrop-blur-md border-r border-white/10 p-4 text-xs shrink-0 space-y-4 h-full overflow-y-auto overflow-x-hidden z-20 shadow-2xl"
    aria-label="Panel de Ajustes Rápidos"
  >
    <div class="flex items-center justify-between border-b border-white/10 pb-3">
      <h3 class="font-bold text-white text-sm">Ajustes del Editor</h3>
      <button class="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" onclick={onClose} title="Cerrar panel">
        <X size={14} />
      </button>
    </div>
    <div class="space-y-2.5">
      <div class="p-2.5 rounded-lg bg-white/5 border border-white/5">
        <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Motor LaTeX</div>
        <div class="text-indigo-400 font-semibold font-mono text-[11px]">
          {compilationEngine || 'Detección Automática (Tectonic/pdflatex)'}
        </div>
      </div>
      <div class="p-2.5 rounded-lg bg-white/5 border border-white/5">
        <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Exportación Word</div>
        <div class="text-emerald-400 font-semibold font-mono text-[11px]">
          OpenXML + Office Math (OMML)
        </div>
      </div>
    </div>
    <button
      class="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer shadow-md transition-all active:scale-[0.98]"
      onclick={onOpenPreferences}
    >
      Abrir Preferencias Completas
    </button>
  </aside>
{/if}
