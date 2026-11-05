import { invoke, isTauri } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import {
  resolveLatexInputsInMemory,
  splitLatexIntoModularProject,
  syncAssembledLatexToExistingProject,
  type ModularSubfileItem
} from '../visual/latexConverter';

export interface FileItem {
  name: string;
  path: string;
  lastOpened: number;
  isProject?: boolean;
}

export interface ProjectFileEntry {
  relative_path: string;
  full_path: string;
  name: string;
  category: 'tex' | 'bib' | 'style' | 'figure' | 'build' | 'other' | string;
  is_main: boolean;
}

export interface LatexProjectWorkspace {
  root_dir: string;
  project_name: string;
  main_tex_path: string;
  main_tex_name: string;
  raw_main_content: string;
  resolved_main_content: string;
  files: ProjectFileEntry[];
  tex_files_map: Record<string, string>;
  build_dir: string;
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

  async readNativeFile(filePath: string): Promise<string> {
    try {
      return await invoke<string>('read_tex_file', { path: filePath });
    } catch {
      return await readTextFile(filePath);
    }
  },

  async writeNativeFile(filePath: string, content: string): Promise<string> {
    try {
      return await invoke<string>('save_tex_file', {
        targetPath: filePath,
        content
      });
    } catch {
      await writeTextFile(filePath, content);
      return filePath;
    }
  },

