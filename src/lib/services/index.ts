/**
 * Capa de Servicios de Dominio e Infraestructura (`src/lib/services`)
 *
 * Centraliza el acceso al sistema de archivos local (.tex) y proyectos multi-carpeta,
 * compiladores LaTeX, motores autónomos de exportación PDF/Word (.docx OpenXML + OMML),
 * preferencias de usuario, sincronización de desplazamiento (ScrollSync) y diagnóstico de logs.
 */

export {
  fileService,
  type FileItem,
  type ProjectFileEntry,
  type LatexProjectWorkspace
} from './fileService';
export { compilerService, type CompilationOutput, type CompilerInfo } from './compilerService';
export { pdfExportService } from './pdfExportService';
export { wordExportService, type WordExportOptions, type WordExportResult } from './wordExportService';
export { preferencesService, type UserPreferences } from './preferencesService';
export { parseLatexLog, type LogIssue } from './latexLogParser';
export { ScrollSyncCoordinator, calculateScrollRatio, calculateTargetScrollTop } from './scrollSyncService';
