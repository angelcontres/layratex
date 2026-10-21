import { invoke, isTauri } from '@tauri-apps/api/core';

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
  }
};