  /**
   * Abre una carpeta completa de proyecto LaTeX (`main.tex` + subcarpetas `secciones/`, `figuras/`, `.bib`, `.cls` + `build/`).
   */
  async openProjectFolder(): Promise<LatexProjectWorkspace | null> {
    if (this.isNative()) {
      const selected = await open({
        multiple: false,
        directory: true,
        title: 'Seleccionar Carpeta del Proyecto LaTeX'
      });

      const rootDir = Array.isArray(selected) ? selected[0] : selected;
      if (!rootDir || typeof rootDir !== 'string') {
        return null;
      }

      const ws = await invoke<LatexProjectWorkspace>('open_latex_project', {
        rootDir
      });
      this.addRecentFile(ws.project_name, ws.root_dir, true);
      return ws;
    } else {
      // Fallback Web: input[webkitdirectory]
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        (input as any).webkitdirectory = true;
        input.multiple = true;
        input.onchange = async () => {
          const fileList = Array.from(input.files || []);
          if (fileList.length === 0) {
            resolve(null);
            return;
          }

          const firstRel = (fileList[0] as any).webkitRelativePath || fileList[0].name;
          const rootName = firstRel.split('/')[0] || 'proyecto-latex';
          const texMap: Record<string, string> = {};
          const entries: ProjectFileEntry[] = [];

          for (const f of fileList) {
            const rawRel: string = (f as any).webkitRelativePath || f.name;
            const rel = rawRel.includes('/') ? rawRel.split('/').slice(1).join('/') : rawRel;
            const ext = (rel.split('.').pop() || '').toLowerCase();

            let category: ProjectFileEntry['category'] = 'other';
            if (rel.toLowerCase().startsWith('build/') || ['aux', 'log', 'toc', 'out', 'bbl'].includes(ext)) {
              category = 'build';
            } else if (ext === 'tex' || ext === 'latex') {
              category = 'tex';
            } else if (ext === 'bib' || ext === 'bst') {
              category = 'bib';
            } else if (ext === 'cls' || ext === 'sty') {
              category = 'style';
            } else if (['png', 'jpg', 'jpeg', 'svg', 'eps'].includes(ext)) {
              category = 'figure';
            }

            if (['tex', 'bib', 'style'].includes(category) || ['log', 'toc', 'aux'].includes(ext)) {
              texMap[rel] = await f.text();
            }

            entries.push({
              relative_path: rel,
              full_path: rel,
              name: f.name,
              category,
              is_main: false
            });
          }

          const mainCandidate =
            Object.keys(texMap).find((k) => k === 'main.tex') ||
            Object.keys(texMap).find((k) => texMap[k].includes('\\documentclass')) ||
            Object.keys(texMap).find((k) => k.endsWith('.tex')) ||
            'main.tex';

          for (const e of entries) {
            if (e.relative_path === mainCandidate) e.is_main = true;
          }

          const rawMain = texMap[mainCandidate] || '';
          const resolvedMain = resolveLatexInputsInMemory(rawMain, texMap);

          resolve({
            root_dir: rootName,
            project_name: rootName,
            main_tex_path: mainCandidate,
            main_tex_name: this.getFileName(mainCandidate),
            raw_main_content: rawMain,
            resolved_main_content: resolvedMain,
            files: entries,
            tex_files_map: texMap,
            build_dir: `${rootName}/build`
          });
        };
        input.oncancel = () => resolve(null);
        input.click();
      });
    }
  },

  /**
   * Re-escanea un proyecto existente en disco (por ejemplo, tras compilar o guardar archivos en `build/`).
   */
  async refreshProjectWorkspace(rootDir: string): Promise<LatexProjectWorkspace | null> {
    if (!this.isNative() || !rootDir) return null;
    try {
      return await invoke<LatexProjectWorkspace>('open_latex_project', { rootDir });
    } catch {
      return null;
    }
  },

  /**
   * Convierte el documento actual en una estructura de Proyecto LaTeX Modular con carpetas:
   * - `main.tex` (archivo raíz con `\input{secciones/...}`)
   * - `secciones/01-....tex` (un archivo `.tex` por cada `\section{...}`)
   * - `figuras/` (carpeta para imágenes)
   * - `referencias.bib` (bibliografía BibTeX)
   * - `build/` (`main.aux`, `main.toc`, `main.log` y salidas `.pdf`/`.docx`)
   */
  async createModularProjectStructure(
    fullLatexCode: string,
    existingRootDir: string | null = null
  ): Promise<LatexProjectWorkspace | null> {
    const split = splitLatexIntoModularProject(fullLatexCode, 'secciones');

    if (this.isNative()) {
      let targetDir = existingRootDir;
      if (!targetDir) {
        const selected = await open({
          multiple: false,
          directory: true,
          title: 'Elige la carpeta donde crear el Proyecto LaTeX Modular (secciones/ + build/)'
        });
        const chosen = Array.isArray(selected) ? selected[0] : selected;
        if (!chosen || typeof chosen !== 'string') return null;
        targetDir = chosen;
      }

      const ws = await invoke<LatexProjectWorkspace>('create_modular_project', {
        rootDir: targetDir,
        mainTexContent: split.mainTex,
        subfiles: split.subfiles,
        bibContent: split.bibContent
      });

      this.addRecentFile(ws.project_name, ws.root_dir, true);
      return ws;
    } else {
      // Modo virtual en navegador para que también funcione sin escritorio nativo
      const texMap: Record<string, string> = {
        'main.tex': split.mainTex,
        'referencias.bib': split.bibContent,
        'build/main.aux': '\\relax\n',
        'build/main.toc': split.subfiles
          .map((s, idx) => `\\contentsline {section}{\\numberline {${idx + 1}}${s.relative_path}}{${idx + 1}}{}`)
          .join('\n'),
        'build/main.log': 'This is Layratex Build Engine (Version 0.3.0)\nOutput directory: build/\n'
      };

      const files: ProjectFileEntry[] = [
        {
          relative_path: 'main.tex',
          full_path: 'main.tex',
          name: 'main.tex',
          category: 'tex',
          is_main: true
        }
      ];

      for (const sub of split.subfiles as ModularSubfileItem[]) {
        texMap[sub.relative_path] = sub.content;
        files.push({
          relative_path: sub.relative_path,
          full_path: sub.relative_path,
          name: this.getFileName(sub.relative_path),
          category: 'tex',
          is_main: false
        });
      }

      files.push(
        {
          relative_path: 'referencias.bib',
          full_path: 'referencias.bib',
          name: 'referencias.bib',
          category: 'bib',
          is_main: false
        },
        {
          relative_path: 'build/main.aux',
          full_path: 'build/main.aux',
          name: 'main.aux',
          category: 'build',
          is_main: false
        },
        {
          relative_path: 'build/main.toc',
          full_path: 'build/main.toc',
          name: 'main.toc',
          category: 'build',
          is_main: false
        },
        {
          relative_path: 'build/main.log',
          full_path: 'build/main.log',
          name: 'main.log',
          category: 'build',
          is_main: false
        }
      );

      const resolvedMain = resolveLatexInputsInMemory(split.mainTex, texMap);

      return {
        root_dir: 'proyecto-modular-latex',
        project_name: 'proyecto-modular-latex',
        main_tex_path: 'main.tex',
        main_tex_name: 'main.tex',
        raw_main_content: split.mainTex,
        resolved_main_content: resolvedMain,
        files,
        tex_files_map: texMap,
        build_dir: 'proyecto-modular-latex/build'
      };
    }
  },

  /**
   * Guarda quirúrgicamente los cambios hechos sobre el Documento Ensamblado de un proyecto
   * multi-carpeta existente, actualizando cada archivo `\input{...}` en su carpeta original
   * (`chapters/`, `secciones/`, etc.) mediante escritura atómica en disco.
   */
  async saveExistingProjectChanges(
    ws: LatexProjectWorkspace,
    fullAssembledLatex: string
  ): Promise<LatexProjectWorkspace> {
    const payload = syncAssembledLatexToExistingProject(
      fullAssembledLatex,
      ws.raw_main_content,
      ws.tex_files_map
    );

    if (this.isNative()) {
      return await invoke<LatexProjectWorkspace>('save_project_changes', {
        rootDir: ws.root_dir,
        mainTexRel: ws.main_tex_path,
        mainTexContent: payload.mainTexContent,
        updatedSubfiles: payload.updatedSubfiles
      });
    } else {
      const updatedMap: Record<string, string> = {
        ...ws.tex_files_map,
        [ws.main_tex_path]: payload.mainTexContent
      };
      const updatedFiles = [...ws.files];

      for (const sub of payload.updatedSubfiles) {
        updatedMap[sub.relative_path] = sub.content;
        if (!updatedFiles.some((f) => f.relative_path === sub.relative_path)) {
          updatedFiles.push({
            relative_path: sub.relative_path,
            full_path: sub.relative_path,
            name: this.getFileName(sub.relative_path),
            category: 'tex',
            is_main: false
          });
        }
      }

      const resolvedMain = resolveLatexInputsInMemory(payload.mainTexContent, updatedMap);
      return {
        ...ws,
        raw_main_content: payload.mainTexContent,
        resolved_main_content: resolvedMain,
        files: updatedFiles,
        tex_files_map: updatedMap
      };
    }
  },

  async cleanProjectBuildDir(rootDir: string): Promise<number> {
    if (!this.isNative()) return 0;
    return await invoke<number>('clean_project_build_dir', { rootDir });
  },

  async openTexFile(): Promise<{ path: string | null; content: string | null; name: string } | null> {
    if (this.isNative()) {
      try {
        const selected = await open({
          multiple: false,
          directory: false,
          filters: [
            { name: 'Documentos LaTeX (*.tex, *.latex)', extensions: ['tex', 'latex', 'txt'] },
            { name: 'Todos los archivos (*.*)', extensions: ['*'] }
          ]
        });

        const selectedPath = Array.isArray(selected) ? selected[0] : selected;
        if (!selectedPath || typeof selectedPath !== 'string') {
          return null;
        }

        const content = await this.readNativeFile(selectedPath);
        const name = this.getFileName(selectedPath);
        this.addRecentFile(name, selectedPath);

        return { path: selectedPath, content, name };
      } catch (err) {
        console.error('Error al abrir archivo con Tauri:', err);
        throw err;
      }
    } else {
      // Fallback para navegador web (File System Access API o input file)
      if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
        try {
          const [handle] = await (window as any).showOpenFilePicker({
            types: [
              {
                description: 'Documentos LaTeX (.tex)',
                accept: { 'text/x-tex': ['.tex', '.latex', '.txt'] }
              }
            ],
            multiple: false
          });
          const file = await handle.getFile();
          const content = await file.text();
          return { path: null, content, name: file.name };
        } catch (err: any) {
          if (err?.name === 'AbortError') return null;
        }
      }

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
        input.oncancel = () => resolve(null);
        input.click();
      });
    }
  },

  async saveTexFile(
    currentPath: string | null,
    content: string,
    suggestedName: string = 'documento.tex'
  ): Promise<{ path: string; name: string } | null> {
    const cleanDefaultName = suggestedName.toLowerCase().endsWith('.tex')
      ? suggestedName
      : `${suggestedName.replace(/\.(pdf|docx)$/i, '')}.tex`;

    if (this.isNative()) {
      let targetPath = currentPath;

      if (!targetPath) {
        const selected = await save({
          filters: [
            { name: 'Documento LaTeX (*.tex)', extensions: ['tex'] },
            { name: 'Todos los archivos (*.*)', extensions: ['*'] }
          ],
          defaultPath: cleanDefaultName
        });

        if (!selected) return null;
        targetPath = selected;
      }

      const finalPath = await this.writeNativeFile(targetPath, content);
      const name = this.getFileName(finalPath);
      this.addRecentFile(name, finalPath);

      return { path: finalPath, name };
    } else {
      const downloadName = currentPath ? this.getFileName(currentPath) : cleanDefaultName;
      const blob = new Blob([content], { type: 'text/x-tex;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName.toLowerCase().endsWith('.tex') ? downloadName : `${downloadName}.tex`;
      a.click();
      URL.revokeObjectURL(url);
      return { path: a.download, name: a.download };
    }
  },

  async saveTexFileAs(
    content: string,
    suggestedName: string = 'documento.tex'
  ): Promise<{ path: string; name: string } | null> {
    const cleanDefaultName = suggestedName.toLowerCase().endsWith('.tex')
      ? suggestedName
      : `${suggestedName.replace(/\.(pdf|docx)$/i, '')}.tex`;

    if (this.isNative()) {
      const selected = await save({
        filters: [
          { name: 'Documento LaTeX (*.tex)', extensions: ['tex'] },
          { name: 'Todos los archivos (*.*)', extensions: ['*'] }
        ],
        defaultPath: cleanDefaultName
      });

      if (!selected) return null;

      const finalPath = await this.writeNativeFile(selected, content);
      const name = this.getFileName(finalPath);
      this.addRecentFile(name, finalPath);

      return { path: finalPath, name };
    } else {
      return this.saveTexFile(null, content, cleanDefaultName);
    }
  },

  async readFileFromPath(filePath: string): Promise<string> {
    if (this.isNative()) {
      const content = await this.readNativeFile(filePath);
      this.addRecentFile(this.getFileName(filePath), filePath);
      return content;
    }
    throw new Error('Lectura por ruta directa sólo disponible en la versión de escritorio.');
  },

  // Gestión de Archivos y Proyectos Recientes
  getRecentFiles(): FileItem[] {
    try {
      const data = localStorage.getItem(RECENT_FILES_KEY);
      if (!data) return [];
      return JSON.parse(data) as FileItem[];
    } catch {
      return [];
    }
  },

  addRecentFile(name: string, path: string, isProject = false): void {
    try {
      const list = this.getRecentFiles().filter((f) => f.path !== path);
      list.unshift({ name, path, lastOpened: Date.now(), isProject });
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
