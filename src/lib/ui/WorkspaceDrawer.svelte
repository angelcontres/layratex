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
    X
  } from '@lucide/svelte';
  import type {
    FileItem,
    LatexProjectWorkspace,
    ProjectFileEntry
  } from '../services/fileService';

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
  <div class="w-72 bg-[#0d1117] border-r border-[#21262d] flex flex-col text-xs shrink-0 select-none h-full overflow-hidden">
    <!-- Encabezado de Acciones: Archivo .tex vs Proyecto por Carpetas + build/ -->
    <div class="p-3 border-b border-[#21262d] space-y-2">
      <div class="flex items-center justify-between font-semibold text-[#8b949e] tracking-wider uppercase text-[10px]">
        <span>Espacio de Trabajo LaTeX</span>
        <div class="flex items-center gap-1.5">
          <button
            class="hover:text-white cursor-pointer"
            onclick={onOpen}
            title="Abrir archivo .tex individual (Ctrl+O)"
          >
            <FolderOpen size={13} />
          </button>
          <button
            class="hover:text-white cursor-pointer"
            onclick={onNewDocument}
            title="Crear nuevo documento (Ctrl+N)"
          >
            <Plus size={14} />
          </button>
          <button
            class="hover:text-white cursor-pointer ml-1 text-slate-400 hover:bg-white/10 p-0.5 rounded"
            onclick={onClose}
            title="Cerrar panel lateral"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <!-- Botones para los 3 Modos de Estructura: .tex suelto, Carpeta de Proyecto, o Modularizar en Carpetas + build/ -->
      <div class="grid grid-cols-2 gap-1.5">
        <button
          class="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-200 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
          onclick={onOpen}
          title="Abrir un único archivo .tex"
        >
          <FileCode size={12} class="text-indigo-400" />
          <span>Abrir .tex</span>
        </button>
        <button
          class="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium transition-colors cursor-pointer"
          onclick={() => onOpenProjectFolder?.()}
          title="Abrir una carpeta de proyecto con subcarpetas (secciones/, figuras/, .bib, build/)"
        >
          <FolderTree size={12} />
          <span>Abrir Carpeta</span>
        </button>
      </div>

      <button
        class="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer"
        onclick={() => onModularizeProject?.()}
        title="Divide automáticamente tu documento por secciones en subcarpetas (main.tex + secciones/ + figuras/ + referencias.bib + build/)"
      >
        <Sparkles size={12} />
        <span>Estructurar en Carpetas + build/</span>
      </button>
    </div>

    <!-- Estado del Documento o Proyecto Activo -->
    <div class="p-2.5 space-y-1.5 border-b border-[#21262d]">
      <div class="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#1f6feb1f] text-[#58a6ff] font-mono">
        <div class="flex items-center gap-2 truncate">
          {#if projectWorkspace}
            <FolderTree size={14} class="text-emerald-400 shrink-0" />
          {:else}
            <FileCode size={14} class="shrink-0" />
          {/if}
          <span class="truncate">{currentFileName}</span>
        </div>
        {#if isDirty}
          <span class="w-1.5 h-1.5 rounded-full bg-[#f0883e]" title="Cambios sin guardar"></span>
        {/if}
      </div>

      {#if currentFilePath}
        <div class="px-2 py-0.5 text-[10px] text-[#8b949e] font-mono truncate" title={currentFilePath}>
          {currentFilePath}
        </div>
      {/if}

      <div class="grid grid-cols-2 gap-1.5 pt-1">
        <button
          class="px-2 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-white text-[11px] font-medium cursor-pointer"
          onclick={onSave}
        >
          Guardar {projectWorkspace ? 'Proyecto' : '.tex'}
        </button>
        <button
          class="px-2 py-1.5 rounded bg-[#185abd] hover:bg-[#1f6feb] text-white text-[11px] font-medium cursor-pointer"
          onclick={onExportWord}
        >
          Exportar .docx
        </button>
      </div>
    </div>

    <!-- Si hay un Proyecto Multi-Carpeta Activo, mostrar su Árbol (Raíz, Subcarpetas y build/) -->
    {#if projectWorkspace}
      <div class="flex-1 overflow-y-auto p-2 space-y-3 border-b border-[#21262d]">
        <!-- Botón de Vista Ensamblada (une todos los \input para Hoja Visual, Preview y Word/PDF) -->
        <div>
          <div class="px-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Proyecto: {projectWorkspace.project_name}</span>
          </div>
          <button
            class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left font-medium transition-colors cursor-pointer {activeProjectRelPath === null ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-[#161b22]'}"
            onclick={() => onSelectProjectFile?.(null)}
            title="Muestra y edita todo el proyecto unido (resolviendo todos los \input de las subcarpetas)"
          >
            <Layers size={13} class="text-emerald-400 shrink-0" />
            <div class="truncate">
              <div class="text-[11px] font-semibold">Documento Ensamblado Completo</div>
              <div class="text-[9.5px] opacity-75">Une main.tex + subcarpetas (\input)</div>
            </div>
          </button>
        </div>

        <!-- 1. Archivos Raíz (main.tex, referencias.bib, .cls) -->
        {#if rootFiles.length > 0}
          <div>
            <div class="px-1.5 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-[#8b949e]">
              Raíz del Proyecto ({rootFiles.length})
            </div>
            <div class="space-y-0.5">
              {#each rootFiles as file}
                <button
                  class="w-full flex items-center justify-between px-2 py-1 rounded font-mono text-[11px] text-left transition-colors cursor-pointer {activeProjectRelPath === file.relative_path ? 'bg-indigo-500/20 text-indigo-300' : 'text-[#c9d1d9] hover:bg-[#161b22]'}"
                  onclick={() => onSelectProjectFile?.(file)}
                  title={file.full_path}
                >
                  <div class="flex items-center gap-1.5 truncate">
                    {#if file.category === 'bib'}
                      <BookOpen size={12} class="text-amber-400 shrink-0" />
                    {:else}
                      <FileCode size={12} class="text-indigo-400 shrink-0" />
                    {/if}
                    <span class="truncate">{file.name}</span>
                  </div>
                  {#if file.is_main}
                    <span class="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300">RAÍZ</span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- 2. Subcarpetas Modulares (secciones/, capitulos/, figuras/) -->
        <div>
          <div class="px-1.5 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-[#8b949e]">
            Subcarpetas (\input / recursos) ({subfolderFiles.length})
          </div>
          {#if subfolderFiles.length === 0}
            <div class="px-2 py-1.5 text-[10.5px] text-[#6e7681]">
              Usa «Estructurar en Carpetas + build/» para dividir por secciones.
            </div>
          {:else}
            <div class="space-y-0.5">
              {#each subfolderFiles as file}
                <button
                  class="w-full flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[11px] text-left transition-colors cursor-pointer {activeProjectRelPath === file.relative_path ? 'bg-indigo-500/20 text-indigo-300' : 'text-[#8b949e] hover:bg-[#161b22] hover:text-white'}"
                  onclick={() => onSelectProjectFile?.(file)}
                  title={file.full_path}
                >
                  <FileCode size={12} class="text-sky-400 shrink-0" />
                  <span class="truncate">{file.relative_path}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- 3. Carpeta build/ (.aux, .toc, .log, .pdf, .docx) -->
        <div>
          <div class="px-1.5 pb-1 flex items-center justify-between text-[9.5px] font-bold uppercase tracking-wider text-amber-400/90">
            <div class="flex items-center gap-1">
              <Package size={11} />
              <span>Carpeta build/ ({buildFiles.length})</span>
            </div>
            {#if buildFiles.length > 0}
              <button
                class="text-[9.5px] text-slate-400 hover:text-rose-400 flex items-center gap-0.5 cursor-pointer"
                onclick={() => onCleanBuildDir?.()}
                title="Limpiar archivos auxiliares (.aux, .log, .toc) de build/"
              >
                <RefreshCw size={10} />
                <span>Limpiar</span>
              </button>
            {/if}
          </div>
          {#if buildFiles.length === 0}
            <div class="px-2 py-1.5 text-[10.5px] text-[#6e7681]">
              Compila o guarda el proyecto para poblar `build/` (.pdf, .log, .aux, .toc).
            </div>
          {:else}
            <div class="space-y-0.5">
              {#each buildFiles as file}
                <button
                  class="w-full flex items-center justify-between px-2 py-1 rounded font-mono text-[10.5px] text-left transition-colors cursor-pointer {activeProjectRelPath === file.relative_path ? 'bg-amber-500/20 text-amber-300' : 'text-[#8b949e] hover:bg-[#161b22] hover:text-amber-200'}"
                  onclick={() => onSelectProjectFile?.(file)}
                  title={file.full_path}
                >
                  <span class="truncate">{file.relative_path}</span>
                  <span class="text-[9px] uppercase opacity-60">{file.name.split('.').pop()}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Archivos y Proyectos Recientes -->
    <div class="{projectWorkspace ? 'max-h-44' : 'flex-1'} flex flex-col overflow-hidden">
      <div class="p-3 pb-1 flex items-center justify-between font-semibold text-[#8b949e] tracking-wider uppercase text-[10px]">
        <div class="flex items-center gap-1.5">
          <Clock size={12} />
          <span>Recientes</span>
        </div>
        {#if recentFiles.length > 0}
          <button 
            class="hover:text-[#f85149] transition-colors cursor-pointer" 
            onclick={onClearRecents}
            title="Limpiar recientes"
          >
            <Trash2 size={12} />
          </button>
        {/if}
      </div>

      <div class="p-2 space-y-1 overflow-y-auto flex-1">
        {#if recentFiles.length === 0}
          <div class="p-4 text-center text-[#484f58] text-[11px]">
            No hay archivos ni proyectos recientes aún.
          </div>
        {:else}
          {#each recentFiles as file}
            <button 
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] transition-colors font-mono text-left group cursor-pointer"
              onclick={() => onOpenRecent(file.path, file.isProject)}
              title={file.path}
            >
              {#if file.isProject}
                <FolderTree size={13} class="text-emerald-400 shrink-0" />
              {:else}
                <FileCode size={13} class="text-[#8b949e] group-hover:text-[#58a6ff] shrink-0" />
              {/if}
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
  <div class="w-64 bg-[#0d1117] border-r border-[#21262d] flex flex-col text-xs shrink-0 h-full overflow-hidden">
    <div class="p-3 border-b border-[#21262d] flex items-center justify-between font-semibold text-[#8b949e] tracking-wider uppercase text-[10px]">
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-[#3fb950]"></span>
        <span>Red P2P & Dispositivos</span>
      </div>
      <button class="hover:text-white cursor-pointer text-slate-400 hover:bg-white/10 p-0.5 rounded" onclick={onClose} title="Cerrar panel lateral">
        <X size={13} />
      </button>
    </div>
    <div class="p-3 space-y-4 overflow-y-auto">
      <div class="p-2.5 rounded border border-[#30363d] bg-[#161b22]">
        <div class="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider mb-1">Este Dispositivo</div>
        <div class="flex items-center gap-2 text-white font-medium">
          <Laptop size={15} class="text-[#58a6ff]" />
          <span>Estación Principal</span>
        </div>
        <div class="mt-1 font-mono text-[10px] text-[#8b949e] truncate" title="Ed25519 PubKey">
          ed25519:7a9c...f482
        </div>
      </div>

      <button class="w-full py-2 px-3 rounded bg-[#a371f7]/20 border border-[#a371f7]/40 hover:bg-[#a371f7]/30 text-[#d2a8ff] flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer">
        <QrCode size={14} />
        <span>Vincular Nuevo Equipo (QR)</span>
      </button>

      <div>
        <div class="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider mb-2">Dispositivos en el Enjambre</div>
        <div class="space-y-1.5">
          <div class="p-2 rounded bg-[#161b22] border border-[#21262d] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Laptop size={14} class="text-[#3fb950]" />
              <div>
                <div class="text-white text-[11px] font-medium">Laptop Portátil</div>
                <div class="text-[10px] text-[#3fb950] flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse"></span>
                  <span>En línea (P2P Directo)</span>
                </div>
              </div>
            </div>
            <span class="text-[10px] text-[#8b949e] font-mono">12 ms</span>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else if activeTab === 'settings'}
  <div class="w-60 bg-[#0d1117] border-r border-[#21262d] p-4 text-xs shrink-0 space-y-3 h-full overflow-y-auto">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-white">Ajustes del Editor</h3>
      <button class="hover:text-white cursor-pointer text-slate-400 hover:bg-white/10 p-0.5 rounded" onclick={onClose} title="Cerrar panel lateral">
        <X size={13} />
      </button>
    </div>
    <p class="text-[#8b949e] text-[11px] leading-relaxed">
      Motor LaTeX: <span class="text-[#58a6ff] font-semibold">{compilationEngine || 'Detección Automática (Tectonic/pdflatex)'}</span>
    </p>
    <p class="text-[#8b949e] text-[11px] leading-relaxed">
      Exportación Word: <span class="text-[#3fb950] font-semibold">OpenXML + Office Math (OMML)</span>
    </p>
    <button
      class="w-full py-1.5 px-3 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer"
      onclick={onOpenPreferences}
    >
      Abrir Preferencias Completas
    </button>
  </div>
{/if}
