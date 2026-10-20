import { isTauri } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

export interface FileItem {
  name: string;
  path: string;
  lastOpened: number;
}

const RECENT_FILES_KEY = 'layratex_recent_files';

export const fileService = {
  isNative(): boolean {
    return isTauri();
  },

  getFileName(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1] || 'documento.tex';
  },

  async openTexFile(): Promise<{ path: string | null; content: string | null; name: string } | null> {
    if (this.isNative()) {
      try {
        const selected = await open({
          multiple: false,
          directory: false,
          filters: [
            { name: 'Documentos LaTeX (*.tex)', extensions: ['tex', 'latex'] },
            { name: 'Todos los archivos (*.*)', extensions: ['*'] }
          ]
        });

        if (!selected || typeof selected !== 'string') {
          return null;
        }

        const content = await readTextFile(selected);
        const name = this.getFileName(selected);
        this.addRecentFile(name, selected);

        return { path: selected, content, name };
      } catch (err) {
        console.error('Error al abrir archivo con Tauri:', err);
        throw err;
      }
    } else {
      // Fallback para navegador web (desarrollo estándar)
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.tex,.latex,.txt';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          const content = await file.text();
          resolve({
            path: null,
            content,
            name: file.name
          });
        };
        input.click();
      });
    }
  },

  async saveTexFile(
    currentPath: string | null,
    content: string
  ): Promise<{ path: string; name: string } | null> {
    if (this.isNative()) {
      let targetPath = currentPath;

      if (!targetPath) {
        const selected = await save({
          filters: [
            { name: 'Documento LaTeX (*.tex)', extensions: ['tex'] }
          ],
          defaultPath: 'documento.tex'
        });

        if (!selected) return null;
        targetPath = selected;
      }

      await writeTextFile(targetPath, content);
      const name = this.getFileName(targetPath);
      this.addRecentFile(name, targetPath);

      return { path: targetPath, name };
    } else {
      // Fallback web: descarga como archivo
      const blob = new Blob([content], { type: 'text/x-tex;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentPath ? this.getFileName(currentPath) : 'documento.tex';
      a.click();
      URL.revokeObjectURL(url);
      return { path: 'descargas/' + a.download, name: a.download };
    }
  },

  async saveTexFileAs(
    content: string,
    suggestedName: string = 'documento.tex'
  ): Promise<{ path: string; name: string } | null> {
    if (this.isNative()) {
      const selected = await save({
        filters: [
          { name: 'Documento LaTeX (*.tex)', extensions: ['tex'] }
        ],
        defaultPath: suggestedName
      });

      if (!selected) return null;

      await writeTextFile(selected, content);
      const name = this.getFileName(selected);
      this.addRecentFile(name, selected);

      return { path: selected, name };
    } else {
      return this.saveTexFile(null, content);
    }
  },

  async readFileFromPath(filePath: string): Promise<string> {
    if (this.isNative()) {
      const content = await readTextFile(filePath);
      this.addRecentFile(this.getFileName(filePath), filePath);
      return content;
    }
    throw new Error('Lectura por ruta directa sólo disponible en la versión de escritorio.');
  },

  // Gestión de Archivos Recientes
  getRecentFiles(): FileItem[] {
    try {
      const data = localStorage.getItem(RECENT_FILES_KEY);
      if (!data) return [];
      return JSON.parse(data) as FileItem[];
    } catch {
      return [];
    }
  },

  addRecentFile(name: string, path: string): void {
    try {
      const list = this.getRecentFiles().filter((f) => f.path !== path);
      list.unshift({ name, path, lastOpened: Date.now() });
      const trimmed = list.slice(0, 10);
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.warn('No se pudo guardar en recientes:', err);
    }
  },

  clearRecentFiles(): void {
    localStorage.removeItem(RECENT_FILES_KEY);
  }
};
