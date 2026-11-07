<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Sidebar,
    StatusBar,
    ErrorPanel,
    PreferencesModal,
    WorkspaceDrawer,
    ExportModals,
    LayratexLogo
  } from './lib/ui';
  import { LatexEditor } from './lib/editor';
  import { LatexPreview } from './lib/preview';
  import {
    PaperEditor,
    KeyboardHelpModal,
    WELCOME_TITLE,
    WELCOME_CONTENT,
    TEMPLATE_PRESETS,
    type DocumentTemplate,
    visualToLatex,
    latexToVisual,
    extractLatexMetadata,
    resolveLatexInputsInMemory
  } from './lib/visual';
  import {
    preferencesService,
    type UserPreferences,
    fileService,
    type FileItem,
    type LatexProjectWorkspace,
    type ProjectFileEntry,
    compilerService,
    pdfExportService,
    wordExportService,
    parseLatexLog,
    type LogIssue,
    ScrollSyncCoordinator
  } from './lib/services';
  import { 
    Download, 
    Plus, 
    FolderOpen, 
    FolderTree,
    Save,
    Check,
    Loader2,
    ChevronDown,
    FileText,
    Code2,
    Calculator,
    Moon,
    Sun,
    Scroll,
    BookOpen,
    Palette,
    Settings as SettingsIcon
  } from '@lucide/svelte';

  let editorViewMode = $state<'visual' | 'code'>('visual');
  let selectedFont = $state<'serif' | 'sans'>('serif');
  let showPreferencesModal = $state(false);
  let showTemplatesMenu = $state(false);
  let showAppearanceMenu = $state(false);
  let userPreferences = $state<UserPreferences>(preferencesService.getPreferences());
  let isLightTheme = $derived(preferencesService.resolveTheme(userPreferences.theme) === 'light');
  // Por defecto iniciamos con 'white' (Hoja Blanca LaTeX Clásica) para lucir idéntico a un artículo LaTeX real
  let paperTone = $state<'dark' | 'cream' | 'sepia' | 'white'>('white');
  let paperEditorRef = $state<{
    openMathEditor: (tex?: string) => void;
    getPrintPages?: () => HTMLElement[];
    openFind?: () => void;
    openReplacePanel?: () => void;
    flushActiveBlock?: () => string;
    resetEditorState?: () => void;
  } | null>(null);
  let documentTitle = $state<string>(WELCOME_TITLE);
  let documentAuthor = $state<string>('Equipo Editorial Layratex');
  let visualContent = $state<string>(WELCOME_CONTENT);
  let visualStats = $state({ words: 0, pages: 1 });
  let showHelpModal = $state(false);

  // Auto-Guardado
  let autoSaveEnabled = $state<boolean>(true);
  let isAutoSaving = $state<boolean>(false);
  let lastSavedTime = $state<Date | null>(null);
  let autoSaveTimer: any = null;

  let activeTab = $state<'files' | 'p2p' | 'settings' | ''>('');
  let splitRatio = $state(50);
  let isDragging = $state(false);

  // Estado del Documento y Proyecto Multi-Carpeta (main.tex + secciones/ + build/)
  let currentFilePath = $state<string | null>(null);
  let currentFileName = $state<string>('articulo.tex');
  let projectWorkspace = $state<LatexProjectWorkspace | null>(null);
  let activeProjectRelPath = $state<string | null>(null);

  const initialLatex = visualToLatex(WELCOME_CONTENT, {
    title: WELCOME_TITLE,
    author: 'Equipo Editorial Layratex',
    fontStyle: 'serif'
  });
  let documentContent = $state(initialLatex);
  let savedContent = $state(initialLatex);
  let savedVisualContent = $state<string>(WELCOME_CONTENT);
  let savedTitle = $state<string>(WELCOME_TITLE);
  let savedAuthor = $state<string>('Equipo Editorial Layratex');
  let isDirty = $derived(
    editorViewMode === 'visual'
      ? (visualContent !== savedVisualContent || documentTitle !== savedTitle || documentAuthor !== savedAuthor)
      : (documentContent !== savedContent)
  );

  // Contenido LaTeX resuelto con todos los \input{...} e \include{...} para Vista Previa y Exportación
  let previewLatexContent = $derived(
    projectWorkspace
      ? resolveLatexInputsInMemory(documentContent, projectWorkspace.tex_files_map)
      : documentContent
  );

  let stats = $state({ lines: 0, words: 0 });
  let renderTimeMs = $state(0);
  let statusMessage = $state<string | null>(null);
  let statusMessageType = $state<'success' | 'error' | 'info'>('info');
  let recentFiles = $state<FileItem[]>([]);

  // Estado de Compilación & Exportación (PDF y Word .docx)
  let isCompiling = $state(false);
  let isExportingWord = $state(false);
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
    format?: 'pdf' | 'docx';
  } | null>(null);

  let editorRef = $state<{
    goToLine: (line: number) => void;
    getScrollElement?: () => HTMLElement | null;
    setScrollTop?: (top: number) => void;
    openSearch?: () => void;
    openReplace?: () => void;
  } | null>(null);

  let previewRef = $state<{
    getScrollElement?: () => HTMLElement | null;
    setScrollTop?: (top: number) => void;
  } | null>(null);
  let scrollSyncEnabled = $state<boolean>(true);
  const scrollCoordinator = new ScrollSyncCoordinator({ debounceMs: 100, enabled: true });

  $effect(() => {
    scrollCoordinator.setEnabled(scrollSyncEnabled);
  });

  function handleEditorScroll(editorEl: HTMLElement) {
    if (!scrollSyncEnabled) return;
    const previewEl = previewRef?.getScrollElement?.();
    if (!previewEl) return;
    scrollCoordinator.sync(editorEl, previewEl, (targetTop) => {
      previewRef?.setScrollTop?.(targetTop);
    });
  }

  function handlePreviewScroll(previewEl: HTMLElement) {
    if (!scrollSyncEnabled) return;
    const editorEl = editorRef?.getScrollElement?.();
    if (!editorEl) return;
    scrollCoordinator.sync(previewEl, editorEl, (targetTop) => {
      editorRef?.setScrollTop?.(targetTop);
    });
  }

  let compilationIssues = $state<LogIssue[]>([]);
  let showErrorPanel = $state(false);
  let errorCount = $derived(compilationIssues.filter(i => i.type === 'error').length);
  let warningCount = $derived(compilationIssues.filter(i => i.type === 'warning').length);

  // Modales de Compilación y Error
  let showPdfSuccessModal = $state(false);
  let showErrorModal = $state(false);
  let errorModalTitle = $state('');
  let errorModalMessage = $state('');
  let errorModalDetails = $state('');

  onMount(() => {
    recentFiles = fileService.getRecentFiles();

    const savedAutoPref = localStorage.getItem('layratex_autosave_enabled');
    if (savedAutoPref !== null) {
      autoSaveEnabled = savedAutoPref === 'true';
    }

    // Recuperación automática de borrador en segundo plano (Two-Tier Draft Recovery)
    try {
      const draftContent = localStorage.getItem('layratex_draft_content');
      const draftTitle = localStorage.getItem('layratex_draft_title');
      const draftAuthor = localStorage.getItem('layratex_draft_author');
      if (draftContent && draftContent.trim().length > 0 && !currentFilePath && !projectWorkspace) {
        if (draftTitle) documentTitle = draftTitle;
        if (draftAuthor) documentAuthor = draftAuthor;
        visualContent = draftContent;
        documentContent = visualToLatex(draftContent, {
          title: documentTitle,
          author: documentAuthor,
          fontStyle: selectedFont
        });
        syncSavedSnapshot();
      }
    } catch {}

    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      } else if (isMod && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpen();
      } else if (isMod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewDocument();
      } else if (isMod && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleExportWord();
      } else if ((isMod && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        if (editorViewMode === 'code') {
          editorRef?.openSearch?.();
        } else {
          paperEditorRef?.openFind?.();
        }
        return;
      } else if ((isMod && e.key.toLowerCase() === 'h')) {
        e.preventDefault();
        if (editorViewMode === 'code') {
          editorRef?.openReplace?.();
        } else {
          paperEditorRef?.openReplacePanel?.();
        }
        return;
      } else if (((isMod && (e.key === 'Enter' || (editorViewMode === 'code' && e.key.toLowerCase() === 'b'))) || e.key === 'F5')) {
        e.preventDefault();
        handleCompile();
      } else if ((isMod && e.key === '?')) {
        e.preventDefault();
        showHelpModal = !showHelpModal;
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

  // --- Operaciones de Archivo, Proyectos Multi-Carpeta, Plantillas y Auto-Guardado ---

  function syncSavedSnapshot() {
    savedContent = documentContent;
    savedVisualContent = visualContent;
    savedTitle = documentTitle;
    savedAuthor = documentAuthor;
  }

  function applyLoadedLatexContent(content: string, fallbackName?: string) {
    paperEditorRef?.resetEditorState?.();
    const resolved = projectWorkspace
      ? resolveLatexInputsInMemory(content, projectWorkspace.tex_files_map)
      : content;
    documentContent = content;
    visualContent = latexToVisual(resolved);

    const meta = extractLatexMetadata(resolved);
    if (meta.title) {
      documentTitle = meta.title;
    } else if (fallbackName) {
      documentTitle = fallbackName.replace(/\.tex$/i, '');
    }
    if (meta.author) {
      documentAuthor = meta.author;
    }

    syncSavedSnapshot();
  }

  function applyLoadedProjectWorkspace(ws: LatexProjectWorkspace) {
    paperEditorRef?.resetEditorState?.();
    projectWorkspace = ws;
    activeProjectRelPath = null; // Por defecto en modo Ensamblado Completo para los 3 modos
    currentFilePath = ws.main_tex_path;
    currentFileName = `${ws.project_name} (${ws.main_tex_name})`;

    documentContent = ws.raw_main_content;
    visualContent = latexToVisual(ws.resolved_main_content);

    const meta = extractLatexMetadata(ws.resolved_main_content);
    if (meta.title) {
      documentTitle = meta.title;
    } else {
      documentTitle = ws.project_name;
    }
    if (meta.author) {
      documentAuthor = meta.author;
    }

    syncSavedSnapshot();
    recentFiles = fileService.getRecentFiles();
    activeTab = 'files';
  }

  async function handleOpenProjectFolder() {
    if (editorViewMode === 'visual') {
      paperEditorRef?.flushActiveBlock?.();
    }
    if (isDirty) {
      const confirmDiscard = window.confirm('Tienes cambios sin guardar. ¿Deseas abrir una carpeta de proyecto y descartar los cambios actuales?');
      if (!confirmDiscard) return;
    }

    try {
      const ws = await fileService.openProjectFolder();
      if (!ws) return;
      applyLoadedProjectWorkspace(ws);
      showNotification(`Proyecto cargado: ${ws.project_name} (${ws.files.length} archivos + build/)`, 'success');
    } catch (err: any) {
      showNotification(`Error al abrir carpeta de proyecto: ${err?.message || err}`, 'error');
    }
  }

  async function handleModularizeProject() {
    try {
      if (editorViewMode === 'visual') {
        const latestVisual = paperEditorRef?.flushActiveBlock?.() ?? visualContent;
        visualContent = latestVisual;
        documentContent = visualToLatex(latestVisual, {
          title: documentTitle,
          author: documentAuthor,
          fontStyle: selectedFont
        }, documentContent);
      }

      const fullCodeToSplit = projectWorkspace
        ? resolveLatexInputsInMemory(documentContent, projectWorkspace.tex_files_map)
        : documentContent;

      const ws = await fileService.createModularProjectStructure(
        fullCodeToSplit,
        projectWorkspace?.root_dir || null
      );
      if (!ws) return;

      applyLoadedProjectWorkspace(ws);
      showNotification(
        `Proyecto estructurado en carpetas: main.tex + ${ws.files.filter(f => f.relative_path.startsWith('secciones/')).length} secciones + build/`,
        'success'
      );
    } catch (err: any) {
      showNotification(`Error al estructurar proyecto en carpetas: ${err?.message || err}`, 'error');
    }
  }

  async function handleSelectProjectFile(entry: ProjectFileEntry | null) {
    if (!projectWorkspace) return;

    if (editorViewMode === 'visual') {
      paperEditorRef?.flushActiveBlock?.();
    }

    // Si selecciona "Documento Ensamblado Completo" (entry === null)
    if (entry === null) {
      activeProjectRelPath = null;
      currentFilePath = projectWorkspace.main_tex_path;
      currentFileName = `${projectWorkspace.project_name} (${projectWorkspace.main_tex_name})`;
      const resolved = resolveLatexInputsInMemory(
        projectWorkspace.raw_main_content,
        projectWorkspace.tex_files_map
      );
      documentContent = projectWorkspace.raw_main_content;
      visualContent = latexToVisual(resolved);
      syncSavedSnapshot();
      showNotification('Vista de Documento Ensamblado Completo activada', 'info');
      return;
    }

    // Si es un PDF o DOCX dentro de build/, abrirlo en el visor del sistema
    const lowerName = entry.name.toLowerCase();
    if (lowerName.endsWith('.pdf') || lowerName.endsWith('.docx')) {
      try {
        await compilerService.openPath(entry.full_path);
        showNotification(`Abriendo ${entry.relative_path} en el visor del sistema...`, 'info');
      } catch (err: any) {
        showNotification(`No se pudo abrir ${entry.name}: ${err?.message || err}`, 'error');
      }
      return;
    }

    // Cargar el subarchivo (.tex, .bib, .cls, .log, .toc, .aux)
    let fileText = projectWorkspace.tex_files_map[entry.relative_path];
    if (typeof fileText !== 'string' && fileService.isNative()) {
      try {
        fileText = await fileService.readNativeFile(entry.full_path);
        projectWorkspace.tex_files_map[entry.relative_path] = fileText;
      } catch (err: any) {
        showNotification(`No se pudo leer ${entry.relative_path}: ${err?.message || err}`, 'error');
        return;
      }
    }

    if (typeof fileText === 'string') {
      activeProjectRelPath = entry.relative_path;
      currentFilePath = entry.full_path;
      currentFileName = entry.relative_path;
      documentContent = fileText;

      if (entry.category === 'tex') {
        const resolved = entry.is_main
          ? resolveLatexInputsInMemory(fileText, projectWorkspace.tex_files_map)
          : fileText;
        visualContent = latexToVisual(resolved);
      } else {
        // Para archivos .bib, .cls, .log, .aux, .toc mostrar en modo código
        editorViewMode = 'code';
      }
      syncSavedSnapshot();
      showNotification(`Editando: ${entry.relative_path}`, 'info');
    }
  }

  async function handleCleanBuildDir() {
    if (!projectWorkspace) return;
    try {
      const count = await fileService.cleanProjectBuildDir(projectWorkspace.root_dir);
      const refreshed = await fileService.refreshProjectWorkspace(projectWorkspace.root_dir);
      if (refreshed) {
        projectWorkspace = refreshed;
      }
      showNotification(`Carpeta build/ limpiada (${count} archivos eliminados)`, 'info');
    } catch (err: any) {
      showNotification(`Error al limpiar build/: ${err?.message || err}`, 'error');
    }
  }

  function applyTemplate(tpl: DocumentTemplate) {
    showTemplatesMenu = false;
    paperEditorRef?.resetEditorState?.();
    projectWorkspace = null;
    activeProjectRelPath = null;
    documentTitle = tpl.defaultTitle;
    if (tpl.defaultAuthor) {
      documentAuthor = tpl.defaultAuthor;
    }
    visualContent = tpl.initialContent;
    documentContent = visualToLatex(tpl.initialContent, {
      title: tpl.defaultTitle,
      author: documentAuthor,
      fontStyle: selectedFont
    });
    syncSavedSnapshot();
    showNotification(`Plantilla cargada: ${tpl.name}`, 'success');
  }

  function toggleAutoSave() {
    autoSaveEnabled = !autoSaveEnabled;
    localStorage.setItem('layratex_autosave_enabled', String(autoSaveEnabled));
    showNotification(
      autoSaveEnabled ? 'Auto-guardado activado (guarda cada 1.5s)' : 'Auto-guardado desactivado (usa Ctrl+S)', 
      'info'
    );
  }

  async function performAutoSave() {
    if (!autoSaveEnabled || !isDirty || isAutoSaving) return;
    isAutoSaving = true;

    try {
      if (editorViewMode === 'visual') {
        const latestVisual = paperEditorRef?.flushActiveBlock?.() ?? visualContent;
        visualContent = latestVisual;
        documentContent = visualToLatex(latestVisual, {
          title: documentTitle,
          author: documentAuthor,
          fontStyle: selectedFont
        }, documentContent);
      }

      if (projectWorkspace && activeProjectRelPath) {
        projectWorkspace.tex_files_map[activeProjectRelPath] = documentContent;
      }

      try {
        localStorage.setItem('layratex_draft_title', documentTitle);
        localStorage.setItem('layratex_draft_author', documentAuthor);
        localStorage.setItem('layratex_draft_content', visualContent);
      } catch {}

      if (currentFilePath && fileService.isNative()) {
        if (projectWorkspace && activeProjectRelPath === null && editorViewMode === 'visual') {
          const updatedWs = await fileService.saveExistingProjectChanges(
            projectWorkspace,
            documentContent
          );
          if (updatedWs) {
            projectWorkspace = updatedWs;
          }
        } else {
          await fileService.saveTexFile(currentFilePath, documentContent);
        }
      }

      syncSavedSnapshot();
      lastSavedTime = new Date();
    } catch (err) {
      console.warn('Auto-save falló silenciosamente:', err);
    } finally {
      isAutoSaving = false;
    }
  }

  $effect(() => {
    const _c = visualContent;
    const _t = documentTitle;
    const _a = documentAuthor;
    const _d = documentContent;

    if (projectWorkspace && activeProjectRelPath) {
      projectWorkspace.tex_files_map[activeProjectRelPath] = _d;
    }

    if (autoSaveEnabled && isDirty && !isAutoSaving) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        performAutoSave();
      }, 1500);
    }

    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  });

  function switchViewMode(newMode: 'visual' | 'code') {
    if (newMode === editorViewMode) return;

    if (newMode === 'code') {
      const latestVisual = paperEditorRef?.flushActiveBlock?.() ?? visualContent;
      visualContent = latestVisual;
      if (projectWorkspace && activeProjectRelPath && activeProjectRelPath !== 'main.tex') {
        // Si estamos editando un subarchivo individual (ej. secciones/01-intro.tex), guardar solo su cuerpo
        const fullTex = visualToLatex(latestVisual, {
          title: documentTitle,
          author: documentAuthor,
          fontStyle: selectedFont
        });
        const bIdx = fullTex.indexOf('\\begin{document}');
        const eIdx = fullTex.lastIndexOf('\\end{document}');
        const bodyOnly =
          bIdx !== -1 && eIdx !== -1
            ? fullTex.slice(bIdx + '\\begin{document}'.length, eIdx).replace('\\maketitle', '').trim()
            : fullTex;
        documentContent = bodyOnly + '\n';
        projectWorkspace.tex_files_map[activeProjectRelPath] = documentContent;
      } else {
        documentContent = visualToLatex(latestVisual, {
          title: documentTitle,
          author: documentAuthor,
          fontStyle: selectedFont
        }, documentContent);
      }
    } else {
      paperEditorRef?.resetEditorState?.();
      const sourceForVisual = projectWorkspace
        ? resolveLatexInputsInMemory(documentContent, projectWorkspace.tex_files_map)
        : documentContent;
      visualContent = latexToVisual(sourceForVisual);
      const meta = extractLatexMetadata(sourceForVisual);
      if (meta.title) {
        documentTitle = meta.title;
      }
      if (meta.author) {
        documentAuthor = meta.author;
      }
    }

    editorViewMode = newMode;
  }

  async function handleOpen() {
    if (editorViewMode === 'visual') {
      paperEditorRef?.flushActiveBlock?.();
    }
    if (isDirty) {
      const confirmDiscard = window.confirm('Tienes cambios sin guardar en este documento. ¿Deseas descartarlos y abrir otro archivo?');
      if (!confirmDiscard) return;
    }

    try {
      const res = await fileService.openTexFile();
      if (!res || res.content === null) return;

      projectWorkspace = null;
      activeProjectRelPath = null;
      applyLoadedLatexContent(res.content, res.name);
      currentFilePath = res.path;
      currentFileName = res.name;
      recentFiles = fileService.getRecentFiles();
      showNotification(`Abierto: ${res.name}`, 'success');
    } catch (err: any) {
      showNotification(`Error al abrir: ${err?.message || err}`, 'error');
    }
  }

  async function handleSave() {
    if (editorViewMode === 'visual') {
      const latestVisual = paperEditorRef?.flushActiveBlock?.() ?? visualContent;
      visualContent = latestVisual;
      documentContent = visualToLatex(latestVisual, {
        title: documentTitle,
        author: documentAuthor,
        fontStyle: selectedFont
      }, documentContent);
    }

    try {
      if (projectWorkspace && activeProjectRelPath === null && editorViewMode === 'visual') {
        // Guardado quirúrgico: sincroniza main.tex y cada subarchivo \input{...} en su carpeta original
        const ws = await fileService.saveExistingProjectChanges(
          projectWorkspace,
          documentContent
        );
        if (ws) {
          projectWorkspace = ws;
          syncSavedSnapshot();
          lastSavedTime = new Date();
          recentFiles = fileService.getRecentFiles();
          try {
            localStorage.removeItem('layratex_draft_content');
          } catch {}
          showNotification(`Proyecto guardado quirúrgicamente (${ws.main_tex_name} + subarchivos + build/)`, 'success');
          return;
        }
      }

      const res = await fileService.saveTexFile(currentFilePath, documentContent, currentFileName);
      if (!res) return;

      currentFilePath = res.path;
      currentFileName = res.name;
      if (projectWorkspace && activeProjectRelPath) {
        projectWorkspace.tex_files_map[activeProjectRelPath] = documentContent;
        const refreshed = await fileService.refreshProjectWorkspace(projectWorkspace.root_dir);
        if (refreshed) projectWorkspace = refreshed;
      }
      syncSavedSnapshot();
      lastSavedTime = new Date();
      recentFiles = fileService.getRecentFiles();
      try {
        localStorage.removeItem('layratex_draft_content');
      } catch {}
      showNotification(`Guardado: ${res.name}`, 'success');
    } catch (err: any) {
      showNotification(`Error al guardar: ${err?.message || err}`, 'error');
    }
  }

  async function handleSaveAs() {
    if (editorViewMode === 'visual') {
      const latestVisual = paperEditorRef?.flushActiveBlock?.() ?? visualContent;
      visualContent = latestVisual;
      documentContent = visualToLatex(latestVisual, {
        title: documentTitle,
        author: documentAuthor,
        fontStyle: selectedFont
      }, documentContent);
    }

    try {
      const res = await fileService.saveTexFileAs(documentContent, currentFileName);
      if (!res) return;

      currentFilePath = res.path;
      currentFileName = res.name;
      syncSavedSnapshot();
      lastSavedTime = new Date();
      recentFiles = fileService.getRecentFiles();
      showNotification(`Guardado como: ${res.name}`, 'success');
    } catch (err: any) {
      showNotification(`Error al guardar como: ${err?.message || err}`, 'error');
    }
  }

  function handleNewDocument() {
    if (editorViewMode === 'visual') {
      paperEditorRef?.flushActiveBlock?.();
    }
    if (isDirty) {
      const confirmDiscard = window.confirm('Tienes cambios sin guardar. ¿Deseas crear un nuevo documento y descartar los cambios?');
      if (!confirmDiscard) return;
    }

    paperEditorRef?.resetEditorState?.();
    projectWorkspace = null;
    activeProjectRelPath = null;
    documentTitle = 'Título del Artículo Científico';
    visualContent = '';
    documentContent = visualToLatex('', {
      title: documentTitle,
      author: documentAuthor,
      fontStyle: selectedFont
    });
    syncSavedSnapshot();
    currentFilePath = null;
    currentFileName = 'articulo.tex';
    lastCompiledPdf = null;
    lastExportedPath = null;
    compilationIssues = [];
    showErrorPanel = false;
    compilationError = false;
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      pdfBlobUrl = null;
    }
    previewMode = 'katex';
    showNotification('Nuevo documento LaTeX listo para redactar', 'info');
  }

  async function handleOpenRecent(path: string, isProject?: boolean) {
    if (editorViewMode === 'visual') {
      paperEditorRef?.flushActiveBlock?.();
    }
    if (isDirty) {
      const confirmDiscard = window.confirm('Tienes cambios sin guardar. ¿Deseas descartarlos y abrir este elemento?');
      if (!confirmDiscard) return;
    }

    try {
      if (isProject) {
        const ws = await fileService.refreshProjectWorkspace(path);
        if (ws) {
          applyLoadedProjectWorkspace(ws);
          showNotification(`Proyecto abierto: ${ws.project_name}`, 'success');
          return;
        }
      }
      const content = await fileService.readFileFromPath(path);
      const name = fileService.getFileName(path);
      projectWorkspace = null;
      activeProjectRelPath = null;
      applyLoadedLatexContent(content, name);
      currentFilePath = path;
      currentFileName = name;
      recentFiles = fileService.getRecentFiles();
      showNotification(`Abierto: ${currentFileName}`, 'success');
    } catch (err: any) {
      showNotification(`No se pudo abrir el elemento reciente: ${err?.message || err}`, 'error');
    }
  }

  function handleClearRecents() {
    fileService.clearRecentFiles();
    recentFiles = [];
    showNotification('Historial de recientes limpiado', 'info');
  }

  // --- Exportación a Microsoft Word (.docx) con Estética LaTeX y Ecuaciones OMML ---

  async function handleExportWord() {
    if (isExportingWord) return;
    isExportingWord = true;
    showNotification('Generando documento Word (.docx) con estética LaTeX...', 'info');

    try {
      if (editorViewMode === 'code') {
        const resolved = projectWorkspace
          ? resolveLatexInputsInMemory(documentContent, projectWorkspace.tex_files_map)
          : documentContent;
        visualContent = latexToVisual(resolved);
        const meta = extractLatexMetadata(resolved);
        if (meta.title) documentTitle = meta.title;
        if (meta.author) documentAuthor = meta.author;
      } else {
        const latestVisual = paperEditorRef?.flushActiveBlock?.() ?? visualContent;
        visualContent = latestVisual;
      }

      const rawBaseName = (documentTitle || currentFileName.replace(/\.tex$/i, '') || 'documento');
      const suggestedName = rawBaseName.replace(/[/\\?%*:|"<>]/g, '_') + '.docx';

      const result = await wordExportService.exportToDocx(visualContent, suggestedName, {
        title: documentTitle,
        author: documentAuthor,
        fontStyle: selectedFont,
        isRawLatex: false
      });

      if (projectWorkspace?.root_dir) {
        const refreshed = await fileService.refreshProjectWorkspace(projectWorkspace.root_dir);
        if (refreshed) projectWorkspace = refreshed;
      }

      isExportingWord = false;
      lastCompiledPdf = {
        path: result.savedPath || result.tempPath || '',
        name: suggestedName,
        base64: result.docxBase64,
        engine: 'Motor OpenXML LaTeX → Word (.docx)',
        durationMs: result.durationMs,
        format: 'docx'
      };

      if (result.savedPath) {
        lastExportedPath = result.savedPath;
        showNotification(`Word (.docx) exportado con éxito (${result.durationMs} ms)`, 'success');
      } else {
        showNotification(`Documento Word (.docx) generado (${result.durationMs} ms)`, 'success');
      }
      showPdfSuccessModal = true;
    } catch (err: any) {
      isExportingWord = false;
      showNotification(`Error al exportar a Word: ${err?.message || err}`, 'error');
    }
  }

  // --- Motor Autónomo y Pipeline de Compilación/Exportación PDF ---

  async function handleAutonomousPdfExport() {
    if (isCompiling) return;
    isCompiling = true;
    compilationError = false;
    showNotification('Generando PDF LaTeX...', 'info');

    try {
      if (editorViewMode === 'code') {
        const resolved = projectWorkspace
          ? resolveLatexInputsInMemory(documentContent, projectWorkspace.tex_files_map)
          : documentContent;
        visualContent = latexToVisual(resolved);
        const meta = extractLatexMetadata(resolved);
        if (meta.title) documentTitle = meta.title;
        if (meta.author) documentAuthor = meta.author;
        await new Promise(resolve => setTimeout(resolve, 80));
      } else {
        const latestVisual = paperEditorRef?.flushActiveBlock?.() ?? visualContent;
        visualContent = latestVisual;
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      let pages = paperEditorRef?.getPrintPages?.() || [];
      if (!pages || pages.length === 0) {
        pages = Array.from(document.querySelectorAll<HTMLElement>('#layratex-pdf-render-target [data-paper-page]'));
      }
      if (!pages || pages.length === 0) {
        pages = Array.from(document.querySelectorAll<HTMLElement>('[data-paper-page]'));
      }

      if (!pages || pages.length === 0) {
        throw new Error('No se encontraron páginas maquetadas para exportar.');
      }

      const rawBaseName = (documentTitle || currentFileName.replace(/\.tex$/i, '') || 'documento');
      const suggestedName = rawBaseName.replace(/[/\\?%*:|"<>]/g, '_') + '.pdf';
      const result = await pdfExportService.exportFromDOM(pages, suggestedName);

      if (projectWorkspace?.root_dir) {
        const refreshed = await fileService.refreshProjectWorkspace(projectWorkspace.root_dir);
        if (refreshed) projectWorkspace = refreshed;
      }

      isCompiling = false;
      compilationEngine = 'Motor Tipográfico Autónomo Layratex';
      compilationTimeMs = result.durationMs;

      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      pdfBlobUrl = result.pdfBlobUrl;

      lastCompiledPdf = {
        path: result.savedPath || result.tempPath || '',
        name: suggestedName,
        base64: result.pdfBase64,
        engine: 'Motor Tipográfico Autónomo Layratex',
        durationMs: result.durationMs,
        format: 'pdf'
      };

      if (result.savedPath) {
        lastExportedPath = result.savedPath;
        showNotification(`PDF exportado con éxito (${result.durationMs} ms)`, 'success');
        showPdfSuccessModal = true;
      } else {
        showPdfSuccessModal = true;
        showNotification(`PDF generado con éxito (${result.durationMs} ms)`, 'success');
      }
      showErrorPanel = false;
      showErrorModal = false;
    } catch (err: any) {
      isCompiling = false;
      compilationError = true;
      showNotification(`Error al exportar PDF: ${err?.message || err}`, 'error');
    }
  }

  async function handleCompile() {
    if (isCompiling) return;

    if (editorViewMode === 'visual') {
      const latestVisual = paperEditorRef?.flushActiveBlock?.() ?? visualContent;
      visualContent = latestVisual;
      documentContent = visualToLatex(latestVisual, {
        title: documentTitle,
        author: documentAuthor,
        fontStyle: selectedFont
      }, documentContent);
    }

    isCompiling = true;
    compilationError = false;
    showNotification('Compilando documento LaTeX a PDF...', 'info');

    try {
      const compilers = await compilerService.getCompilers();
      if (compilers.length === 0) {
        isCompiling = false;
        await handleAutonomousPdfExport();
        return;
      }

      const targetProjectPath = projectWorkspace?.root_dir || currentFilePath;
      const sourceToCompile = projectWorkspace
        ? resolveLatexInputsInMemory(documentContent, projectWorkspace.tex_files_map)
        : documentContent;
      const output = await compilerService.compileLatex(sourceToCompile, targetProjectPath);
      isCompiling = false;

      if (projectWorkspace?.root_dir) {
        const refreshed = await fileService.refreshProjectWorkspace(projectWorkspace.root_dir);
        if (refreshed) projectWorkspace = refreshed;
      }

      compilationTimeMs = output.duration_ms;
      compilationEngine = output.engine;

      const combinedLog = [output.log || '', output.stderr || '', output.stdout || ''].filter(Boolean).join('\n');
      let parsedIssues = parseLatexLog(combinedLog);

      if (output.success && output.pdf_path) {
        compilationError = false;
        compilationIssues = parsedIssues;
        showErrorPanel = parsedIssues.some(i => i.type === 'error');

        if (output.pdf_base64) {
          if (pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
          }
          pdfBlobUrl = compilerService.createPdfBlobUrl(output.pdf_base64);
        }

        const rawBaseName = (documentTitle || currentFileName.replace(/\.tex$/i, '') || 'documento');
        const suggestedName = rawBaseName.replace(/[/\\?%*:|"<>]/g, '_') + '.pdf';
        lastCompiledPdf = {
          path: output.pdf_path,
          name: suggestedName,
          base64: output.pdf_base64,
          engine: output.engine,
          durationMs: output.duration_ms,
          format: 'pdf'
        };

        showNotification(`Compilado con éxito con ${output.engine} (${output.duration_ms} ms)`, 'success');
        await handleExportPdf(true);
      } else {
        console.warn('Compilador nativo finalizó con advertencias, activando Motor Autónomo de Layratex...');
        await handleAutonomousPdfExport();
      }
    } catch (err: any) {
      isCompiling = false;
      await handleAutonomousPdfExport();
    }
  }

  async function handleExportPdf(afterCompilation = false) {
    if (!lastCompiledPdf || lastCompiledPdf.format === 'docx') {
      await handleCompile();
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
        showPdfSuccessModal = true;
      }
    } catch (err: any) {
      showNotification(`Error al exportar PDF: ${err?.message || err}`, 'error');
    }
  }

  async function handleOpenInSystemViewer() {
    const targetPath = lastExportedPath || lastCompiledPdf?.path;
    if (!targetPath) {
      showNotification('No hay archivo disponible para abrir.', 'error');
      return;
    }

    try {
      await compilerService.openPath(targetPath);
      showNotification('Abriendo archivo en la aplicación predeterminada del sistema...', 'info');
    } catch (err: any) {
      showNotification(`No se pudo abrir el visor: ${err?.message || err}`, 'error');
    }
  }
</script>

<div class="h-screen w-screen flex flex-col bg-[#090d16] text-[#c9d1d9] select-none overflow-hidden font-sans">
  
  <!-- Barra Superior Editorial Insana con Logo y Anti-Desbordamiento -->
  <header class="h-12 bg-[#090d16]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 flex items-center justify-between text-xs select-none z-30 transition-colors shrink-0 overflow-x-auto no-scrollbar gap-2">
    <!-- 1. Izquierda: Branding + Espacio de Trabajo + Guardar + Plantillas -->
    <div class="flex items-center gap-2 min-w-0">
      <!-- Logo Layratex con clic para abrir/cerrar panel de archivos -->
      <button 
        class="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer group shrink-0"
        onclick={() => activeTab = activeTab === 'files' ? ('' as any) : 'files'}
        title="Layratex P2P • Clic para ver panel de archivos y proyectos"
      >
        <LayratexLogo size={24} showText={true} showBadge={false} />
      </button>

      <span class="text-white/10 hidden sm:inline shrink-0">|</span>

      <!-- Hub del Documento / Proyecto Activo (Píldora Inteligente) -->
      <button
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer min-w-0 max-w-[170px] sm:max-w-[210px] {activeTab === 'files' ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200'}"
        onclick={() => activeTab = activeTab === 'files' ? ('' as any) : 'files'}
        title="Clic para gestionar archivos y proyectos ({currentFileName})"
      >
        <span class="w-1.5 h-1.5 rounded-full {isDirty ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'} shrink-0"></span>
        <span class="truncate font-mono font-medium text-[11px]">{projectWorkspace ? projectWorkspace.project_name : currentFileName}</span>
        <FolderTree size={11} class="text-slate-400 shrink-0 ml-0.5" />
      </button>

      <!-- Botón Rápido Guardar (Ctrl+S) -->
      <button 
        class="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs font-medium shrink-0 {isDirty ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]' : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white'}"
        onclick={handleSave}
        title="Guardar cambios en disco (Ctrl+S)"
      >
        <Save size={12} class="shrink-0" />
        <span class="hidden md:inline">Guardar</span>
      </button>

      <!-- Menú Desplegable de Plantillas Académicas LaTeX -->
      <div class="relative shrink-0">
        <button 
          class="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all cursor-pointer text-xs"
          onclick={() => showTemplatesMenu = !showTemplatesMenu}
          title="Cargar plantilla académica de LaTeX"
        >
          <BookOpen size={12} class="text-indigo-400 shrink-0" />
          <span class="hidden lg:inline">Plantillas</span>
          <ChevronDown size={10} class="text-slate-400" />
        </button>

        {#if showTemplatesMenu}
          <div class="fixed inset-0 z-40" onclick={() => showTemplatesMenu = false} role="presentation"></div>
          <div class="absolute left-0 top-full mt-1.5 w-80 rounded-xl bg-[#0e1320] border border-white/10 shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl">
            <div class="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Plantillas Canónicas LaTeX
            </div>
            {#each TEMPLATE_PRESETS as tpl}
              <button
                type="button"
                class="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                onclick={() => applyTemplate(tpl)}
              >
                <div class="font-semibold text-white text-xs font-serif">{tpl.name}</div>
                <div class="text-[10px] text-slate-400 leading-snug mt-0.5">{tpl.description}</div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- 2. Centro: Selector de Modo (Hoja LaTeX vs Código .tex) + Herramientas de Edición -->
    <div class="flex items-center gap-2 shrink-0">
      <!-- Selector de Modo Segmentado Central -->
      <div class="flex items-center p-0.5 bg-[#0e1320] rounded-lg border border-white/10 text-xs shadow-inner">
        <button 
          class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md transition-all cursor-pointer {editorViewMode === 'visual' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'}"
          onclick={() => switchViewMode('visual')}
          title="Edición directa sobre hoja A4 con estética LaTeX"
        >
          <FileText size={12} />
          <span>Hoja LaTeX</span>
        </button>
        <button 
          class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md transition-all cursor-pointer {editorViewMode === 'code' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'}"
          onclick={() => switchViewMode('code')}
          title="Editar código fuente .tex con vista previa en vivo"
        >
          <Code2 size={12} />
          <span>Código .tex</span>
        </button>
      </div>

      <!-- Herramientas de Modo Hoja (Insertar Ecuación & Estilo de Hoja) -->
      {#if editorViewMode === 'visual'}
        <button 
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-medium transition-all cursor-pointer text-xs shadow-xs shrink-0"
          onclick={() => paperEditorRef?.openMathEditor()}
          title="Insertar ecuación matemática numerada (Ctrl+E)"
        >
          <Calculator size={12} />
          <span class="hidden sm:inline">+ Ecuación</span>
          <span class="sm:hidden">+ fx</span>
        </button>

        <!-- Popover de Estilo (Tono de Papel + Tipografía TeX) -->
        <div class="relative shrink-0">
          <button 
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer text-xs"
            onclick={() => showAppearanceMenu = !showAppearanceMenu}
            title="Personalizar tono de papel y tipografía TeX"
          >
            <Palette size={12} class="text-amber-400" />
            <span class="hidden sm:inline">Estilo</span>
            <ChevronDown size={10} class="text-slate-400" />
          </button>

          {#if showAppearanceMenu}
            <div class="fixed inset-0 z-40" onclick={() => showAppearanceMenu = false} role="presentation"></div>
            <div class="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-64 rounded-xl bg-[#0e1320] border border-white/10 shadow-2xl p-3 z-50 space-y-3 backdrop-blur-xl">
              <!-- Selector de Tono de Papel -->
              <div class="space-y-1.5">
                <div class="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                  Tono del Papel
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    class="flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer {paperTone === 'white' ? 'bg-white/10 border-indigo-500 text-white font-medium' : 'border-white/5 text-slate-300 hover:bg-white/5'}"
                    onclick={() => paperTone = 'white'}
                  >
                    <span class="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shrink-0"></span>
                    <span class="text-[11px]">Blanco LaTeX</span>
                  </button>
                  <button
                    type="button"
                    class="flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer {paperTone === 'cream' ? 'bg-white/10 border-amber-500 text-white font-medium' : 'border-white/5 text-slate-300 hover:bg-white/5'}"
                    onclick={() => paperTone = 'cream'}
                  >
                    <span class="w-3.5 h-3.5 rounded-full bg-[#fbf0d9] border border-amber-200 shrink-0"></span>
                    <span class="text-[11px]">Marfil Cálido</span>
                  </button>
                  <button
                    type="button"
                    class="flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer {paperTone === 'sepia' ? 'bg-white/10 border-amber-600 text-white font-medium' : 'border-white/5 text-slate-300 hover:bg-white/5'}"
                    onclick={() => paperTone = 'sepia'}
                  >
                    <span class="w-3.5 h-3.5 rounded-full bg-[#f4ecd8] border border-stone-300 shrink-0"></span>
                    <span class="text-[11px]">Sepia Clásico</span>
                  </button>
                  <button
                    type="button"
                    class="flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer {paperTone === 'dark' ? 'bg-white/10 border-indigo-500 text-white font-medium' : 'border-white/5 text-slate-300 hover:bg-white/5'}"
                    onclick={() => paperTone = 'dark'}
                  >
                    <span class="w-3.5 h-3.5 rounded-full bg-[#1e2330] border border-slate-600 shrink-0"></span>
                    <span class="text-[11px]">Modo Noche</span>
                  </button>
                </div>
              </div>

              <!-- Selector de Tipografía TeX -->
              <div class="space-y-1.5 pt-1 border-t border-white/10">
                <div class="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                  Tipografía Oficial TeX
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg border text-center transition-all cursor-pointer font-serif text-[11px] {selectedFont === 'serif' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold' : 'border-white/5 text-slate-300 hover:bg-white/5'}"
                    onclick={() => selectedFont = 'serif'}
                  >
                    CMU Roman
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded-lg border text-center transition-all cursor-pointer font-sans text-[11px] {selectedFont === 'sans' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold' : 'border-white/5 text-slate-300 hover:bg-white/5'}"
                    onclick={() => selectedFont = 'sans'}
                  >
                    CMU Sans
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Derecha: Selector de Modo (Hoja vs Código .tex), Exportar Word (.docx) y Exportar PDF -->
    <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <!-- Indicador Minimalista de Auto-Guardado -->
      <div class="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
        {#if isAutoSaving}
          <Loader2 size={11} class="animate-spin text-indigo-400" />
          <span class="text-indigo-400 text-[10px]">Guardando</span>
        {:else if isDirty}
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>
          <span class="text-amber-400 text-[10px]">Sin guardar</span>
        {:else}
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span class="text-slate-500 text-[10px]">Guardado</span>
        {/if}
      </div>

      <!-- Botón Exportar a Microsoft Word (.docx) -->
      <button 
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#185abd]/80 hover:bg-[#185abd] border border-blue-400/30 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-[0.98]"
        onclick={handleExportWord}
        disabled={isExportingWord}
        title="Exportar a Microsoft Word (.docx) con formato LaTeX (Ctrl+Shift+W)"
      >
        {#if isExportingWord}
          <Loader2 size={12} class="animate-spin" />
          <span>Word...</span>
        {:else}
          <Download size={12} />
          <span>Word</span>
        {/if}
      </button>

      <!-- Botón Primario Compilar / Exportar PDF -->
      <button 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 text-white text-xs font-semibold shadow-[0_0_12px_rgba(99,102,241,0.35)] hover:shadow-[0_0_16px_rgba(99,102,241,0.5)] transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-[0.98]"
        onclick={handleCompile}
        disabled={isCompiling}
        title="Compilar y exportar documento en PDF (Ctrl+Enter)"
      >
        {#if isCompiling}
          <Loader2 size={12} class="animate-spin" />
          <span>PDF...</span>
        {:else}
          <Download size={12} />
          <span>PDF</span>
        {/if}
      </button>

      <!-- Botón de Preferencias -->
      <button 
        class="w-7 h-7 rounded-lg border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
        onclick={() => showPreferencesModal = true}
        title="Preferencias de apariencia y compilación"
      >
        <SettingsIcon size={13} />
      </button>

      <!-- Botón de Ayuda y Atajos Rápidos -->
      <button 
        class="w-7 h-7 rounded-lg border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs font-bold shrink-0"
        onclick={() => showHelpModal = true}
        title="Atajos de teclado y ayuda rápida"
      >
        ?
      </button>
    </div>
  </header>

  <!-- Cuerpo Principal: Sidebar + Drawer + Split Editor/Preview -->
  <div class="flex-1 flex overflow-hidden">
    {#if editorViewMode === 'code'}
      <Sidebar bind:activeTab connectedPeersCount={2} />
    {/if}

    <WorkspaceDrawer
      {activeTab}
      {currentFileName}
      {currentFilePath}
      {isDirty}
      {recentFiles}
      {compilationEngine}
      {projectWorkspace}
      {activeProjectRelPath}
      onOpen={handleOpen}
      onOpenProjectFolder={handleOpenProjectFolder}
      onModularizeProject={handleModularizeProject}
      onSelectProjectFile={handleSelectProjectFile}
      onCleanBuildDir={handleCleanBuildDir}
      onNewDocument={handleNewDocument}
      onSave={handleSave}
      onExportWord={handleExportWord}
      onOpenRecent={handleOpenRecent}
      onClearRecents={handleClearRecents}
      onOpenPreferences={() => (showPreferencesModal = true)}
      onClose={() => (activeTab = '')}
    />

    <!-- Área de Trabajo: Modo Visual Hoja LaTeX -->
    <div 
      class="flex-1 h-full overflow-hidden"
      style={editorViewMode === 'visual' ? '' : 'position: fixed; left: -9999px; top: 0; width: 820px; pointer-events: none; opacity: 0;'}
      aria-hidden={editorViewMode !== 'visual'}
    >
      <PaperEditor 
        bind:this={paperEditorRef}
        bind:content={visualContent}
        bind:title={documentTitle}
        bind:author={documentAuthor}
        bind:fontStyle={selectedFont}
        bind:paperTone={paperTone}
        bind:showCropMarks={userPreferences.showCropMarks}
        onStatsChange={(newStats: { words: number; pages: number }) => visualStats = newStats}
      />
    </div>

    {#if editorViewMode === 'code'}
      <div class="flex-1 flex overflow-hidden relative">
        <div class="h-full overflow-hidden shrink-0" style="width: {splitRatio}%; min-width: 200px;">
          <LatexEditor 
            bind:this={editorRef}
            bind:content={documentContent}
            bind:scrollSyncEnabled
            onScroll={handleEditorScroll}
            onStatsChange={(newStats: { lines: number; words: number }) => stats = newStats}
          />
        </div>

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div 
          class="w-1.5 hover:w-2 bg-[#21262d] hover:bg-[#58a6ff] transition-all cursor-col-resize select-none relative z-20 flex items-center justify-center group shrink-0"
          onmousedown={startResize}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={splitRatio}
        >
          <div class="w-0.5 h-6 bg-[#484f58] group-hover:bg-white rounded-full"></div>
        </div>

        <div class="h-full overflow-hidden flex-1" style="min-width: 200px;">
          <LatexPreview 
            bind:this={previewRef}
            content={previewLatexContent}
            pdfBlobUrl={pdfBlobUrl}
            bind:previewMode
            bind:scrollSyncEnabled
            onScroll={handlePreviewScroll}
            onRenderTime={(ms: number) => renderTimeMs = ms}
            onExportPdf={() => handleExportPdf(false)}
            onExportWord={handleExportWord}
            onOpenNative={handleOpenInSystemViewer}
            onTriggerCompile={handleCompile}
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- Panel de Diagnóstico y Errores de Compilación -->
  <ErrorPanel 
    issues={compilationIssues}
    bind:isOpen={showErrorPanel}
    onSelectIssue={(line) => editorRef?.goToLine(line)}
    onClose={() => showErrorPanel = false}
  />

  <!-- Barra de Estado Inferior -->
  {#if editorViewMode === 'code'}
    <StatusBar 
      lines={stats.lines}
      words={stats.words}
      renderTimeMs={renderTimeMs}
      isCompiling={isCompiling}
      compilationTimeMs={compilationTimeMs}
      compilationEngine={compilationEngine}
      compilationError={compilationError}
      errorCount={errorCount}
      warningCount={warningCount}
      p2pStatus={currentFilePath ? `Local: ${currentFileName}` : 'Sin Guardar (Memoria)'}
      onToggleErrorPanel={() => showErrorPanel = !showErrorPanel}
    />
  {:else}
    <footer class="h-6 bg-[#090d16] border-t border-white/10 px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none shrink-0 overflow-hidden">
      <div class="flex items-center gap-3 min-w-0 overflow-hidden">
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
          <span class="truncate max-w-[200px] text-slate-200">{currentFilePath ? currentFileName : 'Borrador Local (.tex)'}</span>
        </div>
        <span class="text-white/15 shrink-0">•</span>
        <span class="text-slate-400 truncate hidden md:inline">\documentclass[12pt,a4paper]&#123;article&#125;</span>
        <span class="text-white/15 hidden lg:inline">•</span>
        <span class="text-indigo-400 hidden lg:inline font-medium">{selectedFont === 'serif' ? 'Computer Modern Roman' : 'CMU Sans Serif'}</span>
      </div>
      <div class="flex items-center gap-3 shrink-0 ml-2">
        <span class="text-slate-300">{visualStats.words} palabras</span>
        <span class="text-white/15">•</span>
        <span class="text-slate-300">{visualStats.pages} {visualStats.pages === 1 ? 'pág.' : 'págs.'}</span>
      </div>
    </footer>
  {/if}

  <!-- Modales de Éxito de Exportación (PDF / Word .docx) y Diagnóstico de Errores -->
  <ExportModals
    bind:showPdfSuccessModal
    {lastCompiledPdf}
    {lastExportedPath}
    bind:showErrorModal
    {errorModalTitle}
    {errorModalMessage}
    {errorModalDetails}
    onOpenInSystemViewer={handleOpenInSystemViewer}
    onExportWord={handleExportWord}
    onExportPdf={() => handleExportPdf(false)}
    onPrintVectorSystem={() => pdfExportService.printSystemDialog()}
    onViewPdfInApp={() => {
      previewMode = 'pdf';
    }}
  />

  <!-- Modal de Preferencias -->
  <PreferencesModal
    bind:show={showPreferencesModal}
    isLight={isLightTheme}
    onPreferencesChanged={(newPrefs) => {
      userPreferences = newPrefs;
      paperTone = newPrefs.paperTone;
      selectedFont = newPrefs.paperFont;
      scrollSyncEnabled = newPrefs.scrollSync;
      autoSaveEnabled = newPrefs.autoSave;
    }}
  />

  <!-- Modal de Atajos de Teclado y Ayuda Rápida -->
  <KeyboardHelpModal bind:isOpen={showHelpModal} />

</div>
