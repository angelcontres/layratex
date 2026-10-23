import { invoke, isTauri } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';

export interface CompilerInfo {
  name: string;
  path: string;
  version: string | null;
}

export interface CompilationOutput {
  success: boolean;
  engine: string;
  pdf_path: string | null;
  pdf_base64: string | null;
  stdout: string;
  stderr: string;
  log: string | null;
  duration_ms: number;
  error_message: string | null;
}

export const compilerService = {
  isNative(): boolean {
    return isTauri();
  },

  async getCompilers(): Promise<CompilerInfo[]> {
    if (this.isNative()) {
      return await invoke<CompilerInfo[]>('get_latex_compilers');
    }
    return [];
  },

  async compileLatex(content: string, projectPath?: string | null): Promise<CompilationOutput> {
    if (this.isNative()) {
      return await invoke<CompilationOutput>('compile_latex', {
        content,
        projectPath: projectPath || null,
      });
    }
    throw new Error('La compilación nativa de LaTeX requiere la aplicación de escritorio Tauri.');
  },

  async openPath(path: string): Promise<void> {
    if (this.isNative()) {
      await invoke('open_path', { path });
    } else {
      window.open(path, '_blank');
    }
  },

  async exportPdf(
    sourcePdfPath: string,
    suggestedName: string = 'documento.pdf',
    pdfBase64?: string | null
  ): Promise<string | null> {
    const finalSuggestedName = suggestedName.toLowerCase().endsWith('.pdf')
      ? suggestedName
      : `${suggestedName}.pdf`;

    if (this.isNative()) {
      const selected = await save({
        filters: [
          { name: 'Documento PDF (*.pdf)', extensions: ['pdf'] },
          { name: 'Todos los archivos (*.*)', extensions: ['*'] }
        ],
        defaultPath: finalSuggestedName
      });

      if (!selected) return null;

      const savedPath = await invoke<string>('export_pdf', {
        sourcePath: sourcePdfPath,
        targetPath: selected
      });

      return savedPath;
    } else if (pdfBase64) {
      this.downloadPdfFromBase64(pdfBase64, finalSuggestedName);
      return finalSuggestedName;
    }
    return null;
  },

  async savePdfBytes(pdfBase64: string, targetPath: string): Promise<string> {
    if (this.isNative()) {
      return await invoke<string>('save_pdf_bytes', {
        pdfBase64,
        targetPath
      });
    }
    this.downloadPdfFromBase64(pdfBase64, targetPath);
    return targetPath;
  },

  async createTempPdfFromBytes(pdfBase64: string, filename?: string): Promise<string | null> {
    if (this.isNative()) {
      return await invoke<string>('create_temp_pdf_from_bytes', {
        pdfBase64,
        filename: filename || null
      });
    }
    return null;
  },

  downloadPdfFromBase64(base64Data: string, filename: string): void {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  createPdfBlobUrl(base64Data: string): string {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }
};
