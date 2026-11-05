<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './lib/ui/Sidebar.svelte';
  import StatusBar from './lib/ui/StatusBar.svelte';
  import LatexEditor from './lib/editor/LatexEditor.svelte';
  import LatexPreview from './lib/preview/LatexPreview.svelte';
  import ErrorPanel from './lib/ui/ErrorPanel.svelte';
  import PaperEditor from './lib/visual/PaperEditor.svelte';
  import KeyboardHelpModal from './lib/visual/KeyboardHelpModal.svelte';
  import PreferencesModal from './lib/ui/PreferencesModal.svelte';
  import { preferencesService, type UserPreferences } from './lib/services/preferencesService';
  import { WELCOME_TITLE, WELCOME_CONTENT } from './lib/visual/welcomeDocument';
  import { TEMPLATE_PRESETS, type DocumentTemplate } from './lib/visual/templatePresets';
  import { visualToLatex, latexToVisual } from './lib/visual/latexConverter';
  import { fileService, type FileItem } from './lib/services/fileService';
  import { compilerService } from './lib/services/compilerService';
  import { pdfExportService } from './lib/services/pdfExportService';
  import { wordExportService } from './lib/services/wordExportService';
  import { parseLatexLog, type LogIssue } from './lib/services/latexLogParser';
  import { ScrollSyncCoordinator } from './lib/services/scrollSyncService';
  import { 
    FileCode, 
    QrCode, 
    Download, 
    Plus, 
    FolderOpen, 
    Clock, 
    Trash2, 
    Laptop,
    Check,
    AlertCircle,
    Loader2,
    ExternalLink,
    X,
    FileCheck,
    Copy,
    Eye,
    ChevronDown,
    FileText,
    Code2,
    Calculator,
    Printer,
    Moon,
    Sun,
    Scroll,
    BookOpen,
    Settings as SettingsIcon
  } from '@lucide/svelte';

  let editorViewMode = $state<'visual' | 'code'>('visual');
  let selectedFont = $state<'serif' | 'sans'>('serif');
  let showPreferencesModal = $state(false);
  let showTemplatesMenu = $state(false);
  let userPreferences = $state<UserPreferences>(preferencesService.getPreferences());
  let isLightTheme = $derived(preferencesService.resolveTheme(userPreferences.theme) === 'light');
  // Por defecto iniciamos con 'white' (Hoja Blanca LaTeX Clásica) para lucir idéntico a un artículo LaTeX real
  let paperTone = $state<'dark' | 'cream' | 'sepia' | 'white'>('white');
  let paperEditorRef = $state<{ openMathEditor: (tex?: string) => void; getPrintPages?: () => HTMLElement[]; openFind?: () => void; openReplacePanel?: () => void } | null>(null);
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

  // Estado del Documento
  let currentFilePath = $state<string | null>(null);
  let currentFileName = $state<string>('articulo.tex');

  const initialLatex = visualToLatex(WELCOME_CONTENT, {
    title: WELCOME_TITLE,
    author: 'Equipo Editorial Layratex',
    fontStyle: 'serif'
  });
  let documentContent = $state(initialLatex);
  let savedContent = $state(initialLatex);
  let isDirty = $derived(documentContent !== savedContent);

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
  let copiedError = $state(false);

  onMount(() => {
    recentFiles = fileService.getRecentFiles();

    const savedAutoPref = localStorage.getItem('layratex_autosave_enabled');
    if (savedAutoPref !== null) {
      autoSaveEnabled = savedAutoPref === 'true';
    }

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

  // --- Operaciones de Archivo, Plantillas y Auto-Guardado ---

  function applyTemplate(tpl: DocumentTemplate) {
    showTemplatesMenu = false;
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
    savedContent = documentContent;
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
        documentContent = visualToLatex(visualContent, {
          title: documentTitle,
          author: documentAuthor,
          fontStyle: selectedFont
        });
      }

      try {
        localStorage.setItem('layratex_draft_title', documentTitle);
        localStorage.setItem('layratex_draft_content', visualContent);
      } catch {}

      if (currentFilePath) {
        await fileService.saveTexFile(currentFilePath, documentContent);
      }

      savedContent = documentContent;
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
      documentContent = visualToLatex(visualContent, {
        title: documentTitle,
        author: documentAuthor,
        fontStyle: selectedFont
      }, documentContent);
    } else {
      visualContent = latexToVisual(documentContent);
      const titleMatch = documentContent.match(/\\title\{([^}]+)\}/);
      if (titleMatch) {
        documentTitle = titleMatch[1];
      }
      const authorMatch = documentContent.match(/\\author\{([^}]+)\}/);
      if (authorMatch) {
        documentAuthor = authorMatch[1];
      }
    }

    editorViewMode = newMode;
  }

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
      visualContent = latexToVisual(res.content);
      const titleMatch = res.content.match(/\\title\{([^}]+)\}/);
      if (titleMatch) {
        documentTitle = titleMatch[1];
      }
      const authorMatch = res.content.match(/\\author\{([^}]+)\}/);
      if (authorMatch) {
        documentAuthor = authorMatch[1];
      }
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
      documentContent = visualToLatex(visualContent, {
        title: documentTitle,
        author: documentAuthor,
        fontStyle: selectedFont
      });
    }

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
    if (editorViewMode === 'visual') {
      documentContent = visualToLatex(visualContent, {
        title: documentTitle,
        author: documentAuthor,
        fontStyle: selectedFont
      });
    }

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

    documentTitle = 'Título del Artículo Científico';
    visualContent = '';
    documentContent = visualToLatex('', {
      title: documentTitle,
      author: documentAuthor,
      fontStyle: selectedFont
    });
    savedContent = documentContent;
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

  async function handleOpenRecent(path: string) {
    if (isDirty) {
      const confirmDiscard = window.confirm('Tienes cambios sin guardar. ¿Deseas descartarlos y abrir este archivo?');
      if (!confirmDiscard) return;
    }

    try {
      const content = await fileService.readFileFromPath(path);
      documentContent = content;
      savedContent = content;
      visualContent = latexToVisual(content);
      const titleMatch = content.match(/\\title\{([^}]+)\}/);
      if (titleMatch) {
        documentTitle = titleMatch[1];
      }
      const authorMatch = content.match(/\\author\{([^}]+)\}/);
      if (authorMatch) {
        documentAuthor = authorMatch[1];
      }
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

  // --- Exportación a Microsoft Word (.docx) con Estética LaTeX y Ecuaciones OMML ---

  async function handleExportWord() {
    if (isExportingWord) return;
    isExportingWord = true;
    showNotification('Generando documento Word (.docx) con estética LaTeX...', 'info');

    try {
      if (editorViewMode === 'code') {
        visualContent = latexToVisual(documentContent);
        const titleMatch = documentContent.match(/\\title\{([^}]+)\}/);
        if (titleMatch) documentTitle = titleMatch[1];
        const authorMatch = documentContent.match(/\\author\{([^}]+)\}/);
        if (authorMatch) documentAuthor = authorMatch[1];
      }

      const rawBaseName = (documentTitle || currentFileName.replace(/\.tex$/i, '') || 'documento');
      const suggestedName = rawBaseName.replace(/[/\\?%*:|"<>]/g, '_') + '.docx';

      const result = await wordExportService.exportToDocx(visualContent, suggestedName, {
        title: documentTitle,
        author: documentAuthor,
        fontStyle: selectedFont,
        isRawLatex: false
      });

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
        visualContent = latexToVisual(documentContent);
        await new Promise(resolve => setTimeout(resolve, 80));
      } else {
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
      documentContent = visualToLatex(visualContent, {
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

      const output = await compilerService.compileLatex(documentContent, currentFilePath);
      isCompiling = false;

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

  function copyErrorDetails() {
    if (errorModalDetails) {
      navigator.clipboard.writeText(errorModalDetails);
      copiedError = true;
      setTimeout(() => copiedError = false, 2500);
    }
  }
</script>

<div class="h-screen w-screen flex flex-col bg-[#0d1117] text-[#c9d1d9] select-none overflow-hidden font-sans">
  
  <!-- Barra Superior Editorial -->
  <header class="h-12 bg-[#12141a] border-b border-white/10 px-4 flex items-center justify-between text-xs select-none z-30 transition-colors shrink-0">
    <!-- Izquierda: Documentos, Abrir, Nuevo, Plantillas y Auto-Guardado -->
    <div class="flex items-center gap-2.5 min-w-0">
      <button 
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs font-semibold"
        onclick={() => activeTab = activeTab === 'files' ? ('' as any) : 'files'}
        title="Ver documentos recientes y archivos"
      >
        <span class="font-serif font-bold text-indigo-400 text-sm">LaTeX</span>
        <span class="hidden sm:inline">Archivos</span>
      </button>

      <span class="text-white/10">|</span>

      <button 
        class="flex items-center gap-1 px-2 py-1 rounded-xs bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-medium"
        onclick={handleNewDocument}
        title="Crear nuevo documento en blanco (Ctrl+N)"
      >
        <Plus size={13} />
        <span class="hidden md:inline">Nuevo</span>
      </button>

      <button 
        class="flex items-center gap-1 px-2 py-1 rounded-xs bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-medium"
        onclick={handleOpen}
        title="Abrir documento .tex (Ctrl+O)"
      >
        <FolderOpen size={13} />
        <span class="hidden lg:inline">Abrir</span>
      </button>

      <!-- Menú Desplegable de Plantillas Académicas LaTeX -->
      <div class="relative">
        <button 
          class="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 transition-colors cursor-pointer text-xs font-medium"
          onclick={() => showTemplatesMenu = !showTemplatesMenu}
          title="Cargar plantilla académica de LaTeX"
        >
          <BookOpen size={12} />
          <span class="hidden md:inline">Plantillas</span>
          <ChevronDown size={11} />
        </button>

        {#if showTemplatesMenu}
          <div class="fixed inset-0 z-40" onclick={() => showTemplatesMenu = false} role="presentation"></div>
          <div class="absolute left-0 top-full mt-1.5 w-80 rounded-md bg-[#161b22] border border-[#30363d] shadow-2xl p-1.5 z-50 space-y-1">
            <div class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Plantillas Canónicas LaTeX
            </div>
            {#each TEMPLATE_PRESETS as tpl}
              <button
                type="button"
                class="w-full text-left px-2.5 py-2 rounded-xs hover:bg-white/5 transition-colors cursor-pointer"
                onclick={() => applyTemplate(tpl)}
              >
                <div class="font-semibold text-white text-xs font-serif">{tpl.name}</div>
                <div class="text-[10.5px] text-slate-400 leading-snug mt-0.5">{tpl.description}</div>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <span class="text-white/10 hidden sm:inline">|</span>

      <!-- Interruptor de Auto-Guardado -->
      <button
        class="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xs text-xs transition-colors cursor-pointer {autoSaveEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'}"
        onclick={toggleAutoSave}
        title="Clic para {autoSaveEnabled ? 'desactivar' : 'activar'} el guardado automático"
      >
        <span class="w-1.5 h-1.5 rounded-full {autoSaveEnabled ? 'bg-emerald-400' : 'bg-slate-500'}"></span>
        <span class="font-medium text-[11px] hidden lg:inline">Auto</span>
        <span class="text-[10px] font-bold opacity-80">{autoSaveEnabled ? 'ON' : 'OFF'}</span>
      </button>

      {#if isAutoSaving}
        <span class="text-[11px] text-indigo-400 hidden xl:flex items-center gap-1 font-mono">
          <Loader2 size={11} class="animate-spin" />
          <span>Guardando...</span>
        </span>
      {:else if isDirty}
        <span class="text-[11px] text-amber-400 hidden xl:flex items-center gap-1 font-mono" title="Cambios sin guardar">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>Sin guardar</span>
        </span>
      {:else}
        <span class="text-[11px] text-slate-500 hidden xl:flex items-center gap-1 font-mono" title="Documento guardado">
          <Check size={11} class="text-emerald-500" />
          <span>Guardado</span>
        </span>
      {/if}
    </div>

    <!-- Centro: Herramientas de Estética LaTeX (En modo Hoja) -->
    {#if editorViewMode === 'visual'}
      <div class="hidden md:flex items-center gap-2">
        <button 
          class="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 font-medium transition-colors cursor-pointer text-xs"
          onclick={() => paperEditorRef?.openMathEditor()}
          title="Insertar ecuación matemática numerada (Ctrl+E)"
        >
          <Calculator size={12} />
          <span>+ Ecuación fx</span>
        </button>

        <!-- Selector de Tono de Papel (Incluye Blanco LaTeX Original) -->
        <div class="flex items-center p-0.5 rounded-xs border border-white/10 bg-white/5 text-xs">
          <button 
            type="button"
            class="px-2 py-1 rounded-xs transition-all cursor-pointer flex items-center gap-1 {paperTone === 'white' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-300 opacity-70 hover:opacity-100'}"
            onclick={() => paperTone = 'white'}
            title="Papel Blanco LaTeX Original (Contraste editorial de imprenta)"
          >
            <FileText size={12} />
            <span class="text-[10.5px] hidden xl:inline">Papel LaTeX</span>
          </button>
          <button 
            type="button"
            class="px-2 py-1 rounded-xs transition-all cursor-pointer flex items-center justify-center {paperTone === 'cream' ? 'bg-[#9c783e] text-white font-bold shadow-xs' : 'opacity-60 hover:opacity-100'}"
            onclick={() => paperTone = 'cream'}
            title="Tono Marfil Cálido (Papel de libro académico)"
          >
            <Sun size={13} />
          </button>
          <button 
            type="button"
            class="px-2 py-1 rounded-xs transition-all cursor-pointer flex items-center justify-center {paperTone === 'sepia' ? 'bg-[#7c5b35] text-white font-bold shadow-xs' : 'opacity-60 hover:opacity-100'}"
            onclick={() => paperTone = 'sepia'}
            title="Tono Sepia Clásico"
          >
            <Scroll size={13} />
          </button>
          <button 
            type="button"
            class="px-2 py-1 rounded-xs transition-all cursor-pointer flex items-center justify-center {paperTone === 'dark' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'opacity-60 hover:opacity-100'}"
            onclick={() => paperTone = 'dark'}
            title="Tono Noche / Grafito (Descanso visual nocturno)"
          >
            <Moon size={13} />
          </button>
        </div>

        <!-- Selector de Familia Tipográfica TeX -->
        <button 
          class="px-2.5 py-1 rounded-xs border border-white/10 hover:bg-white/5 text-slate-200 transition-colors cursor-pointer text-xs font-serif"
          onclick={() => selectedFont = selectedFont === 'serif' ? 'sans' : 'serif'}
          title="Tipografía TeX activa: {selectedFont === 'serif' ? 'Computer Modern Roman (Estándar LaTeX)' : 'CMU Sans Serif'}"
        >
          {selectedFont === 'serif' ? 'CMU Roman (TeX)' : 'CMU Sans'}
        </button>
      </div>
    {/if}

    <!-- Derecha: Selector de Modo (Hoja vs Código .tex), Exportar Word (.docx) y Exportar PDF -->
    <div class="flex items-center gap-2 shrink-0">
      {#if statusMessage}
        <span class="text-[11px] text-indigo-300 font-mono hidden lg:inline max-w-[220px] truncate">{statusMessage}</span>
      {/if}

      <!-- Selector de Modo (Hoja Visual vs Código Fuente LaTeX) -->
      <div class="flex items-center p-0.5 bg-white/5 rounded-xs border border-white/10 text-xs">
        <button 
          class="flex items-center gap-1 px-2.5 py-1 rounded-xs transition-all cursor-pointer {editorViewMode === 'visual' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-400 hover:text-white'}"
          onclick={() => switchViewMode('visual')}
          title="Edición directa sobre hoja A4 con tipografía Computer Modern"
        >
          <FileText size={12} />
          <span>Hoja LaTeX</span>
        </button>
        <button 
          class="flex items-center gap-1 px-2.5 py-1 rounded-xs transition-all cursor-pointer {editorViewMode === 'code' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-400 hover:text-white'}"
          onclick={() => switchViewMode('code')}
          title="Editar código fuente .tex con vista previa en vivo"
        >
          <Code2 size={12} />
          <span>Código .tex</span>
        </button>
      </div>

      <!-- Botón Exportar a Microsoft Word (.docx) -->
      <button 
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-[#185abd] hover:bg-[#1f6feb] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
        onclick={handleExportWord}
        disabled={isExportingWord}
        title="Exportar a Microsoft Word (.docx) con ecuaciones nativas y formato LaTeX (Ctrl+Shift+W)"
      >
        {#if isExportingWord}
          <Loader2 size={12} class="animate-spin" />
          <span>Word...</span>
        {:else}
          <Download size={12} />
          <span>Exportar Word</span>
        {/if}
      </button>

      <!-- Botón Exportar PDF -->
      <button 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
        onclick={handleCompile}
        disabled={isCompiling}
        title="Compilar y exportar documento en PDF (Ctrl+Enter)"
      >
        {#if isCompiling}
          <Loader2 size={12} class="animate-spin" />
          <span>PDF...</span>
        {:else}
          <Download size={12} />
          <span>Exportar PDF</span>
        {/if}
      </button>

      <!-- Botón de Preferencias -->
      <button 
        class="w-7 h-7 rounded-xs border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        onclick={() => showPreferencesModal = true}
        title="Preferencias de apariencia y compilación"
      >
        <SettingsIcon size={13} />
      </button>

      <!-- Botón de Ayuda y Atajos Rápidos -->
      <button 
        class="w-7 h-7 rounded-xs border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
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

    {#if activeTab === 'files'}
      <div class="w-64 bg-[#0d1117] border-r border-[#21262d] flex flex-col text-xs shrink-0">
        <div class="p-3 border-b border-[#21262d] flex items-center justify-between font-semibold text-[#8b949e] tracking-wider uppercase text-[10px]">
          <span>Documento Activo</span>
          <div class="flex items-center gap-1.5">
            <button class="hover:text-white cursor-pointer" onclick={handleOpen} title="Abrir archivo .tex (Ctrl+O)">
              <FolderOpen size={13} />
            </button>
            <button class="hover:text-white cursor-pointer" onclick={handleNewDocument} title="Crear nuevo archivo (Ctrl+N)">
              <Plus size={14} />
            </button>
          </div>
        </div>
        
        <div class="p-2 space-y-1.5 border-b border-[#21262d]">
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
          <div class="grid grid-cols-2 gap-1.5 pt-1">
            <button
              class="px-2 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-white text-[11px] font-medium cursor-pointer"
              onclick={handleSave}
            >
              Guardar .tex
            </button>
            <button
              class="px-2 py-1.5 rounded bg-[#185abd] hover:bg-[#1f6feb] text-white text-[11px] font-medium cursor-pointer"
              onclick={handleExportWord}
            >
              Exportar .docx
            </button>
          </div>
        </div>

        <!-- Archivos Recientes -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="p-3 pb-1 flex items-center justify-between font-semibold text-[#8b949e] tracking-wider uppercase text-[10px]">
            <div class="flex items-center gap-1.5">
              <Clock size={12} />
              <span>Archivos Recientes</span>
            </div>
            {#if recentFiles.length > 0}
              <button 
                class="hover:text-[#f85149] transition-colors cursor-pointer" 
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
                  class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] transition-colors font-mono text-left group cursor-pointer"
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
      <div class="w-64 bg-[#0d1117] border-r border-[#21262d] flex flex-col text-xs shrink-0">
        <div class="p-3 border-b border-[#21262d] flex items-center justify-between font-semibold text-[#8b949e] tracking-wider uppercase text-[10px]">
          <span>Red P2P & Dispositivos</span>
          <span class="w-2 h-2 rounded-full bg-[#3fb950]"></span>
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
                    <div class="text-[10px] text-[#3fb950] flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse"></span><span>En línea (P2P Directo)</span></div>
                  </div>
                </div>
                <span class="text-[10px] text-[#8b949e] font-mono">12 ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'settings'}
      <div class="w-60 bg-[#0d1117] border-r border-[#21262d] p-4 text-xs shrink-0 space-y-3">
        <h3 class="font-bold text-white">Ajustes del Editor</h3>
        <p class="text-[#8b949e] text-[11px] leading-relaxed">
          Motor LaTeX: <span class="text-[#58a6ff] font-semibold">{compilationEngine || 'Detección Automática (Tectonic/pdflatex)'}</span>
        </p>
        <p class="text-[#8b949e] text-[11px] leading-relaxed">
          Exportación Word: <span class="text-[#3fb950] font-semibold">OpenXML + Office Math (OMML)</span>
        </p>
        <button
          class="w-full py-1.5 px-3 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer"
          onclick={() => showPreferencesModal = true}
        >
          Abrir Preferencias Completas
        </button>
      </div>
    {/if}

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
        <div class="h-full overflow-hidden" style="width: {splitRatio}%">
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
          class="w-1.5 hover:w-2 bg-[#21262d] hover:bg-[#58a6ff] transition-all cursor-col-resize select-none relative z-20 flex items-center justify-center group"
          onmousedown={startResize}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={splitRatio}
        >
          <div class="w-0.5 h-6 bg-[#484f58] group-hover:bg-white rounded-full"></div>
        </div>

        <div class="h-full overflow-hidden flex-1" style="width: {100 - splitRatio}%">
          <LatexPreview 
            bind:this={previewRef}
            content={documentContent}
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
    <footer class="h-6 bg-[#0f1219] border-t border-white/5 px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none shrink-0">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>{currentFilePath ? currentFileName : 'Borrador Local (.tex)'}</span>
        </div>
        <span class="opacity-30">•</span>
        <span class="text-slate-400">\documentclass[12pt,a4paper]&#123;article&#125;</span>
        <span class="opacity-30 hidden sm:inline">•</span>
        <span class="text-indigo-400 hidden sm:inline">{selectedFont === 'serif' ? 'Computer Modern Roman' : 'CMU Sans Serif'}</span>
      </div>
      <div class="flex items-center gap-4">
        <span>{visualStats.words} palabras</span>
        <span>•</span>
        <span>{visualStats.pages} {visualStats.pages === 1 ? 'página A4' : 'páginas A4'}</span>
      </div>
    </footer>
  {/if}

  <!-- Modal de Éxito de Exportación (PDF o Microsoft Word .docx) -->
  {#if showPdfSuccessModal && lastCompiledPdf}
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl max-w-md w-full p-6 text-xs text-[#c9d1d9] space-y-4">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-[#238636]/20 text-[#3fb950] flex items-center justify-center shrink-0">
              <FileCheck size={18} />
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">
                {lastCompiledPdf.format === 'docx' ? 'Documento Word (.docx) Listo' : 'Compilación PDF Completada'}
              </h3>
              <p class="text-[11px] text-[#8b949e]">Generado con {lastCompiledPdf.engine} en {lastCompiledPdf.durationMs} ms</p>
            </div>
          </div>
          <button 
            class="text-[#8b949e] hover:text-white transition-colors cursor-pointer"
            onclick={() => showPdfSuccessModal = false}
          >
            <X size={16} />
          </button>
        </div>

        <div class="p-3 rounded-xs bg-[#0d1117] border border-[#21262d] space-y-1.5 font-mono text-[11px]">
          <div class="flex justify-between">
            <span class="text-[#8b949e]">Archivo:</span>
            <span class="text-white font-medium">{lastCompiledPdf.name}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#8b949e]">Formato:</span>
            <span class="text-[#58a6ff]">
              {lastCompiledPdf.format === 'docx' ? 'Microsoft Word OpenXML (.docx) + OMML' : 'Adobe PDF Editorial A4 (.pdf)'}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#8b949e]">Tiempo de generación:</span>
            <span class="text-[#3fb950]">{lastCompiledPdf.durationMs} ms</span>
          </div>
          {#if lastExportedPath}
            <div class="pt-1 border-t border-[#21262d] flex flex-col gap-0.5">
              <span class="text-[#8b949e] text-[10px]">Ubicación guardada:</span>
              <span class="text-white text-[10px] break-all">{lastExportedPath}</span>
            </div>
          {/if}
        </div>

        <div class="space-y-2 pt-1">
          {#if lastCompiledPdf.path}
            <button
              class="w-full py-2.5 px-4 rounded-xs bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              onclick={handleOpenInSystemViewer}
            >
              <ExternalLink size={14} />
              <span>{lastCompiledPdf.format === 'docx' ? 'Abrir en Microsoft Word / LibreOffice' : 'Abrir en Visor PDF del Sistema'}</span>
            </button>
          {/if}

          {#if lastCompiledPdf.format === 'docx'}
            <button
              class="w-full py-2 px-4 rounded-xs bg-[#21262d] hover:bg-[#30363d] text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              onclick={handleExportWord}
            >
              <Download size={14} />
              <span>Guardar copia .docx en otra carpeta...</span>
            </button>
          {:else}
            <button
              class="w-full py-2 px-4 rounded-xs bg-[#21262d] hover:bg-[#30363d] text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              onclick={() => handleExportPdf(false)}
            >
              <Download size={14} />
              <span>{lastExportedPath ? 'Exportar PDF a otra carpeta...' : 'Guardar / Exportar PDF...'}</span>
            </button>

            <button
              class="w-full py-2 px-4 rounded-xs bg-[#185abd] hover:bg-[#1f6feb] text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              onclick={() => { showPdfSuccessModal = false; handleExportWord(); }}
            >
              <Download size={14} />
              <span>Exportar también en Microsoft Word (.docx)</span>
            </button>

            <button
              class="w-full py-2 px-4 rounded-xs bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
              onclick={() => pdfExportService.printSystemDialog()}
              title="Imprimir o guardar como PDF vectorial usando el diálogo nativo del sistema"
            >
              <Printer size={14} />
              <span>Imprimir / Guardar Vectorial del Sistema</span>
            </button>

            <button
              class="w-full py-1.5 px-4 rounded-xs hover:bg-[#21262d] text-[#8b949e] hover:text-white font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              onclick={() => {
                previewMode = 'pdf';
                showPdfSuccessModal = false;
              }}
            >
              <Eye size={13} />
              <span>Ver PDF en Layratex</span>
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Modal de Errores -->
  {#if showErrorModal}
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-[#161b22] border border-[#da3633]/40 rounded-md shadow-2xl max-w-lg w-full p-6 text-xs text-[#c9d1d9] space-y-4">
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
            class="text-[#8b949e] hover:text-white transition-colors cursor-pointer"
            onclick={() => showErrorModal = false}
          >
            <X size={16} />
          </button>
        </div>

        {#if errorModalDetails}
          <div class="relative">
            <div class="p-3 rounded-xs bg-[#0d1117] border border-[#30363d] font-mono text-[10.5px] max-h-56 overflow-y-auto whitespace-pre-wrap text-[#e6edf3] leading-relaxed">
              {errorModalDetails}
            </div>
            <button
              class="absolute top-2 right-2 p-1.5 rounded-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
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
            class="px-4 py-2 rounded-xs bg-[#21262d] hover:bg-[#30363d] text-white font-medium transition-colors cursor-pointer"
            onclick={() => showErrorModal = false}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  {/if}

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
